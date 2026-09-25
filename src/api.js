import { parsePdf } from './pdf'
import { isOptionOrder, questionForDisplay } from './questionOrder'

const DATABASE = 'quizflow-local'
const STORE = 'workspace'
export const PROFILES = [
  { id: 'mahmoud', name: 'Mahmoud', initial: 'M' },
  { id: 'amer', name: 'Amer', initial: 'A' },
]
let activeProfile = null
let writeQueue = Promise.resolve()

export function setActiveProfile(id) {
  if (id !== null && !PROFILES.some(profile => profile.id === id)) throw new Error('Choose a valid profile.')
  activeProfile = id
}

function workspaceRecord() {
  if (!activeProfile) throw new Error('Choose a profile to open your workspace.')
  // Keep the existing workspace intact: all pre-profile data belongs to Mahmoud.
  return activeProfile === 'mahmoud' ? 'data' : 'profile:amer'
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Browser storage is unavailable. Enable site storage and try again.'))
  })
}

async function read(record = workspaceRecord()) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly')
    const request = transaction.objectStore(STORE).get(record)
    request.onsuccess = () => resolve(request.result || { courses: [], exams: [], attempts: [], nextId: 1 })
    request.onerror = () => reject(new Error('Could not read your browser workspace.'))
    transaction.oncomplete = () => db.close()
  })
}

async function write(data, record) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(data, record)
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => { db.close(); reject(new Error('Could not save to this browser. Check its storage settings or available space.')) }
  })
}

function change(update) {
  // Capture before queuing so switching profiles cannot redirect pending writes.
  const record = workspaceRecord()
  const result = writeQueue.then(async () => {
    const data = await read(record)
    const answer = update(data)
    await write(data, record)
    return answer
  })
  writeQueue = result.catch(() => {})
  return result
}

function fail(message) { throw new Error(message) }
function requiredCourse(data, id) { return data.courses.find(course => course.id === Number(id)) || fail('Course not found.') }
function requiredExam(data, id) { return data.exams.find(exam => exam.id === Number(id)) || fail('Exam not found.') }
function requiredAttempt(data, id) { return data.attempts.find(attempt => attempt.id === Number(id)) || fail('Attempt not found.') }
function now() { return new Date().toISOString() }
function nextId(data) { return data.nextId++ }

function examSummary(data, exam) {
  const attempts = data.attempts.filter(item => item.exam_id === exam.id).sort((a, b) => b.completed_at.localeCompare(a.completed_at))
  const course = requiredCourse(data, exam.course_id)
  return { id: exam.id, course_id: exam.course_id, course_name: course.name, title: exam.title,
    created_at: exam.created_at, question_count: exam.questions.length, attempt_count: attempts.length,
    best_score: attempts.length ? Math.max(...attempts.map(item => item.percentage)) : null,
    last_score: attempts[0]?.percentage ?? null, last_studied: attempts[0]?.completed_at ?? null,
    latest_attempt_id: attempts[0]?.id ?? null }
}

function courseSummary(data, course) {
  const exams = data.exams.filter(exam => exam.course_id === course.id)
  const ids = new Set(exams.map(exam => exam.id))
  const attempts = data.attempts.filter(attempt => ids.has(attempt.exam_id))
  return { id: course.id, name: course.name, created_at: course.created_at, exam_count: exams.length,
    question_count: exams.reduce((total, exam) => total + exam.questions.length, 0),
    average_score: attempts.length ? Math.round(attempts.reduce((total, attempt) => total + attempt.percentage, 0) / attempts.length * 10) / 10 : null,
    attempt_count: attempts.length, last_studied: attempts.length ? attempts.map(attempt => attempt.completed_at).sort().at(-1) : null }
}

function attemptSummary(data, attempt) {
  const exam = requiredExam(data, attempt.exam_id)
  return { id: attempt.id, exam_id: attempt.exam_id, exam_title: exam.title,
    course_id: exam.course_id, course_name: requiredCourse(data, exam.course_id).name,
    mode: attempt.mode, score: attempt.score, total_questions: attempt.total_questions,
    percentage: attempt.percentage, correct_count: attempt.correct_count,
    wrong_count: attempt.wrong_count, unanswered_count: attempt.unanswered_count,
    completed_at: attempt.completed_at }
}

