import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseText } from './questionParser.js'
import { gradeAnswer, hasAnswer, isCompleteAnswer, publicQuestion } from './questionModel.js'
import { isQuestionOptionOrder, optionOrderForQuestion, questionForDisplay } from './questionOrder.js'
import { mergeWorkspaces } from './workspaceMigration.js'

const sample = readFileSync(new URL('../sample/sample-mixed-exam.txt', import.meta.url), 'utf8')
const parsed = parseText(sample)

test('one pasted exam imports all formats and a paragraph with mixed blanks', () => {
  assert.deepEqual(parsed.errors, [])
  assert.deepEqual(parsed.questions.map(q => q.type), ['MCQ', 'TRUE_FALSE', 'CLOZE', 'FILL_BLANK', 'CLOZE'])
  assert.equal(parsed.questions[1].option_c, undefined)
  assert.deepEqual(parsed.questions[4].blanks.map(b => b.type), ['MCQ', 'TEXT'])
})

test('MCQ and true/false grade against their actual answer keys', () => {
  for (const q of parsed.questions.slice(0, 2)) {
    assert.equal(gradeAnswer(q, q.correct_answer).is_correct, true)
    assert.equal(gradeAnswer(q, 'A').is_correct, false)
    assert.equal(gradeAnswer(q, null).is_correct, false)
  }
})

test('dropdown paragraphs require all answers and preserve per-blank results', () => {
  const q = parsed.questions[2]
  assert.equal(gradeAnswer(q, { 1: 'C', 2: 'B' }).is_correct, true)
  const partial = gradeAnswer(q, { 1: 'C' })
  assert.equal(partial.is_correct, false)
  assert.deepEqual(partial.blank_results.map(b => b.is_correct), [true, false])
  assert.equal(isCompleteAnswer(q, { 1: 'C' }), false)
  assert.equal(hasAnswer(q, { 1: 'C' }), true)
  assert.equal(hasAnswer(q, {}), false)
})

test('typed answers accept listed equivalents, case and whitespace while rejecting other concepts', () => {
  const q = parsed.questions[3]
  assert.equal(gradeAnswer(q, { 1: '  DATA   REPLICATION ', 2: 'CACHE' }).is_correct, true)
  assert.equal(gradeAnswer(q, { 1: 'duplication', 2: 'cache' }).is_correct, false)
  assert.equal(gradeAnswer(q, { 1: 'replication', 2: '  ' }).is_correct, false)
  assert.equal(gradeAnswer(q.blanks[0], 'REPLICATION').is_correct, true)
  assert.equal(gradeAnswer(parsed.questions[4], { 1: 'B', 2: 'idempotent' }).is_correct, true)
})

test('active exam questions do not expose any blank answer keys or accepted variants', () => {
  const visible = publicQuestion(parsed.questions[4])
  assert.equal(visible.blanks[0].correct_answer, undefined)
  assert.equal(visible.blanks[1].accepted_answers, undefined)
  assert.equal(visible.blanks[0].option_b, 'Stateless')
  assert.equal(publicQuestion(parsed.questions[0]).correct_answer, undefined)
})

test('shuffled dropdown review maps the key and response together without changing typed text', () => {
  const q = parsed.questions[4]
  const answer = { ...q, selected_answer: { 1: 'B', 2: 'IDEMPOTENT' } }
  const displayed = questionForDisplay(answer, { 1: 'DCBA', 2: '' })
  assert.equal(displayed.blanks[0].correct_answer, 'C')
  assert.equal(displayed.blanks[0].option_c, 'Stateless')
  assert.deepEqual(displayed.selected_answer, { 1: 'C', 2: 'IDEMPOTENT' })
  assert.equal(gradeAnswer(displayed, displayed.selected_answer).is_correct, true)
  const tf = questionForDisplay({ ...parsed.questions[1], selected_answer: 'B' }, 'BA')
  assert.equal(tf.correct_answer, 'A')
  assert.equal(tf.selected_answer, 'A')
  assert.equal(tf.option_a, 'False')
})

test('generated option orders are valid for every type, including two choices and typed blanks', () => {
  for (const q of parsed.questions) {
    assert.equal(isQuestionOptionOrder(q, optionOrderForQuestion(q, true)), true)
    assert.equal(isQuestionOptionOrder(q, optionOrderForQuestion(q, false)), true)
  }
  assert.equal(isQuestionOptionOrder(parsed.questions[2], { 1: 'AABC', 2: 'ABCD' }), false)
})

test('malformed paragraph blocks cannot silently lose blanks on import', () => {
  for (const malformed of [
    sample.replace('Blank 2: MCQ', 'Blank 3: MCQ'),
    sample.replace('[[2]]', '[[1]]'),
    sample.replace('Accepted answers: cache | data cache', 'Accepted answers:'),
    sample.replace('Type: CLOZE', 'Type: UNKNOWN'),
    sample.replace('Blank 1: MCQ', 'Blank 1: UNKNOWN'),
  ]) assert.ok(parseText(malformed).errors.length > 0)
})

test('true/false accepts literal True or False answer labels and inferred choices', () => {
  const result = parseText('Q1. A queue is FIFO.\nType: TRUE_FALSE\nPDF page: 1\nCorrect answer: True\nExplanation: Oldest goes first.')
  assert.deepEqual(result.errors, [])
  assert.equal(result.questions[0].correct_answer, 'A')
  assert.equal(result.questions[0].option_b, 'False')
})

test('shared workspace migration retains both libraries even when all original IDs overlap', () => {
  const library = name => ({ courses: [{ id: 1, name }], exams: [{ id: 2, course_id: 1, questions: [{ ...parsed.questions[2], id: 3 }] }], attempts: [{ id: 4, exam_id: 2, answers: [{ question_id: 3, selected_answer: { 1: 'C' }, option_order: { 1: 'DCBA', 2: 'ABCD' } }] }], nextId: 5 })
  const first = library('First'), second = library('Second')
  const merged = mergeWorkspaces([first, second])
  assert.deepEqual(merged.courses.map(c => c.name), ['First', 'Second'])
  assert.equal(merged.exams.length, 2)
  const ids = merged.courses.concat(merged.exams, merged.exams.flatMap(e => e.questions), merged.attempts).map(item => item.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const attempt of merged.attempts) {
    const exam = merged.exams.find(e => e.id === attempt.exam_id)
    assert.ok(merged.courses.some(c => c.id === exam.course_id))
    assert.ok(exam.questions.some(q => q.id === attempt.answers[0].question_id))
  }
  assert.deepEqual(merged.attempts[1].answers[0].selected_answer, { 1: 'C' })
  assert.equal(second.exams[0].id, 2)
})
