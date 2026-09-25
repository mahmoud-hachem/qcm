import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, CircleHelp, Clock3, Copy, ExternalLink, FileText, GraduationCap, History, LayoutDashboard, Menu, MoreHorizontal, Plus, Search, Settings, Sparkles, Target, Trash2, UploadCloud, X } from 'lucide-react'
import { api } from './api'
import { APP_NAME } from './config'
import { displayedLetter, shuffledOptionOrder } from './questionOrder'
import SettingsPage from './SettingsPage'
import promptMarkdown from '../MCQ_GENERATION_PROMPT.md?raw'

const fmtDate = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not yet'
const fmtScore = value => value == null ? '—' : `${Number(value).toFixed(0)}%`
const optionText = (q, letter) => q[`option_${letter.toLowerCase()}`]
const mcqPrompt = promptMarkdown.match(/```text\r?\n([\s\S]*?)\r?\n```/)?.[1] || ''

function useData(load, key) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    setState(old => ({ ...old, loading: true, error: '' }))
    load().then(data => active && setState({ data, error: '', loading: false }))
      .catch(error => active && setState({ data: null, error: error.message, loading: false }))
    return () => { active = false }
  }, [key, version])
  return { ...state, refresh: () => setVersion(v => v + 1) }
}

function ErrorBox({ message, retry }) {
  return <div className="error-box"><CircleHelp size={20} /><div><strong>Something went wrong</strong><p>{message}</p></div>{retry && <button className="text-button" onClick={retry}>Try again</button>}</div>
}

function Empty({ icon: Icon = BookOpen, title, text, action, to }) {
  return <div className="empty"><div className="empty-icon"><Icon size={28} /></div><h3>{title}</h3><p>{text}</p>{action && <Link className="button primary" to={to}>{action}<ArrowRight size={16} /></Link>}</div>
}

function Loading() { return <div className="loading"><span className="spinner" />Loading your workspace…</div> }

function Header({ title, eyebrow, description, actions, back }) {
  return <header className="page-header"><div>{back && <Link className="back-link" to={back}><ArrowLeft size={15} /> Back</Link>}<p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{actions && <div className="header-actions">{actions}</div>}</header>
}

function TextModal({ title, label, initial = '', onClose, onSave, busy }) {
  const [value, setValue] = useState(initial)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (!value.trim()) { setError(`Enter a ${label.toLowerCase()}.`); return }
    try { await onSave(value.trim()) } catch (e) { setError(e.message) }
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}><button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><div className="modal-symbol"><BookOpen size={22} /></div><h2>{title}</h2><p className="muted">Give it a clear name so you can find it later.</p><form onSubmit={submit}><label className="field-label" htmlFor="modal-value">{label}</label><input autoFocus id="modal-value" value={value} maxLength={160} onChange={e => setValue(e.target.value)} placeholder={`Enter ${label.toLowerCase()}`} />{error && <p className="field-error">{error}</p>}<div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div></form></div></div>
}

function Shell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const focused = /^\/exams\/[^/]+\/take$/.test(pathname)
  const nav = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/courses', label: 'Courses', icon: BookOpen },
    { to: '/exams', label: 'Exams', icon: FileText },
    { to: '/history', label: 'History', icon: History },
  ]
  if (focused) return <main className="focus-shell">{children}</main>
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <Link to="/" className="brand" onClick={() => setMenuOpen(false)}><span className="brand-mark"><GraduationCap size={23} strokeWidth={2.2} /></span><span>{APP_NAME}<small>STUDY SPACE</small></span></Link>
      <div className="side-label">WORKSPACE</div>
      <nav className="side-nav">{nav.map(({ to, label, icon: Icon, end }) => <NavLink key={to} end={end} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.9} />{label}</NavLink>)}</nav>
      <div className="side-bottom"><NavLink to="/settings" onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Settings size={19} />Settings</NavLink></div>
    </aside>
    {menuOpen && <div className="sidebar-scrim" onClick={() => setMenuOpen(false)} />}
    <div className="main-wrap"><div className="topbar"><button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button><span className="topbar-label">Your learning workspace</span><div className="topbar-right"><span className="local-badge"><span />Local workspace</span></div></div><main className="page-content">{children}</main></div>
    <nav className="mobile-bottom">{nav.map(({ to, label, icon: Icon, end }) => <NavLink key={to} end={end} to={to} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={20} /><span>{label === 'Recent Exams' ? 'Exams' : label}</span></NavLink>)}</nav>
  </div>
}

function StatCard({ icon: Icon, label, value, note, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20} /></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div>{note && <div className="stat-note">{note}</div>}</div>
}

