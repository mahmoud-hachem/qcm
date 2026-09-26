import test from 'node:test'
import assert from 'node:assert/strict'
import { questionsByPdfPage, questionsForMode } from './questionOrder.js'

test('study questions follow source PDF pages and keep ties in source order', () => {
  const source = [
    { id: 1, pdf_page: '12' },
    { id: 2, pdf_page: '3–4' },
    { id: 3, pdf_page: '3' },
    { id: 4, pdf_page: '8' },
  ]
  assert.deepEqual(questionsByPdfPage(source).map(question => question.id), [2, 3, 4, 1])
  assert.deepEqual(source.map(question => question.id), [1, 2, 3, 4])
})

test('Study Mode never shuffles and preserves source pages and explanations', () => {
  const source = [
    { id: 1, pdf_page: '12', explanation: 'Later concept.' },
    { id: 2, pdf_page: '3–4', explanation: 'Earlier concept.' },
  ]
  const order = questionsForMode(source, 'study', () => { throw new Error('Study Mode must not use randomness') })
  assert.deepEqual(order, [source[1], source[0]])
  assert.equal(order[0].pdf_page, '3–4')
  assert.equal(order[0].explanation, 'Earlier concept.')
})

test('Exam Mode changes question order without losing or duplicating questions', () => {
  const source = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]
  const order = questionsForMode(source, 'exam', () => 0.9999)
  assert.deepEqual(source.map(question => question.id), [1, 2, 3, 4])
  assert.notDeepEqual(order.map(question => question.id), [1, 2, 3, 4])
  assert.deepEqual(order.map(question => question.id).sort(), [1, 2, 3, 4])
})
