const LEGACY_FIELDS = ['ID', 'QUESTION', 'OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D', 'CORRECT_ANSWER']
const LEGACY_CONTINUATIONS = new Set(['QUESTION', 'OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D'])

function parseLegacy(text) {
  const questions = []
  const errors = []
  const seen = new Set()
  let detected = 0
  let block = null
  let startLine = null

  function finish(lines, line, malformed) {
    detected += 1
    const values = {}
    const issues = malformed ? [malformed] : []
    let current = null
    for (const entry of lines) {
      const match = /^([A-Z_]+)\s*:\s*(.*)$/.exec(entry)
      if (!match) {
        if (LEGACY_CONTINUATIONS.has(current)) values[current] = `${values[current]} ${entry}`.trim()
        else issues.push(`Unrecognized line: ${entry.slice(0, 70)}`)
        continue
      }
      const [, key, value] = match
      if (!LEGACY_FIELDS.includes(key)) { issues.push(`Unrecognized field: ${key}`); current = null; continue }
      if (key in values) issues.push(`Duplicate ${key} field`)
      values[key] = value.trim()
      current = key
    }
    for (const field of LEGACY_FIELDS) if (!values[field]) issues.push(`Missing ${field}`)
    let sourceId = values.ID || ''
    if (sourceId && (!/^\d+$/.test(sourceId) || !/[1-9]/.test(sourceId))) issues.push('ID must be a positive whole number')
    else if (sourceId) sourceId = String(BigInt(sourceId))
    if (sourceId && seen.has(sourceId)) issues.push(`Duplicate question ID ${sourceId}`)
    const answer = values.CORRECT_ANSWER || ''
    if (answer && !/^[ABCD]$/.test(answer)) issues.push('CORRECT_ANSWER must be A, B, C, or D')
    if (issues.length) { errors.push({ block: detected, source_id: sourceId || null, line, messages: issues }); return }
    seen.add(sourceId)
    questions.push({ source_id: sourceId, question_number: questions.length + 1,
      question_text: values.QUESTION, option_a: values.OPTION_A, option_b: values.OPTION_B,
      option_c: values.OPTION_C, option_d: values.OPTION_D, correct_answer: answer,
      pdf_page: '', explanation: '' })
  }

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim()
    if (!line) return
    if (line === '[QUESTION_START]') {
      if (block) finish(block, startLine, 'Missing [QUESTION_END] before the next question')
      block = []; startLine = index + 1
    } else if (line === '[QUESTION_END]') {
      if (!block) errors.push({ block: null, source_id: null, line: index + 1, messages: ['Unexpected [QUESTION_END]'] })
      else finish(block, startLine)
      block = null
    } else if (block) block.push(line)
    else errors.push({ block: null, source_id: null, line: index + 1, messages: [`Text outside a question block: ${line.slice(0, 70)}`] })
  })
  if (block) finish(block, startLine, 'Missing [QUESTION_END] at the end of the document')
  if (!detected && !errors.length) errors.push({ block: null, source_id: null, line: null, messages: ['No question blocks were found.'] })
  return { detected_count: detected, valid_count: questions.length, invalid_count: detected - questions.length, questions, errors }
}

