import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { parseText } from './questionParser.js'
import { gradeAnswer, publicQuestion } from './questionModel.js'
import { optionOrderForQuestion } from './questionOrder.js'

test('mixed questions render choice buttons, inline selects, text inputs, and per-blank feedback', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  try {
    const { QuestionResponse, QuestionFeedback } = await vite.ssrLoadModule('/src/QuestionResponse.jsx')
    const questions = parseText(readFileSync(new URL('../sample/sample-mixed-exam.txt', import.meta.url), 'utf8')).questions
    const expectedControls = [[4, 0, 0], [2, 0, 0], [0, 2, 0], [0, 0, 2], [0, 1, 1]]
    for (const [index, question] of questions.entries()) {
      const order = optionOrderForQuestion(question)
      const html = renderToStaticMarkup(React.createElement(QuestionResponse, { question: publicQuestion(question), order, onChange: () => {} }))
      assert.deepEqual([html.match(/<button/g)?.length || 0, html.match(/<select/g)?.length || 0, html.match(/<input/g)?.length || 0], expectedControls[index])
      assert.ok(!html.includes('[[1]]'))
      if (question.blanks) {
        const answer = Object.fromEntries(question.blanks.map(blank => [blank.id, blank.correct_answer || blank.accepted_answers[0]]))
        const feedback = gradeAnswer(question, answer)
        const result = renderToStaticMarkup(React.createElement(QuestionResponse, { question: publicQuestion(question), answer, order, feedback, disabled: true, onChange: () => {} }))
        assert.equal(result.match(/blank-correct/g).length, question.blanks.length)
        const explanation = renderToStaticMarkup(React.createElement(QuestionFeedback, { question: publicQuestion(question), feedback, order }))
        assert.match(explanation, /role="status"/)
        assert.match(explanation, /All blanks must be correct/)
        const incorrect = renderToStaticMarkup(React.createElement(QuestionFeedback, { question: publicQuestion(question), feedback: gradeAnswer(question, {}), order }))
        assert.match(incorrect, /Correct answers:/)
        for (const blank of question.blanks) assert.ok(incorrect.includes(blank.accepted_answers?.[0] || blank[`option_${blank.correct_answer.toLowerCase()}`]))
      }
    }
  } finally { await vite.close() }
})
