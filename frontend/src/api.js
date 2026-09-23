import { getWorkspaceKey } from './workspace'

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, { ...options, headers: { ...options.headers, 'X-Workspace-Key': getWorkspaceKey() } })
  } catch {
    throw new Error('Cannot connect to the backend. Start FastAPI and try again.')
  }
  if (response.status === 204) return null
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('The server sent an unexpected response.')
  }
  if (!response.ok) {
    const detail = data.detail
    throw new Error(typeof detail === 'string' ? detail : 'Please check your input and try again.')
  }
  return data
}

function json(method, path, body) {
  return request(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

export const api = {
  dashboard: () => request('/dashboard'),
  courses: () => request('/courses'),
  course: id => request(`/courses/${id}`),
  createCourse: name => json('POST', '/courses', { name }),
  renameCourse: (id, name) => json('PATCH', `/courses/${id}`, { name }),
  deleteCourse: id => request(`/courses/${id}`, { method: 'DELETE' }),
  exams: () => request('/exams'),
  exam: id => request(`/exams/${id}`),
  examReview: id => request(`/exams/${id}/review`),
  renameExam: (id, title) => json('PATCH', `/exams/${id}`, { title }),
  deleteExam: id => request(`/exams/${id}`, { method: 'DELETE' }),
  preview: file => { const form = new FormData(); form.append('file', file); return request('/exams/preview', { method: 'POST', body: form }) },
  saveExam: payload => json('POST', '/exams', payload),
  check: (id, question_id, selected_answer) => json('POST', `/exams/${id}/check`, { question_id, selected_answer }),
  submit: (id, payload) => json('POST', `/exams/${id}/attempts`, payload),
  attempts: examId => request(`/attempts${examId ? `?exam_id=${examId}` : ''}`),
  attempt: id => request(`/attempts/${id}`),
}
