const STORAGE_KEY = 'quizflow.workspace.key'

function valid(key) {
  return /^[0-9a-f]{64}$/.test(key)
}

export function getWorkspaceKey() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (valid(saved)) return saved
  const key = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('')
  localStorage.setItem(STORAGE_KEY, key)
  return key
}

export function restoreWorkspaceKey(key) {
  const normalized = key.trim().toLowerCase()
  if (!valid(normalized)) throw new Error('The recovery key must be 64 hexadecimal characters.')
  localStorage.setItem(STORAGE_KEY, normalized)
  window.location.assign('/')
}