function Dashboard() {
  const { data, loading, error, refresh } = useData(api.dashboard, 'dashboard')
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  const latest = data.recent_exams[0]
  return <>
    <Header eyebrow="YOUR STUDY SPACE" title="Ready to practice?" description="Your courses, questions, and progress in one place." actions={data.total_courses > 0 && <Link className="button primary" to="/upload"><Plus size={18} /> Upload exam</Link>} />
    {latest ? <section className="study-hero"><div><p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2>{latest.title}</h2><p>{latest.course_name} · {latest.question_count} questions</p></div><Link className="button primary" to={`/exams/${latest.id}/start`}>Start a session <ArrowRight size={18} /></Link></section> : <section className="study-hero"><div><p className="eyebrow">LET'S GET STARTED</p><h2>{data.total_courses ? 'Turn your PDF into practice.' : 'Your first course starts here.'}</h2><p>{data.total_courses ? 'Upload a ChatGPT-generated MCQ PDF using the button above.' : 'Create a course, then add your MCQ PDF to start learning.'}</p></div>{!data.total_courses && <Link className="button primary" to="/courses">Create a course <ArrowRight size={18} /></Link>}</section>}
    <section className="dashboard-metrics"><div><strong>{data.total_courses}</strong><span>Courses</span></div><div><strong>{data.total_exams}</strong><span>Exams</span></div><div><strong>{data.total_attempts}</strong><span>Sessions finished</span></div><div><strong>{fmtScore(data.average_score)}</strong><span>Average score</span></div></section>
    <div className="dashboard-grid"><section className="panel"><div className="section-heading"><div><h2>Your exams</h2><p>Choose what to study next.</p></div>{latest && <Link className="subtle-link" to="/exams">View all <ArrowRight size={15} /></Link>}</div>{latest ? <div className="list-stack">{data.recent_exams.map(exam => <Link className="recent-row" to={`/exams/${exam.id}/start`} key={exam.id}><div className="row-icon"><FileText size={20} /></div><div className="row-main"><strong>{exam.title}</strong><span>{exam.course_name} · {exam.question_count} questions</span></div><ChevronRight size={18} /></Link>)}</div> : <div className="small-empty">Your imported exams will appear here.</div>}</section>
    <section className="panel"><div className="section-heading"><div><h2>Recent progress</h2><p>Every session helps you improve.</p></div>{data.recent_attempts.length > 0 && <Link className="subtle-link" to="/history">History <ArrowRight size={15} /></Link>}</div>{data.recent_attempts.length ? <div className="list-stack">{data.recent_attempts.map(attempt => <Link className="recent-row" to={`/attempts/${attempt.id}`} key={attempt.id}><div className="row-main"><strong>{attempt.exam_title}</strong><span>{attempt.score}/{attempt.total_questions} correct · {fmtDate(attempt.completed_at)}</span></div><span className="score-pill">{fmtScore(attempt.percentage)}</span></Link>)}</div> : <div className="small-empty">Finish a session to see your results here.</div>}</section></div>
  </>
}

function Courses() {
  const { data, loading, error, refresh } = useData(api.courses, 'courses')
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const visible = data?.filter(c => c.name.toLowerCase().includes(query.toLowerCase())) || []
  async function save(name) { setBusy(true); try { if (modal?.id) await api.renameCourse(modal.id, name); else await api.createCourse(name); setModal(null); refresh() } finally { setBusy(false) } }
  async function remove(course) { if (!window.confirm(`Delete ${course.name} and all its exams and attempts? This cannot be undone.`)) return; try { await api.deleteCourse(course.id); refresh() } catch (e) { alert(e.message) } }
  return <><Header eyebrow="YOUR LIBRARY" title="Courses" description="Organize your exams by subject and keep your progress in view." actions={<button className="button primary" onClick={() => setModal({})}><Plus size={17} /> Create course</button>} />{loading ? <Loading /> : error ? <ErrorBox message={error} retry={refresh} /> : data.length ? <><div className="list-toolbar"><label className="search-box"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search courses" aria-label="Search courses" /></label><span className="toolbar-count">{visible.length} courses</span></div>{visible.length ? <div className="course-grid">{visible.map((c, index) => <article className="course-card" key={c.id}><div className="course-card-top"><div className={`course-icon color-${index % 5}`}><BookOpen size={23} /></div><div className="card-actions"><button className="icon-button" title="Rename" onClick={() => setModal(c)}><MoreHorizontal size={21} /></button><button className="icon-button" title="Delete" onClick={() => remove(c)}><Trash2 size={17} /></button></div></div><Link to={`/courses/${c.id}`} className="course-title">{c.name} <ChevronRight size={17} /></Link><p>{c.exam_count} {c.exam_count === 1 ? 'exam' : 'exams'} · {c.question_count} questions</p><div className="course-card-bottom"><div><span>Average score</span><strong>{fmtScore(c.average_score)}</strong></div><div><span>Last studied</span><strong>{fmtDate(c.last_studied)}</strong></div></div></article>)}</div> : <Empty icon={Search} title="No matching courses" text="Try a different search term." />}</> : <Empty title="No courses yet" text="Create your first course and upload an MCQ exam to start studying." />}{modal && <TextModal title={modal.id ? 'Rename course' : 'Create a course'} label="Course name" initial={modal.name || ''} onClose={() => setModal(null)} onSave={save} busy={busy} />}</>
}

function ExamCard({ exam, onRename, onDelete }) {
  function action(event, callback) {
    event.currentTarget.closest('details').open = false
    callback(exam)
  }
  return <article className="exam-card clean-exam-card"><div className="exam-card-main"><div className="exam-icon"><FileText size={22} /></div><div className="exam-info"><h3>{exam.title}</h3><p>{exam.question_count} questions · {exam.attempt_count} sessions</p></div><details className="exam-more"><summary aria-label={`More actions for ${exam.title}`}><MoreHorizontal size={21} /></summary><div className="exam-more-menu"><Link to={`/exams/${exam.id}/review`}>View answer key</Link><button onClick={event => action(event, onRename)}>Rename</button><button className="danger" onClick={event => action(event, onDelete)}>Delete exam</button></div></details></div><div className="exam-card-footer"><span className="exam-meta">{exam.best_score == null ? 'Ready for your first session' : `Best score ${fmtScore(exam.best_score)}`}</span><Link className="button primary" to={`/exams/${exam.id}/start`}>Practice <ArrowRight size={16} /></Link></div></article>
}

function sortExams(exams, sort) {
  return [...exams].sort((a, b) => {
    if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
    if (sort === 'best') return (b.best_score ?? -1) - (a.best_score ?? -1)
    if (sort === 'lowest') return (a.best_score ?? 101) - (b.best_score ?? 101)
    if (sort === 'recent') return new Date(b.last_studied || 0) - new Date(a.last_studied || 0)
    return new Date(b.created_at) - new Date(a.created_at)
  })
}

function ExamList({ exams, refresh, emptyTitle = 'No exams yet', emptyText = 'Upload a standardized MCQ PDF to create your first exam.' }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const visible = sortExams(exams.filter(e => `${e.title} ${e.course_name}`.toLowerCase().includes(query.toLowerCase())), sort)
  async function rename(title) { setBusy(true); try { await api.renameExam(modal.id, title); setModal(null); refresh() } finally { setBusy(false) } }
  async function remove(exam) { if (!window.confirm(`Delete ${exam.title} and all its attempts? This cannot be undone.`)) return; try { await api.deleteExam(exam.id); refresh() } catch (e) { alert(e.message) } }
  return <><div className="list-toolbar"><label className="search-box"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search exams" aria-label="Search exams" /></label><select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort exams"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="best">Best score</option><option value="lowest">Lowest score</option><option value="recent">Recently studied</option></select></div>{visible.length ? <div className="exam-list">{visible.map(e => <ExamCard exam={e} key={e.id} onRename={setModal} onDelete={remove} />)}</div> : <Empty title={query ? 'No matching exams' : emptyTitle} text={query ? 'Try a different search term.' : emptyText}  />}{modal && <TextModal title="Rename exam" label="Exam title" initial={modal.title} onClose={() => setModal(null)} onSave={rename} busy={busy} />}</>
}

function CourseDetail() {
  const { id } = useParams()
  const { data, loading, error, refresh } = useData(() => api.course(id), id)
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  return <><Header back="/courses" eyebrow="COURSE LIBRARY" title={data.name} description={`${data.exam_count} exams · ${data.question_count} questions · Average score ${fmtScore(data.average_score)}`} actions={<Link className="button primary" to={`/upload?course=${id}`}><Plus size={17} /> Upload exam</Link>} /><div className="course-detail-summary"><div><span>EXAMS</span><strong>{data.exam_count}</strong></div><div><span>QUESTIONS</span><strong>{data.question_count}</strong></div><div><span>AVERAGE SCORE</span><strong>{fmtScore(data.average_score)}</strong></div><div><span>LAST STUDIED</span><strong>{fmtDate(data.last_studied)}</strong></div></div><div className="section-heading spaced"><div><h2>Exams in this course</h2><p>Choose an exam to practice or review.</p></div></div><ExamList exams={data.exams} refresh={refresh} /></>
}

function Exams() {
  const { data, loading, error, refresh } = useData(api.exams, 'exams')
  return <><Header eyebrow="PRACTICE LIBRARY" title="Your exams" description="Find an exam, pick a mode, and keep practicing." actions={<Link className="button primary" to="/upload"><Plus size={17} /> Upload exam</Link>} />{loading ? <Loading /> : error ? <ErrorBox message={error} retry={refresh} /> : <ExamList exams={data} refresh={refresh} />}</>
}

function ImportPractice({ questions, onSave, busy }) {
  const [position, setPosition] = useState(0)
  const [choices, setChoices] = useState({})
  const [orders] = useState(() => questions.map(() => shuffledOptionOrder()))
  const question = questions[position]
  const selected = choices[position]
  const correct = selected === question.correct_answer
  const order = orders[position]

  function choose(letter) {
    setChoices(previous => previous[position] ? previous : { ...previous, [position]: letter })
  }

  return <>
    <div className="preview-practice-toolbar">
      <div><strong>Try a question</strong><p>Choose an answer for instant feedback.</p></div>
      <label>Jump to <select aria-label="Jump to question" value={position} onChange={event => setPosition(Number(event.target.value))}>{questions.map((item, index) => <option key={item.source_id} value={index}>Question {index + 1}</option>)}</select></label>
    </div>
    <div className="preview-question preview-practice-question">
      <div className="question-label">QUESTION {position + 1} OF {questions.length}</div>
      <h3>{question.question_text}</h3>
      <div className="answer-options">{order.split('').map((sourceLetter, index) => <button type="button" key={sourceLetter} disabled={!!selected} onClick={() => choose(sourceLetter)} className={`answer-option ${selected === sourceLetter ? 'selected' : ''} ${selected && question.correct_answer === sourceLetter ? 'correct' : ''} ${selected === sourceLetter && !correct ? 'wrong' : ''}`}><span className="option-letter">{'ABCD'[index]}</span><span>{optionText(question, sourceLetter)}</span>{selected && question.correct_answer === sourceLetter && <Check size={18} className="answer-check" />}</button>)}</div>
      {selected && <div className={`study-feedback ${correct ? 'positive' : 'negative'}`} role="status"><strong>{correct ? 'Correct!' : 'Not quite.'}</strong> {correct ? 'You got it.' : `The correct answer is ${displayedLetter(order, question.correct_answer)}: ${optionText(question, question.correct_answer)}.`}</div>}
      <div className="question-footer"><button type="button" className="button secondary" disabled={position === 0} onClick={() => setPosition(value => value - 1)}><ArrowLeft size={16} /> Previous</button><button type="button" className="button secondary" disabled={position === questions.length - 1} onClick={() => setPosition(value => value + 1)}>Next question <ArrowRight size={16} /></button></div>
    </div>
    <div className="save-bar"><p><strong>{questions.length} questions ready.</strong> Save to start a study or exam session.</p><button className="button primary" disabled={busy} onClick={onSave}>{busy ? 'Saving…' : 'Save exam'} <ArrowRight size={17} /></button></div>
  </>
}

function PromptGuide() {
  const [message, setMessage] = useState('')
  const chatUrl = `https://chatgpt.com/?prompt=${encodeURIComponent(mcqPrompt)}`
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(mcqPrompt); setMessage('Prompt copied. Paste it into ChatGPT with your course PDF.') }
    catch { setMessage('Copy failed. Open the prompt below and copy it manually.') }
  }
  function openChat() {
    if (!navigator.clipboard) {
      setMessage('ChatGPT opened. Attach your course PDF before sending. Use Copy prompt if the message is empty.')
      return
    }
    navigator.clipboard.writeText(mcqPrompt)
      .then(() => setMessage('ChatGPT opened. Attach your course PDF before sending. The prompt is also copied if you need to paste it.'))
      .catch(() => setMessage('ChatGPT opened. Attach your course PDF before sending. Use Copy prompt if the message is empty.'))
  }
  return <div className="panel guide-panel"><div className="guide-icon"><FileText size={23} /></div><h3>Need an MCQ PDF?</h3><p className="guide-intro">Attach your course PDF to ChatGPT, then use our prompt. It keeps each part manageable and varies correct answer positions.</p><div className="prompt-actions"><button type="button" className="button secondary prompt-copy-button" onClick={copyPrompt}><Copy size={17} /> Copy prompt</button><a className="button primary prompt-open-button" href={chatUrl} target="_blank" rel="noopener noreferrer" onClick={openChat}><ExternalLink size={17} /> Open ChatGPT</a></div>{message && <p className="prompt-message" role="status">{message}</p>}<p className="prompt-hint">In ChatGPT, add your course PDF before you send the message.</p><details className="prompt-details"><summary>Read the full prompt</summary><pre>{mcqPrompt}</pre></details></div>
}

