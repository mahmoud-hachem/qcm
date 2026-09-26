import test from 'node:test'
import assert from 'node:assert/strict'
import { parseText } from './questionParser.js'

test('imports the requested page and explanation format, including wrapped text', () => {
  const result = parseText(`Study exam\nQ1. Which approach fits\nthis situation?\nPDF pages: 7–8\nA. First choice\nB. Second choice continued\non another line\nC. Third choice\nD. Fourth choice\nCorrect answer: B\nExplanation: The second choice applies\nthe concept to the situation.\n\nQ2. Another question?\nPDF page: 9\nA. One\nB. Two\nC. Three\nD. Four\nCorrect answer: D\nExplanation: Four is the answer.`)
  assert.equal(result.valid_count, 2)
  assert.equal(result.questions[0].question_text, 'Which approach fits this situation?')
  assert.equal(result.questions[0].option_b, 'Second choice continued on another line')
  assert.equal(result.questions[0].pdf_page, '7–8')
  assert.equal(result.questions[0].explanation, 'The second choice applies the concept to the situation.')
  assert.equal(result.questions[1].correct_answer, 'D')
})

test('skips a question missing its explanation or page', () => {
  const result = parseText(`Q1. Incomplete?\nA. One\nB. Two\nC. Three\nD. Four\nCorrect answer: A\nQ2. Complete?\nPDF page: 4\nA. One\nB. Two\nC. Three\nD. Four\nCorrect answer: C\nExplanation: Three.`)
  assert.equal(result.detected_count, 2)
  assert.equal(result.valid_count, 1)
  assert.equal(result.invalid_count, 1)
  assert.match(result.errors[0].messages.join(' '), /PDF page|explanation/)
})

test('preserves imports from the older marker format', () => {
  const result = parseText(`[QUESTION_START]\nID: 1\nQUESTION: A question?\nOPTION_A: One\nOPTION_B: Two\nOPTION_C: Three\nOPTION_D: Four\nCORRECT_ANSWER: A\n[QUESTION_END]`)
  assert.equal(result.valid_count, 1)
  assert.equal(result.questions[0].pdf_page, '')
  assert.equal(result.questions[0].explanation, '')
})
