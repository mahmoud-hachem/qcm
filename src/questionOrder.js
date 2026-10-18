import { choiceLetters, isBlankQuestion } from './questionModel.js'

export const LETTERS = ['A', 'B', 'C', 'D']

export function questionsByPdfPage(questions) {
  const firstPage = question => {
    const match = /^\s*(\d+)/.exec(question.pdf_page || '')
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY
  }
  return questions.map((question, index) => ({ question, index }))
    .sort((a, b) => firstPage(a.question) - firstPage(b.question) || a.index - b.index)
    .map(item => item.question)
}

export function shuffledQuestions(questions, random = Math.random) {
  const order = [...questions]
  for (let index = order.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1))
    ;[order[index], order[swap]] = [order[swap], order[index]]
  }
  if (order.length > 1 && order.every((question, index) => question === questions[index])) {
    ;[order[0], order[1]] = [order[1], order[0]]
  }
  return order
}

export function questionsForMode(questions, mode, random = Math.random) {
  return mode === 'exam' ? shuffledQuestions(questions, random) : questionsByPdfPage(questions)
}

export function shuffledOptionOrder(letters = LETTERS) {
  const order = [...letters]
  for (let index = order.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[order[index], order[swap]] = [order[swap], order[index]]
  }
  return order.join('')
}

export function isOptionOrder(order, letters = LETTERS) {
  return typeof order === 'string' && order.length === letters.length && letters.every(letter => order.includes(letter))
}

export function optionOrderForQuestion(question, shuffle = false) {
  if (isBlankQuestion(question)) return Object.fromEntries(question.blanks.map(blank => [blank.id, optionOrderForQuestion(blank, shuffle)]))
  const letters = choiceLetters(question)
  return shuffle ? shuffledOptionOrder(letters) : letters.join('')
}

export function isQuestionOptionOrder(question, order) {
  return isBlankQuestion(question) ? !!order && question.blanks.every(blank => isQuestionOptionOrder(blank, order[blank.id])) : isOptionOrder(order, choiceLetters(question))
}

export function displayedLetter(order, originalLetter) {
  if (!originalLetter) return null
  return LETTERS[typeof order === 'string' ? order.indexOf(originalLetter) : LETTERS.indexOf(originalLetter)] || null
}

export function questionForDisplay(question, order) {
  if (isBlankQuestion(question)) {
    const blanks = question.blanks.map(blank => questionForDisplay({ ...blank, selected_answer: question.selected_answer?.[blank.id] }, order?.[blank.id]))
    return { ...question, blanks, selected_answer: question.selected_answer ? Object.fromEntries(blanks.map(blank => [blank.id, blank.selected_answer])) : null }
  }
  const letters = choiceLetters(question)
  if (!letters.length || !isOptionOrder(order, letters)) return question
  const options = Object.fromEntries(letters.map((letter, index) => [
    `option_${letter.toLowerCase()}`,
    question[`option_${order[index].toLowerCase()}`],
  ]))
  return {
    ...question,
    ...options,
    correct_answer: displayedLetter(order, question.correct_answer),
    selected_answer: displayedLetter(order, question.selected_answer),
  }
}