function UploadExam() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: courses, loading, error, refresh } = useData(api.courses, 'upload-courses')
  const [courseId, setCourseId] = useState(params.get('course') || '')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [creatingCourse, setCreatingCourse] = useState(false)
  useEffect(() => { if (!courseId && courses?.length === 1) setCourseId(String(courses[0].id)) }, [courses, courseId])
  async function createCourse(name) {
    setBusy(true)
    try { const course = await api.createCourse(name); setCourseId(String(course.id)); setCreatingCourse(false); refresh() }
    finally { setBusy(false) }
  }
  async function parse(event) {
    event.preventDefault(); setMessage('')
    if (!courseId || !title.trim() || !file) { setMessage('Choose a course, enter a title, and select a PDF.'); return }
    setBusy(true)
    try { setPreview(await api.preview(file)); window.scrollTo({ top: 0 }) } catch (e) { setMessage(e.message) } finally { setBusy(false) }
  }
  async function save() {
    setBusy(true); setMessage('')
    try { const exam = await api.saveExam({ course_id: Number(courseId), title: title.trim(), questions: preview.questions }); navigate(`/exams/${exam.id}/start`) } catch (e) { setMessage(e.message) } finally { setBusy(false) }
  }
  function selectFile(event) {
    const chosen = event.target.files?.[0] || null
    setFile(chosen)
    if (chosen && !title.trim()) setTitle(chosen.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').slice(0, 160))
  }
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  if (preview) return <div className="import-review"><Header eyebrow="CHECK YOUR IMPORT" title={title} description={`${preview.valid_count} questions ready from ${file.name}`} actions={<button className="button secondary" disabled={busy} onClick={() => setPreview(null)}>Change PDF</button>} />
    {preview.errors.length > 0 && <details className="parse-errors"><summary>{preview.invalid_count} question blocks skipped · See details</summary><p>You can save the valid questions below.</p>{preview.errors.map((item, index) => <div className="parse-error-row" key={index}><span>{item.source_id ? `ID ${item.source_id}` : `Line ${item.line || '—'}`}</span><span>{item.messages.join('; ')}</span></div>)}</details>}
    {message && <div className="inline-error" role="alert">{message}</div>}
    {preview.questions.length ? <ImportPractice questions={preview.questions} onSave={save} busy={busy} /> : <div className="inline-error">No valid questions found. Choose Change PDF and try the required format.</div>}
  </div>
  return <><Header eyebrow="ADD TO YOUR LIBRARY" title="Upload an exam" description="Add your MCQ PDF and turn it into an interactive study session." />
    <div className="upload-layout"><section className="panel upload-form-panel"><form onSubmit={parse}>
      <div className="field-heading"><label className="field-label" htmlFor="course">Course</label><button type="button" className="text-button" onClick={() => setCreatingCourse(true)}>+ New course</button></div>
      <select id="course" value={courseId} onChange={event => setCourseId(event.target.value)} required><option value="">{courses.length ? 'Choose a course' : 'Create your first course above'}</option>{courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
      <label className="field-label" htmlFor="title">Exam title</label><input id="title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Software Engineering — Chapter 1" maxLength={160} required />
      <label className={`drop-zone ${file ? 'has-file' : ''}`}><UploadCloud size={30} /><strong>{file ? file.name : 'Choose your MCQ PDF'}</strong><span>{file ? 'Click to choose a different file' : 'Click to browse · PDF up to 20 MB'}</span><input type="file" aria-label="MCQ PDF" accept=".pdf,application/pdf" onChange={selectFile} /></label>
      {message && <div className="inline-error" role="alert">{message}</div>}<button className="button primary wide" disabled={busy}>{busy ? <><span className="spinner small" /> Reading PDF…</> : <>Preview questions <ArrowRight size={17} /></>}</button>
    </form></section><PromptGuide /></div>
    {creatingCourse && <TextModal title="New course" label="Course name" onClose={() => setCreatingCourse(false)} onSave={createCourse} busy={busy} />}
  </>
}

function StartExam() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [limit, setLimit] = useState(20)
  const [studyMode, setStudyMode] = useState('study')
  const { data, loading, error, refresh } = useData(() => api.exam(id), id)
  function begin(mode) {
    const choices = [10, 20, 40, 60].filter(size => size < data.question_count)
    const size = choices.includes(limit) ? limit : 'all'
    const pool = size === 'all' ? [] : Array.from({ length: size }, (_, index) => {
      const start = Math.floor(index * data.question_count / size)
      const end = Math.floor((index + 1) * data.question_count / size)
      return data.questions[start + Math.floor(Math.random() * (end - start))]
    })
    if (size !== 'all') {
      for (let index = pool.length - 1; index > 0; index--) {
        const swap = Math.floor(Math.random() * (index + 1))
        ;[pool[index], pool[swap]] = [pool[swap], pool[index]]
      }
    }
    const ids = size === 'all' ? '' : `&questions=${pool.map(question => question.id).join(',')}`
    navigate(`/exams/${id}/take?mode=${mode}${ids}`)
  }
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  const sizes = [10, 20, 40, 60].filter(size => size < data.question_count)
  const selectedLimit = sizes.includes(limit) ? limit : 'all'
  return <div className="session-page">
    <Header back={`/courses/${data.course_id}`} eyebrow={data.course_name} title={data.title} description={`${data.question_count} questions in this exam`} />
    <form className="session-builder panel" onSubmit={event => { event.preventDefault(); begin(studyMode) }}>
      <fieldset className="mode-choices"><legend>How would you like to practice?</legend>
        <label className={`mode-choice ${studyMode === 'study' ? 'active' : ''}`}><input type="radio" name="mode" value="study" checked={studyMode === 'study'} onChange={() => setStudyMode('study')} /><BookOpen size={23} /><span><strong>Study</strong><small>Get feedback after every answer.</small></span></label>
        <label className={`mode-choice ${studyMode === 'exam' ? 'active' : ''}`}><input type="radio" name="mode" value="exam" checked={studyMode === 'exam'} onChange={() => setStudyMode('exam')} /><Target size={23} /><span><strong>Exam</strong><small>See your results when you finish.</small></span></label>
      </fieldset>
      <div className="session-length"><div><label htmlFor="session-length">Session length</label><p>Short sessions sample from across the exam.</p></div><select id="session-length" value={selectedLimit} onChange={event => setLimit(event.target.value === 'all' ? 'all' : Number(event.target.value))}>{sizes.map(size => <option key={size} value={size}>{size} questions</option>)}<option value="all">All {data.question_count} questions</option></select></div>
      <div className="session-launch"><span><CheckCircle2 size={16} /> Shuffled answers · No timer</span><button className="button primary">{studyMode === 'study' ? 'Start studying' : 'Start exam'} <ArrowRight size={18} /></button></div>
    </form>
  </div>
}

