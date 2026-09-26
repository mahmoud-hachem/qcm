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

function parseStudyQuestions(text) {
  const questions = []
  const errors = []
  const seen = new Set()
  const lines = text.split(/\r?\n/)
  const starts = []
  lines.forEach((line, index) => { if (/^\s*Q\s*\d+\s*[.)]\s*/i.test(line)) starts.push(index) })

  starts.forEach((start, blockIndex) => {
    const first = lines[start].trim().match(/^Q\s*(\d+)\s*[.)]\s*(.*)$/i)
    const sourceId = first[1]
    const values = { QUESTION: first[2].trim() }
    const issues = []
    let current = 'QUESTION'
    for (const raw of lines.slice(start + 1, starts[blockIndex + 1] ?? lines.length)) {
      const line = raw.trim()
      if (!line) continue
      let match = /^PDF\s+pages?\s*:\s*(.*)$/i.exec(line)
      if (match) { if (values.PAGE !== undefined) issues.push('Duplicate PDF page'); values.PAGE = match[1].trim(); current = null; continue }
      match = /^([ABCD])\s*[.)]\s*(.*)$/i.exec(line)
      if (match) { const key = `OPTION_${match[1].toUpperCase()}`; if (values[key] !== undefined) issues.push(`Duplicate ${match[1].toUpperCase()} option`); values[key] = match[2].trim(); current = key; continue }
      match = /^Correct\s+answer\s*:\s*(.*)$/i.exec(line)
      if (match) { if (values.ANSWER !== undefined) issues.push('Duplicate correct answer'); values.ANSWER = match[1].trim().toUpperCase(); current = null; continue }
      match = /^Explanation\s*:\s*(.*)$/i.exec(line)
      if (match) { if (values.EXPLANATION !== undefined) issues.push('Duplicate explanation'); values.EXPLANATION = match[1].trim(); current = 'EXPLANATION'; continue }
      if (current) values[current] = `${values[current]} ${line}`.trim()
    }
    if (seen.has(sourceId)) issues.push(`Duplicate question number ${sourceId}`)
    for (const field of ['QUESTION', 'PAGE', 'OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D', 'ANSWER', 'EXPLANATION']) {
      if (!values[field]) issues.push(`Missing ${field === 'PAGE' ? 'PDF page' : field === 'ANSWER' ? 'correct answer' : field.toLowerCase().replace('_', ' ')}`)
    }
    const page = /^(\d+)(?:\s*[-–—]\s*(\d+))?$/.exec(values.PAGE || '')
    if (values.PAGE && (!page || Number(page[1]) < 1 || (page[2] && Number(page[2]) < Number(page[1])))) issues.push('PDF page must be a positive page number or ascending range')
    if (values.ANSWER && !/^[ABCD]$/.test(values.ANSWER)) issues.push('Correct answer must be A, B, C, or D')
    if (issues.length) { errors.push({ block: blockIndex + 1, source_id: sourceId, line: start + 1, messages: issues }); return }
    seen.add(sourceId)
    questions.push({ source_id: sourceId, question_number: questions.length + 1,
      question_text: values.QUESTION, option_a: values.OPTION_A, option_b: values.OPTION_B,
      option_c: values.OPTION_C, option_d: values.OPTION_D, correct_answer: values.ANSWER,
      pdf_page: page[2] ? `${Number(page[1])}–${Number(page[2])}` : String(Number(page[1])), explanation: values.EXPLANATION })
  })
  if (!starts.length) errors.push({ block: null, source_id: null, line: null, messages: ['No Q1. / Q2. questions found. Check the sample format.'] })
  return { detected_count: starts.length, valid_count: questions.length, invalid_count: starts.length - questions.length, questions, errors }
}

export function parseText(text) {
  const normalized = String(text || '').replace(/\u00a0/g, ' ')
  return normalized.includes('[QUESTION_START]') ? parseLegacy(normalized) : parseStudyQuestions(normalized)
}
