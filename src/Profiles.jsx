import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, GraduationCap, Users } from 'lucide-react'
import { PROFILES, setActiveProfile } from './api'
import { APP_NAME } from './config'

const ProfileContext = createContext(null)
export const useProfile = () => useContext(ProfileContext)

export default function Profiles({ children }) {
  const [profile, setProfile] = useState(null)
  const navigate = useNavigate()

  function choose(next) {
    setActiveProfile(next?.id ?? null)
    setProfile(next)
    navigate('/', { replace: true })
  }

  if (!profile) return <main className="profile-page">
    <div className="profile-welcome">
      <div className="profile-brand"><span className="brand-mark"><GraduationCap size={25} /></span>{APP_NAME}</div>
      <p className="eyebrow">YOUR STUDY SPACE</p>
      <h1>Who's studying today?</h1>
      <p className="profile-intro">Choose your profile to open your courses, exams, and progress.</p>
      <div className="profile-options">{PROFILES.map(person => <button type="button" key={person.id} className={`profile-card profile-${person.id}`} onClick={() => choose(person)} aria-label={`Continue as ${person.name}`}>
        <span className="profile-initial" aria-hidden="true">{person.initial}</span>
        <strong>{person.name}</strong>
        <span className="profile-card-action">Open workspace <ArrowRight size={17} /></span>
      </button>)}</div>
      <p className="profile-note"><Users size={17} aria-hidden="true" /><span>Two separate workspaces on this browser. Profiles have no password and don't sync across devices.</span></p>
    </div>
  </main>

  return <ProfileContext.Provider value={{ profile, switchProfile: () => choose(null) }}><div key={profile.id}>{children}</div></ProfileContext.Provider>
}