function TakeExam() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const mode = params.get('mode') === 'study' ? 'study' : 'exam'
  const subset = params.get('questions')?.split(',').map(Number).filter(Number.isInteger) || []
  const { data, loading, error, refresh } = useData(() => api.exam(id), id)
  const [position, setPosition] = useState(0)
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const questions = useMemo(() => {
    if (!data) return []
    if (!subset.length) return data.questions
    const byId = new Map(data.questions.map(question => [question.id, question]))
    return subset.map(questionId => byId.get(questionId)).filter(Boolean)
  }, [data, params.toString()])
  const optionOrders = useMemo(() => Object.fromEntries(questions.map(question => [question.id, shuffledOptionOrder()])), [questions])
  const q = questions[position]
  const currentOrder = q ? optionOrders[q.id] : 'ABCD'
  const selected = q ? answers[q.id] : null
  const answered = questions.filter(question => answers[question.id]).length
  async function choose(letter) {
    if (busy || (mode === 'study' && selected)) return
    setAnswers(old => ({ ...old, [q.id]: letter }))
    if (mode !== 'study') return
    setBusy(true); setMessage('')
    try { const result = await api.check(id, q.id, letter); setChecked(old => ({ ...old, [q.id]: result })) }
    catch (e) {
      setAnswers(old => { const next = { ...old }; delete next[q.id]; return next })
      setMessage(e.message)
    } finally { setBusy(false) }
  }
  async function submit() {
    const missing = questions.length - answered
    if (missing && !window.confirm(`${missing} ${missing === 1 ? 'question is' : 'questions are'} unanswered. Submit anyway?`)) return
    setBusy(true); setMessage('')
    try { const result = await api.submit(id, { mode, question_ids: questions.map(item => item.id), answers, option_orders: optionOrders }); navigate(`/attempts/${result.id}`) } catch (e) { setMessage(e.message); setBusy(false) }
  }
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  if (!questions.length) return <ErrorBox message="No questions were found for this practice session." />
  const state = checked[q.id]
  return <div className="focus-exam">
    <header className="focus-top"><Link className="back-link" to={`/exams/${id}/start`} onClick={event => { if (answered && !window.confirm('Leave this session? Your unfinished answers will not be saved.')) event.preventDefault() }}><ArrowLeft size={18} /> Exit</Link><span className="mode-badge">{mode === 'study' ? 'Study session' : 'Practice exam'}</span><button className="button secondary finish-session" disabled={busy} onClick={submit}>{busy ? 'Saving…' : 'Finish session'} <Check size={17} /></button></header>
    <div className="focus-heading"><p className="eyebrow">{data.course_name}</p><h1>{data.title}</h1></div>
    <div className="session-progress"><span><strong>{answered}</strong> of {questions.length} answered</span><span>{Math.round(answered / questions.length * 100)}%</span></div><div className="exam-progress" role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answered}><span style={{ width: `${answered / questions.length * 100}%` }} /></div>
    <section className="question-panel focus-question" aria-labelledby="active-question">
      <div className="question-label">QUESTION {position + 1} <span>OF {questions.length}</span></div><h2 id="active-question">{q.question_text}</h2>
      <div className="answer-options" aria-label="Answer choices">{currentOrder.split('').map((sourceLetter, index) => {
        const isSelected = selected === sourceLetter
        const isCorrect = state?.correct_answer === sourceLetter
        return <button type="button" aria-pressed={isSelected} disabled={busy || !!state} className={`answer-option ${isSelected ? 'selected' : ''} ${state && isCorrect ? 'correct' : ''} ${state && isSelected && !isCorrect ? 'wrong' : ''}`} key={sourceLetter} onClick={() => choose(sourceLetter)}><span className="option-letter">{'ABCD'[index]}</span><span className="option-content">{optionText(q, sourceLetter)}</span><span className="choice-indicator" aria-hidden="true">{state && isSelected && !isCorrect ? <X size={17} /> : (isSelected || (state && isCorrect)) ? <Check size={17} /> : null}</span></button>
      })}</div>
      {mode === 'study' && state && <div className={`study-feedback ${state.is_correct ? 'positive' : 'negative'}`} role="status"><span className="feedback-icon">{state.is_correct ? <CheckCircle2 size={22} /> : <CircleHelp size={22} />}</span><div><strong>{state.is_correct ? 'Correct — well done.' : 'Not quite. Keep learning.'}</strong>{!state.is_correct && <p>The answer is {displayedLetter(currentOrder, state.correct_answer)}: {optionText(q, state.correct_answer)}</p>}</div></div>}
      {!state && <p className="answer-hint">{mode === 'study' ? 'Choose an answer to check your understanding.' : 'You can change your answer before finishing.'}</p>}
      {message && <div className="inline-error" role="alert">{message}</div>}
      <footer className="question-footer"><button className="button secondary" disabled={position === 0 || busy} onClick={() => setPosition(value => value - 1)}><ArrowLeft size={17} /> Previous</button><span>{position + 1} / {questions.length}</span><button className="button primary" disabled={position === questions.length - 1 || busy} onClick={() => setPosition(value => value + 1)}>Next <ArrowRight size={17} /></button></footer>
    </section>
    {answered === questions.length && <p className="session-complete"><CheckCircle2 size={17} /> All questions answered. Choose Finish session to save your results.</p>}
    <details className="focus-overview"><summary><span>Question overview</span><span>{questions.length - answered} unanswered <ChevronRight size={16} /></span></summary><div className="question-grid">{questions.map((item, index) => <button type="button" key={item.id} disabled={busy} aria-label={`Go to question ${index + 1}, ${answers[item.id] ? 'answered' : 'unanswered'}`} aria-current={index === position ? 'step' : undefined} className={`${index === position ? 'current' : ''} ${answers[item.id] ? 'answered' : ''}`} onClick={event => { setPosition(index); event.currentTarget.closest('details').open = false }}>{index + 1}</button>)}</div></details>
  </div>
}

