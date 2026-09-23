import { useState } from 'react'
import { BookOpen, FileText, GraduationCap } from 'lucide-react'
import { api } from './api'
import { APP_NAME } from './config'

export default function SettingsPage() {
  const [message, setMessage] = useState('')

  async function exportData() {
    try {
      const backup = await api.exportWorkspace()
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `quizflow-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage('Backup downloaded. Keep it somewhere safe.')
    } catch (error) { setMessage(error.message) }
  }

  async function importData(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const backup = JSON.parse(await file.text())
      if (!window.confirm('Replace all courses, exams, and results in this browser with this backup?')) return
      await api.importWorkspace(backup)
      window.location.assign('/')
    } catch (error) { setMessage(error instanceof SyntaxError ? 'This backup is not valid JSON.' : error.message) }
    finally { event.target.value = '' }
  }

  return <>
    <header className="page-header"><div><p className="eyebrow">PREFERENCES</p><h1>Settings</h1><p className="page-description">Manage this browser's private study workspace.</p></div></header>
    <div className="panel settings-panel">
      <div className="settings-row"><div className="settings-icon"><GraduationCap size={21} /></div><div><h3>Project name</h3><p>Change the name in <code>frontend/src/config.js</code>.</p></div><strong>{APP_NAME}</strong></div>
      <div className="settings-row"><div className="settings-icon"><BookOpen size={21} /></div><div><h3>Saved on this device</h3><p>Courses and results are stored in this browser. Export a backup before clearing browser data or changing devices.</p></div><button className="button secondary compact" onClick={exportData}>Export backup</button></div>
      <div className="settings-row"><div className="settings-icon"><BookOpen size={21} /></div><div><h3>Restore a backup</h3><p>This replaces the courses and results in this browser.</p></div><label className="button secondary compact" style={{ cursor: 'pointer' }}>Import backup<input type="file" accept=".json,application/json" onChange={importData} style={{ display: 'none' }} /></label></div>
      {message && <p className="settings-message">{message}</p>}
      <div className="settings-row"><div className="settings-icon"><FileText size={21} /></div><div><h3>PDF format</h3><p>Use the standardized question blocks shown in the sample file. The PDF is read in your browser.</p></div></div>
    </div>
  </>
}
