import { Check, CheckCircle2, CircleHelp, X } from 'lucide-react'
import { choiceLetters, correctDescription, isBlankQuestion, TYPE_LABELS } from './questionModel.js'
import { displayedLetter } from './questionOrder.js'

export function QuestionResponse({ question, answer, order, onChange, disabled, feedback, headingId }) {
  const q = question
  const blankQuestion = isBlankQuestion(q)
  return <>
    <p className="question-type">{TYPE_LABELS[q.type] || TYPE_LABELS.MCQ}</p>
    {blankQuestion ? <div id={headingId} className="cloze-paragraph" aria-label="Complete the paragraph">{q.question_text.split(/(\[\[\d+\]\])/g).map((part, index) => {
      const id = /^\[\[(\d+)\]\]$/.exec(part)?.[1]
      if (!id) return <span key={index}>{part}</span>
      const blank = q.blanks.find(item => item.id === id)
      const result = feedback?.blank_results?.find(item => item.id === id)
      const value = answer?.[id] || ''
      const label = `Blank ${id}${result ? result.is_correct ? ', correct' : ', incorrect' : ''}`
      return <span key={index} className={`inline-blank ${result ? result.is_correct ? 'blank-correct' : 'blank-wrong' : ''}`}>
        {blank.type === 'MCQ' ? <select aria-label={label} value={value} disabled={disabled} style={{ width: `${Math.min(32, Math.max(15, (blank[`option_${value.toLowerCase()}`]?.length || 0) + 5))}ch` }} onChange={event => onChange({ ...(answer || {}), [id]: event.target.value })}>
          <option value="" disabled>Blank {id} ▾</option>
          {(order?.[id] || choiceLetters(blank).join('')).split('').map((letter, optionIndex) => <option key={letter} value={letter}>{'ABCD'[optionIndex]}. {blank[`option_${letter.toLowerCase()}`]}</option>)}
        </select> : <input type="text" aria-label={label} placeholder={`Blank ${id}`} value={value} disabled={disabled} autoComplete="off" autoCapitalize="off" spellCheck={false} onChange={event => onChange({ ...(answer || {}), [id]: event.target.value })} />}
        {result && <span className="blank-indicator" aria-hidden="true">{result.is_correct ? <Check size={14} /> : <X size={14} />}</span>}
      </span>
    })}</div> : <>
      <h2 id={headingId}>{q.question_text}</h2>
      <div className="answer-options" aria-label="Answer choices">{(order || choiceLetters(q).join('')).split('').map((letter, index) => {
        const selected = answer === letter, correct = feedback?.correct_answer === letter
        return <button type="button" key={letter} aria-pressed={selected} disabled={disabled} onClick={() => onChange(letter)} className={`answer-option ${selected ? 'selected' : ''} ${feedback && correct ? 'correct' : ''} ${feedback && selected && !correct ? 'wrong' : ''}`}>
          <span className="option-letter">{'ABCD'[index]}</span><span className="option-content">{q[`option_${letter.toLowerCase()}`]}</span><span className="choice-indicator" aria-hidden="true">{feedback && selected && !correct ? <X size={17} /> : (selected || (feedback && correct)) ? <Check size={17} /> : null}</span>
        </button>
      })}</div>
    </>}
  </>
}

export function QuestionFeedback({ question, feedback, order }) {
  if (!feedback) return null
  const withKey = { ...question, correct_answer: feedback.correct_answer, blanks: question.blanks?.map(blank => ({ ...blank, ...feedback.blank_results?.find(result => result.id === blank.id) })) }
  return <div className={`study-feedback ${feedback.is_correct ? 'positive' : 'negative'}`} role="status">
    <span className="feedback-icon">{feedback.is_correct ? <CheckCircle2 size={22} /> : <CircleHelp size={22} />}</span>
    <div><strong>{feedback.is_correct ? 'Correct — well done.' : 'Not quite. Review the answer below.'}</strong>
      {!feedback.is_correct && <p>{isBlankQuestion(question) ? 'Correct answers: ' : `Correct answer ${displayedLetter(order, feedback.correct_answer)}: `}{correctDescription(withKey)}</p>}
      {feedback.blank_results && <p>{feedback.blank_results.filter(blank => blank.is_correct).length} of {feedback.blank_results.length} blanks correct. All blanks must be correct to earn the question point.</p>}
      {question.explanation && <p>{question.explanation}</p>}
    </div>
  </div>
}