function Result() {
  const { id } = useParams()
  const { data, loading, error, refresh } = useData(() => api.attempt(id), id)
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  const wrongIds = data.answers.filter(a => !a.is_correct).map(a => a.id)
  return <><Header back={`/courses/${data.course_id}`} eyebrow="EXAM COMPLETE" title="Your results" description={`${data.exam_title} · ${data.course_name} · ${fmtDate(data.completed_at)}`} /><div className="results-hero"><div className="score-ring" style={{ '--score': `${data.percentage}%` }}><div><strong>{fmtScore(data.percentage)}</strong><span>YOUR SCORE</span></div></div><div className="result-summary"><div className="result-kicker">NICE WORK · {data.mode === 'study' ? 'STUDY MODE' : 'EXAM MODE'}</div><h2>{data.score} out of {data.total_questions} correct</h2><p>Every attempt is a step forward. Review your answers to see what you know and what to revisit.</p><div className="result-actions"><Link className="button primary" to={`/attempts/${id}/review`}>Review answers <ArrowRight size={16} /></Link><Link className="button secondary" to={`/exams/${data.exam_id}/start`}>Retry exam</Link></div></div></div><div className="result-stats"><div><span className="dot mint" /><strong>{data.correct_count}</strong><span>Correct</span></div><div><span className="dot peach" /><strong>{data.wrong_count}</strong><span>Wrong</span></div><div><span className="dot gray" /><strong>{data.unanswered_count}</strong><span>Unanswered</span></div></div><div className="result-links">{wrongIds.length > 0 && <Link className="button secondary" to={`/exams/${data.exam_id}/take?mode=exam&questions=${wrongIds.join(',')}`}>Retry wrong questions <ArrowRight size={16} /></Link>}<Link className="button text-only" to={`/courses/${data.course_id}`}>Back to course</Link></div></>
}

