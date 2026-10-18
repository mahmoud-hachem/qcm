export const TYPE_LABELS = { MCQ: 'Multiple choice', TRUE_FALSE: 'True / False', CLOZE: 'Paragraph blanks', FILL_BLANK: 'Typed blanks' }
export const isBlankQuestion = question => Array.isArray(question.blanks) && question.blanks.length > 0
export const choiceLetters = question => 'ABCD'.split('').filter(letter => question[`option_${letter.toLowerCase()}`] != null)
export const normalizeAnswer = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')
const filled = value => typeof value === 'string' && value.trim().length > 0

export function hasAnswer(question, answer) {
  return isBlankQuestion(question) ? question.blanks.some(blank => filled(answer?.[blank.id])) : filled(answer)
}

export function isCompleteAnswer(question, answer) {
  return isBlankQuestion(question) ? question.blanks.every(blank => filled(answer?.[blank.id])) : filled(answer)
}

export function gradeAnswer(question, answer) {
  if (!isBlankQuestion(question)) return { is_correct: filled(answer) && (question.accepted_answers ? question.accepted_answers.some(value => normalizeAnswer(value) === normalizeAnswer(answer)) : answer === question.correct_answer), correct_answer: question.correct_answer }
  const blank_results = question.blanks.map(blank => {
    const selected = answer?.[blank.id]
    const is_correct = filled(selected) && (blank.type === 'MCQ' ? selected === blank.correct_answer : blank.accepted_answers.some(value => normalizeAnswer(value) === normalizeAnswer(selected)))
    return { id: blank.id, is_correct, correct_answer: blank.correct_answer, accepted_answers: blank.accepted_answers }
  })
  return { is_correct: blank_results.every(blank => blank.is_correct), blank_results }
}

export function publicQuestion(question) {
  const { correct_answer, accepted_answers, ...visible } = question
  return { ...visible, ...(question.blanks ? { blanks: question.blanks.map(publicQuestion) } : {}) }
}

export function answerDescription(question, answer) {
  if (isBlankQuestion(question)) return question.blanks.map(blank => `Blank ${blank.id}: ${answerDescription(blank, answer?.[blank.id])}`).join(' · ')
  return answer ? question[`option_${String(answer).toLowerCase()}`] || String(answer) : 'Unanswered'
}

export function correctDescription(question) {
  if (isBlankQuestion(question)) return question.blanks.map(blank => `Blank ${blank.id}: ${correctDescription(blank)}`).join(' · ')
  return question.accepted_answers?.join(' / ') || answerDescription(question, question.correct_answer)
}
