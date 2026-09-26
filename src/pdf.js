import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { parseText } from './questionParser'

export { parseText } from './questionParser'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

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
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') throw new Error('This file is not a PDF. Select a text-selectable question PDF.')
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

export async function parseInput(input) {
  if (typeof input === 'string') return parseText(input)
  if (/\.(txt|md)$/i.test(input?.name || '')) return parseText(await input.text())
  return parsePdf(input)
}
