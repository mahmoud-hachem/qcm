import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

const FIELDS = ['ID', 'QUESTION', 'OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D', 'CORRECT_ANSWER']
const CONTINUATIONS = new Set(['QUESTION', 'OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D'])

export function parseText(text) {
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
        if (CONTINUATIONS.has(current)) values[current] = `${values[current]} ${entry}`.trim()
        else issues.push(`Unrecognized line: ${entry.slice(0, 70)}`)
        continue
      }
      const [, key, value] = match
      if (!FIELDS.includes(key)) {
        issues.push(`Unrecognized field: ${key}`)
        current = null
        continue
      }
      if (key in values) issues.push(`Duplicate ${key} field`)
      values[key] = value.trim()
      current = key
    }
    for (const field of FIELDS) if (!values[field]) issues.push(`Missing ${field}`)
    let sourceId = values.ID || ''
    if (sourceId && (!/^\d+$/.test(sourceId) || !/[1-9]/.test(sourceId))) issues.push('ID must be a positive whole number')
    else if (sourceId) sourceId = String(BigInt(sourceId))
    if (sourceId && seen.has(sourceId)) issues.push(`Duplicate question ID ${sourceId}`)
    const answer = values.CORRECT_ANSWER || ''
    if (answer && !/^[ABCD]$/.test(answer)) issues.push('CORRECT_ANSWER must be A, B, C, or D')
    if (issues.length) {
      errors.push({ block: detected, source_id: sourceId || null, line, messages: issues })
      return
    }
    seen.add(sourceId)
    questions.push({ source_id: sourceId, question_number: questions.length + 1,
      question_text: values.QUESTION, option_a: values.OPTION_A, option_b: values.OPTION_B,
      option_c: values.OPTION_C, option_d: values.OPTION_D, correct_answer: answer })
  }

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim()
    if (!line) return
    if (line === '[QUESTION_START]') {
      if (block) finish(block, startLine, 'Missing [QUESTION_END] before the next question')
      block = []
      startLine = index + 1
    } else if (line === '[QUESTION_END]') {
      if (!block) errors.push({ block: null, source_id: null, line: index + 1, messages: ['Unexpected [QUESTION_END]'] })
      else finish(block, startLine)
      block = null
    } else if (block) block.push(line)
    else errors.push({ block: null, source_id: null, line: index + 1, messages: [`Text outside a question block: ${line.slice(0, 70)}`] })
  })
  if (block) finish(block, startLine, 'Missing [QUESTION_END] at the end of the document')
  if (!detected && !errors.length) errors.push({ block: null, source_id: null, line: null, messages: ['No question blocks were found. Check the required markers.'] })
  return { detected_count: detected, valid_count: questions.length, invalid_count: detected - questions.length, questions, errors }
}

function pageText(items) {
  let result = ''
  let previous = null
  for (const item of items) {
    if (!item.str) continue
    const y = item.transform?.[5]
    if (previous !== null && typeof y === 'number' && Math.abs(y - previous) > 2 && !result.endsWith('\n')) result += '\n'
    result += item.str
    if (item.hasEOL) result += '\n'
    else if (!item.str.endsWith(' ')) result += ' '
    if (typeof y === 'number') previous = y
  }
  return result
}

export async function parsePdf(file) {
  if (!file?.name?.toLowerCase().endsWith('.pdf')) throw new Error('Choose a PDF file ending in .pdf.')
  if (file.size > 20 * 1024 * 1024) throw new Error('The PDF is too large. Maximum size is 20 MB.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') throw new Error('This file is not a PDF. Select a standardized MCQ PDF.')
  let loadingTask
  try {
    loadingTask = pdfjs.getDocument({ data: bytes })
    const document = await loadingTask.promise
    const pages = []
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number)
      pages.push(pageText((await page.getTextContent()).items))
    }
    return parseText(pages.join('\n'))
  } catch (error) {
    if (error?.name === 'PasswordException') throw new Error('This PDF is password protected. Upload an unlocked PDF.')
    throw new Error('The PDF could not be read. Check that it is not corrupted.')
  } finally {
    await loadingTask?.destroy()
  }
}