function cleanLine(line) {
  return line.trim().replace(/\\$/, '').trim().replace(/^#{1,6}\s+/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^((?:Type|Blank\s+\d+|PDF pages?|Correct answer|Accepted answers|Explanation)\s*:)\*\*/i, '$1')
}

const TYPE_ALIASES = { MCQ: 'MCQ', MULTIPLE_CHOICE: 'MCQ', TRUE_FALSE: 'TRUE_FALSE', TRUE_OR_FALSE: 'TRUE_FALSE', CLOZE: 'CLOZE', MCQ_CLOZE: 'CLOZE', FILL_BLANK: 'FILL_BLANK', FILL_IN_THE_BLANK: 'FILL_BLANK', TEXT: 'TEXT' }
const canonicalType = value => TYPE_ALIASES[value.toUpperCase().replace(/[\s/-]+/g, '_')]

function validateChoices(values, issues, label) {
  const letters = 'ABCD'.split('').filter(letter => values[`OPTION_${letter}`] !== undefined)
  if (letters.length < 2 || letters.join('') !== 'ABCD'.slice(0, letters.length)) issues.push(`${label} needs consecutive choices starting at A (2–4 choices)`)
  for (const letter of letters) if (!values[`OPTION_${letter}`]) issues.push(`${label}: empty option ${letter}`)
  const answer = (values.ANSWER || '').toUpperCase()
  if (!letters.includes(answer)) issues.push(`${label}: correct answer must be an available option letter`)
  return { ...Object.fromEntries(letters.map(letter => [`option_${letter.toLowerCase()}`, values[`OPTION_${letter}`]])), correct_answer: answer }
}

function parseStudyQuestions(text) {
  const questions = [], errors = [], seen = new Set()
  const lines = text.split(/\r?\n/).map(cleanLine)
  const starts = []
  lines.forEach((line, index) => { if (/^Q\s*\d+\s*[.)]\s*/i.test(line)) starts.push(index) })
  starts.forEach((start, blockIndex) => {
    const first = lines[start].match(/^Q\s*(\d+)\s*[.)]\s*(.*)$/i)
    const sourceId = String(BigInt(first[1]))
    const values = { QUESTION: first[2].trim() }, blanks = [], issues = []
    let target = values, current = 'QUESTION'
    function assign(key, value, object = target) {
      if (object[key] !== undefined) issues.push(`Duplicate ${key.toLowerCase().replaceAll('_', ' ')}`)
      object[key] = value.trim()
    }
    for (const line of lines.slice(start + 1, starts[blockIndex + 1] ?? lines.length)) {
      if (!line || /^```/.test(line)) continue
      let match = /^Type\s*:\s*(.*)$/i.exec(line)
      if (match) { assign('TYPE', match[1], values); current = null; continue }
      match = /^PDF\s+pages?\s*:\s*(.*)$/i.exec(line)
      if (match) { assign('PAGE', match[1], values); current = null; continue }
      match = /^Blank\s+(\d+)\s*:\s*(.*)$/i.exec(line)
      if (match) { target = { id: String(BigInt(match[1])), TYPE: match[2].trim() }; blanks.push(target); current = null; continue }
      match = /^([ABCD])\s*[.)]\s*(.*)$/i.exec(line)
      if (match) { current = `OPTION_${match[1].toUpperCase()}`; assign(current, match[2]); continue }
      match = /^Correct\s+answer\s*:\s*(.*)$/i.exec(line)
      if (match) { assign('ANSWER', match[1]); current = null; continue }
      match = /^Accepted\s+answers?\s*:\s*(.*)$/i.exec(line)
      if (match) { assign('ACCEPTED', match[1]); current = 'ACCEPTED'; continue }
      match = /^Explanation\s*:\s*(.*)$/i.exec(line)
      if (match) { target = values; assign('EXPLANATION', match[1]); current = 'EXPLANATION'; continue }
      if (current) target[current] = `${target[current]} ${line}`.trim()
      else issues.push(`Unrecognized line: ${line.slice(0, 70)}`)
    }
    if (seen.has(sourceId)) issues.push(`Duplicate question number ${sourceId}`)
    seen.add(sourceId)
    if (sourceId === '0') issues.push('Question number must be positive')
    for (const field of ['QUESTION', 'PAGE', 'EXPLANATION']) if (!values[field]) issues.push(`Missing ${field === 'PAGE' ? 'PDF page' : field.toLowerCase()}`)
    const page = /^(\d+)(?:\s*[-–—]\s*(\d+))?$/.exec(values.PAGE || '')
    if (values.PAGE && (!page || Number(page[1]) < 1 || (page[2] && Number(page[2]) < Number(page[1])))) issues.push('PDF page must be a positive page number or ascending range')
    const inferred = blanks.length ? (blanks.every(blank => canonicalType(blank.TYPE) === 'TEXT') ? 'FILL_BLANK' : 'CLOZE') : values.OPTION_A?.toLowerCase() === 'true' && values.OPTION_B?.toLowerCase() === 'false' && !values.OPTION_C ? 'TRUE_FALSE' : 'MCQ'
    const type = values.TYPE ? canonicalType(values.TYPE) : inferred
    if (!type || type === 'TEXT') issues.push('Type must be MCQ, TRUE_FALSE, CLOZE, or FILL_BLANK')
    let content = {}
    const markers = [...values.QUESTION.matchAll(/\[\[(\d+)\]\]/g)].map(match => match[1])
    if (type === 'CLOZE' || type === 'FILL_BLANK') {
      if (!blanks.length) issues.push('Add a Blank 1: MCQ or Blank 1: TEXT block for each [[1]] placeholder')
      if (values.ANSWER || values.ACCEPTED || values.OPTION_A) issues.push('Put choices and answers inside their Blank blocks')
      if (new Set(markers).size !== markers.length) issues.push('Each blank placeholder must appear exactly once')
      if (new Set(blanks.map(blank => blank.id)).size !== blanks.length) issues.push('Duplicate blank number')
      content.blanks = blanks.map(blank => {
        const blankType = canonicalType(blank.TYPE)
        const label = `Blank ${blank.id}`
        if (!markers.includes(blank.id)) issues.push(`${label} needs a matching [[${blank.id}]] placeholder`)
        if (blank.id === '0') issues.push('Blank numbers must be positive')
        if (blankType === 'MCQ') {
          if (type === 'FILL_BLANK') issues.push('FILL_BLANK only allows TEXT blanks; use CLOZE for dropdown or mixed blanks')
          if (blank.ACCEPTED) issues.push(`${label}: MCQ blanks use Correct answer, not Accepted answers`)
          return { id: blank.id, type: 'MCQ', ...validateChoices(blank, issues, label) }
        }
        if (blankType !== 'TEXT') issues.push(`${label}: type must be MCQ or TEXT`)
        const accepted_answers = (blank.ACCEPTED || '').split('|').map(value => value.trim()).filter(Boolean)
        if (!accepted_answers.length) issues.push(`${label}: missing Accepted answers`)
        if (blank.ANSWER || blank.OPTION_A) issues.push(`${label}: TEXT blanks use Accepted answers and have no choices`)
        return { id: blank.id, type: 'TEXT', accepted_answers }
      })
      for (const id of markers) if (!blanks.some(blank => blank.id === id)) issues.push(`Missing Blank ${id} definition`)
      if (!markers.length) issues.push('Paragraph needs numbered placeholders such as [[1]]')
    } else {
      if (blanks.length || markers.length) issues.push('Paragraph placeholders require Type: CLOZE or FILL_BLANK')
      if (values.ACCEPTED) issues.push('Typed answers require Type: FILL_BLANK and a Blank block')
      if (type === 'TRUE_FALSE') {
        if (!values.OPTION_A && !values.OPTION_B) { values.OPTION_A = 'True'; values.OPTION_B = 'False' }
        if (/^(true|false)$/i.test(values.ANSWER || '')) values.ANSWER = values.ANSWER.toLowerCase() === 'true' ? 'A' : 'B'
        if (values.OPTION_A?.toLowerCase() !== 'true' || values.OPTION_B?.toLowerCase() !== 'false' || values.OPTION_C !== undefined || values.OPTION_D !== undefined) issues.push('TRUE_FALSE needs A. True and B. False only')
      }
      content = validateChoices(values, issues, 'Question')
    }
    if (issues.length) { errors.push({ block: blockIndex + 1, source_id: sourceId, line: start + 1, messages: issues }); return }
    questions.push({ source_id: sourceId, question_number: questions.length + 1, type,
      question_text: values.QUESTION, ...content,
      pdf_page: page[2] ? `${Number(page[1])}–${Number(page[2])}` : String(Number(page[1])), explanation: values.EXPLANATION })
  })
  if (!starts.length) errors.push({ block: null, source_id: null, line: null, messages: ['No Q1. / Q2. questions found. Use the mixed-exam prompt or sample format.'] })
  return { detected_count: starts.length, valid_count: questions.length, invalid_count: starts.length - questions.length, questions, errors }
}

export function parseText(text) {
  const normalized = String(text || '').replace(/\u00a0/g, ' ')
  return normalized.includes('[QUESTION_START]') ? parseLegacy(normalized) : parseStudyQuestions(normalized)
}