function Review() {
  const { id, attemptId } = useParams()
  const loader = attemptId ? () => api.attempt(attemptId) : () => api.examReview(id)
  const { data, loading, error, refresh } = useData(loader, attemptId || id)
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  const questions = attemptId ? data.answers : data.questions
  return <><Header back={attemptId ? `/attempts/${attemptId}` : `/courses/${data.course_id}`} eyebrow="ANSWER REVIEW" title={data.exam_title || data.title} description={attemptId ? `Your attempt on ${fmtDate(data.completed_at)} · ${data.score}/${data.total_questions} correct` : 'Explore the answer key before your next practice session.'} actions={<Link className="button primary" to={`/exams/${data.exam_id || data.id}/start`}>Try exam <ArrowRight size={16} /></Link>} /><div className="review-list">{questions.map((q, index) => <article className="review-card" key={q.id}><div className="review-head"><span>QUESTION {index + 1}</span>{attemptId && <span className={`review-status ${q.is_correct ? 'right' : q.selected_answer ? 'wrong' : 'skipped'}`}>{q.is_correct ? 'Correct' : q.selected_answer ? 'Incorrect' : 'Unanswered'}</span>}</div><h3>{q.question_text}</h3><div className="review-options">{'ABCD'.split('').map(letter => <div key={letter} className={`${q.correct_answer === letter ? 'right' : ''} ${q.selected_answer === letter && !q.is_correct ? 'wrong' : ''}`}><span className="option-letter">{letter}</span><span>{optionText(q, letter)}</span>{q.correct_answer === letter && <span className="answer-tag"><Check size={14} /> Correct answer</span>}{q.selected_answer === letter && q.correct_answer !== letter && <span className="answer-tag">Your answer</span>}</div>)}</div>{attemptId && !q.selected_answer && <p className="review-note">You left this question unanswered.</p>}</article>)}</div></>
}

