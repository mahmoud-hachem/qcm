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

export function shuffledOptionOrder() {
  const order = [...LETTERS]
  for (let index = order.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[order[index], order[swap]] = [order[swap], order[index]]
  }
  return order.join('')
}

export function isOptionOrder(order) {
  return typeof order === 'string' && order.length === 4 && LETTERS.every(letter => order.includes(letter))
}

export function displayedLetter(order, originalLetter) {
  if (!originalLetter) return null
  return LETTERS[isOptionOrder(order) ? order.indexOf(originalLetter) : LETTERS.indexOf(originalLetter)] || null
}

export function questionForDisplay(question, order) {
  if (!isOptionOrder(order)) return question
  const options = Object.fromEntries(LETTERS.map((letter, index) => [
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