export const api = {
  dashboard: async () => {
    const data = await read()
    const courses = data.courses.map(course => courseSummary(data, course))
    const exams = [...data.exams].sort((a, b) => b.created_at.localeCompare(a.created_at))
    const attempts = [...data.attempts].sort((a, b) => b.completed_at.localeCompare(a.completed_at))
    const ranked = courses.filter(course => course.average_score !== null).sort((a, b) => b.average_score - a.average_score)
    return { total_courses: courses.length, total_exams: exams.length, total_attempts: attempts.length,
      average_score: attempts.length ? Math.round(attempts.reduce((sum, item) => sum + item.percentage, 0) / attempts.length * 10) / 10 : null,
      recent_exams: exams.slice(0, 5).map(exam => examSummary(data, exam)),
      recent_attempts: attempts.slice(0, 5).map(attempt => attemptSummary(data, attempt)),
      best_course: ranked[0] || null, courses }
  },
  courses: async () => { const data = await read(); return [...data.courses].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(course => courseSummary(data, course)) },
  course: async id => { const data = await read(); const course = requiredCourse(data, id); return { ...courseSummary(data, course), exams: data.exams.filter(exam => exam.course_id === course.id).map(exam => examSummary(data, exam)) } },
  createCourse: name => change(data => { if (!name.trim()) fail('Enter a course name.'); const course = { id: nextId(data), name: name.trim(), created_at: now() }; data.courses.push(course); return course }),
  renameCourse: (id, name) => change(data => { if (!name.trim()) fail('Enter a course name.'); const course = requiredCourse(data, id); course.name = name.trim(); return course }),
  deleteCourse: id => change(data => { requiredCourse(data, id); const examIds = new Set(data.exams.filter(exam => exam.course_id === Number(id)).map(exam => exam.id)); data.attempts = data.attempts.filter(attempt => !examIds.has(attempt.exam_id)); data.exams = data.exams.filter(exam => !examIds.has(exam.id)); data.courses = data.courses.filter(course => course.id !== Number(id)) }),
  exams: async () => { const data = await read(); return [...data.exams].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(exam => examSummary(data, exam)) },
  exam: async id => { const data = await read(); const exam = requiredExam(data, id); return { ...examSummary(data, exam), questions: exam.questions.map(({ correct_answer, ...question }) => question) } },
  examReview: async id => { const data = await read(); const exam = requiredExam(data, id); return { ...examSummary(data, exam), questions: exam.questions } },
  renameExam: (id, title) => change(data => { if (!title.trim()) fail('Enter an exam title.'); const exam = requiredExam(data, id); exam.title = title.trim(); return { id: exam.id, title: exam.title } }),
  deleteExam: id => change(data => { requiredExam(data, id); data.exams = data.exams.filter(exam => exam.id !== Number(id)); data.attempts = data.attempts.filter(attempt => attempt.exam_id !== Number(id)) }),
  preview: parsePdf,
  saveExam: payload => change(data => {
    requiredCourse(data, payload.course_id)
    if (!payload.title?.trim()) fail('Enter an exam title.')
    if (!payload.questions?.length) fail('Add at least one valid question.')
    const ids = payload.questions.map(question => question.source_id)
    if (new Set(ids).size !== ids.length) fail('Question IDs must be unique.')
    const exam = { id: nextId(data), course_id: Number(payload.course_id), title: payload.title.trim(), created_at: now(), questions: payload.questions.map((question, index) => ({ ...question, id: nextId(data), question_number: index + 1 })) }
    data.exams.push(exam)
    return { id: exam.id, course_id: exam.course_id, title: exam.title }
  }),
  check: async (id, questionId, selectedAnswer) => { const data = await read(); const question = requiredExam(data, id).questions.find(item => item.id === Number(questionId)) || fail('Question not found in this exam.'); return { correct_answer: question.correct_answer, is_correct: selectedAnswer === question.correct_answer } },
  submit: (id, payload) => change(data => {
    const exam = requiredExam(data, id)
    const questions = new Map(exam.questions.map(question => [question.id, question]))
    const ids = payload.question_ids.map(Number)
    if (!ids.length || ids.length !== new Set(ids).size || ids.some(qid => !questions.has(qid))) fail('The selected questions do not belong to this exam.')
    if (Object.keys(payload.answers).some(qid => !ids.includes(Number(qid)))) fail('An answer refers to a question outside this attempt.')
    if (payload.option_orders && ids.some(qid => !isOptionOrder(payload.option_orders[qid]))) fail('The answer order for this attempt is invalid.')
    const answers = ids.map(qid => ({ question_id: qid, selected_answer: payload.answers[qid] || null,
      is_correct: payload.answers[qid] === questions.get(qid).correct_answer,
      option_order: payload.option_orders?.[qid] || null }))
    const correct = answers.filter(answer => answer.is_correct).length
    const unanswered = answers.filter(answer => !answer.selected_answer).length
    const attempt = { id: nextId(data), exam_id: exam.id, mode: payload.mode, score: correct,
      total_questions: ids.length, percentage: Math.round(correct / ids.length * 1000) / 10,
      correct_count: correct, wrong_count: ids.length - correct - unanswered,
      unanswered_count: unanswered, completed_at: now(), answers }
    data.attempts.push(attempt)
    return { id: attempt.id }
  }),
  attempts: async examId => { const data = await read(); return data.attempts.filter(attempt => !examId || attempt.exam_id === Number(examId)).sort((a, b) => b.completed_at.localeCompare(a.completed_at)).map(attempt => attemptSummary(data, attempt)) },
  attempt: async id => { const data = await read(); const attempt = requiredAttempt(data, id); const exam = requiredExam(data, attempt.exam_id); const questions = new Map(exam.questions.map(question => [question.id, question])); return { ...attemptSummary(data, attempt), answers: attempt.answers.map(answer => questionForDisplay({ ...questions.get(answer.question_id), selected_answer: answer.selected_answer, is_correct: answer.is_correct }, answer.option_order)) } },
  exportWorkspace: async () => ({ version: 1, exported_at: now(), data: await read() }),
  importWorkspace: payload => change(data => {
    const incoming = payload?.data
    if (payload?.version !== 1 || !incoming || !Array.isArray(incoming.courses) || !Array.isArray(incoming.exams) || !Array.isArray(incoming.attempts) || !Number.isInteger(incoming.nextId)) fail('This is not a valid QuizFlow backup.')
    data.courses = incoming.courses
    data.exams = incoming.exams
    data.attempts = incoming.attempts
    data.nextId = incoming.nextId
  }),
}