function HistoryPage() {
  const { data, loading, error, refresh } = useData(() => api.attempts(), 'history')
  const [query, setQuery] = useState('')
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  const visible = data.filter(a => `${a.exam_title} ${a.course_name}`.toLowerCase().includes(query.toLowerCase()))
  return <><Header eyebrow="YOUR PROGRESS" title="Attempt History" description="Look back at every completed practice session." /><div className="list-toolbar"><label className="search-box"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search attempts" /></label><span className="toolbar-count">{visible.length} attempts</span></div>{visible.length ? <div className="history-list">{visible.map(a => <Link className="history-row" to={`/attempts/${a.id}`} key={a.id}><div className="row-icon mint"><Target size={20} /></div><div className="row-main"><strong>{a.exam_title}</strong><span>{a.course_name} · {fmtDate(a.completed_at)} · {a.mode === 'study' ? 'Study Mode' : 'Exam Mode'}</span></div><div className="history-score"><strong>{fmtScore(a.percentage)}</strong><span>{a.score}/{a.total_questions} correct</span></div><ChevronRight size={18} /></Link>)}</div> : <Empty icon={History} title={query ? 'No matching attempts' : 'No attempts yet'} text={query ? 'Try a different search term.' : 'Complete an exam and your results will appear here.'} />}</>
}

export default function App() {
  return <Shell><Routes><Route path="/" element={<Dashboard />} /><Route path="/courses" element={<Courses />} /><Route path="/courses/:id" element={<CourseDetail />} /><Route path="/exams" element={<Exams />} /><Route path="/upload" element={<UploadExam />} /><Route path="/exams/:id/start" element={<StartExam />} /><Route path="/exams/:id/take" element={<TakeExam />} /><Route path="/exams/:id/review" element={<Review />} /><Route path="/attempts/:attemptId/review" element={<Review />} /><Route path="/attempts/:id" element={<Result />} /><Route path="/history" element={<HistoryPage />} /><Route path="/settings" element={<SettingsPage />} /><Route path="*" element={<Empty title="Page not found" text="That page does not exist." action="Go to dashboard" to="/" />} /></Routes></Shell>
}
