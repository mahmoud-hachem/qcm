export const LETTERS = ['A', 'B', 'C', 'D']

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
