// Reassign every reference so the old libraries can safely have overlapping IDs.
export function mergeWorkspaces(workspaces) {
  const merged = { courses: [], exams: [], attempts: [], nextId: 1 }
  for (const workspace of workspaces.filter(Boolean)) {
    const courses = new Map(), exams = new Map(), questions = new Map()
    for (const course of workspace.courses || []) {
      const id = merged.nextId++
      courses.set(course.id, id)
      merged.courses.push({ ...course, id })
    }
    for (const exam of workspace.exams || []) {
      const id = merged.nextId++
      exams.set(exam.id, id)
      merged.exams.push({ ...exam, id, course_id: courses.get(exam.course_id), questions: exam.questions.map(question => {
        const questionId = merged.nextId++
        questions.set(question.id, questionId)
        return { ...question, id: questionId }
      }) })
    }
    for (const attempt of workspace.attempts || []) merged.attempts.push({ ...attempt, id: merged.nextId++, exam_id: exams.get(attempt.exam_id), answers: attempt.answers.map(answer => ({ ...answer, question_id: questions.get(answer.question_id) })) })
  }
  return merged
}
