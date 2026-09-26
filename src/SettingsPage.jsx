import { useState } from 'react'
import { BookOpen, FileText } from 'lucide-react'
import { api } from './api'
import { useProfile } from './Profiles'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const [message, setMessage] = useState('')
  const { profile } = useProfile()
  const navigate = useNavigate()

  async function exportData() {
    try {
      const backup = await api.exportWorkspace()
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `quizflow-${profile.id}-backup-${new Date().toISOString().slice(0, 10)}.json`
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
      if (!window.confirm(`Replace ${profile.name}'s courses, exams, and results with this backup? The other profile will not change.`)) return
      await api.importWorkspace(backup)
      navigate('/')
    } catch (error) { setMessage(error instanceof SyntaxError ? 'This backup is not valid JSON.' : error.message) }
    finally { event.target.value = '' }
  }

  return <>
    <header className="page-header"><div><p className="eyebrow">PREFERENCES</p><h1>Settings</h1><p className="page-description">Manage {profile.name}'s workspace on this browser.</p></div></header>
    <div className="panel settings-panel">
      <div className="settings-row"><div className="settings-icon"><BookOpen size={21} /></div><div><h3>Saved on this device</h3><p>Export {profile.name}'s courses, exams, and results before clearing browser data or changing devices.</p></div><button className="button secondary compact" onClick={exportData}>Export backup</button></div>
      <div className="settings-row"><div className="settings-icon"><BookOpen size={21} /></div><div><h3>Restore a backup</h3><p>This replaces only {profile.name}'s courses, exams, and results. The other profile stays unchanged.</p></div><label className="button secondary compact" style={{ cursor: 'pointer' }}>Import backup<input type="file" accept=".json,application/json" onChange={importData} style={{ display: 'none' }} /></label></div>
      {message && <p className="settings-message">{message}</p>}
      <div className="settings-row"><div className="settings-icon"><FileText size={21} /></div><div><h3>Question format</h3><p>Paste Q1/Q2 study questions or upload a text-selectable PDF or text file. Each question includes its source PDF page and explanation.</p></div></div>
    </div>
  </>
}
