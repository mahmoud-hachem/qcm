import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, CircleHelp, Clock3, FileText, GraduationCap, History, LayoutDashboard, Menu, MoreHorizontal, Plus, Search, Settings, Sparkles, Target, Trash2, UploadCloud, X } from 'lucide-react'
import { api } from './api'
import { APP_NAME } from './config'
import SettingsPage from './SettingsPage'

const fmtDate = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not yet'
const fmtScore = value => value == null ? '—' : `${Number(value).toFixed(0)}%`
const optionText = (q, letter) => q[`option_${letter.toLowerCase()}`]

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
  const nav = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/courses', label: 'Courses', icon: BookOpen },
    { to: '/exams', label: 'Recent Exams', icon: FileText },
    { to: '/history', label: 'History', icon: History },
  ]
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <Link to="/" className="brand" onClick={() => setMenuOpen(false)}><span className="brand-mark"><GraduationCap size={23} strokeWidth={2.2} /></span><span>{APP_NAME}<small>STUDY SPACE</small></span></Link>
      <div className="side-label">WORKSPACE</div>
      <nav className="side-nav">{nav.map(({ to, label, icon: Icon, end }) => <NavLink key={to} end={end} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.9} />{label}</NavLink>)}</nav>
      <div className="side-bottom"><div className="sidebar-tip"><div className="tip-icon"><Sparkles size={17} /></div><strong>Make progress, one question at a time.</strong><p>Upload a standardized PDF and start practicing.</p><Link to="/upload" onClick={() => setMenuOpen(false)}>Upload an exam <ArrowRight size={14} /></Link></div><NavLink to="/settings" onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Settings size={19} />Settings</NavLink></div>
    </aside>
    {menuOpen && <div className="sidebar-scrim" onClick={() => setMenuOpen(false)} />}
    <div className="main-wrap"><div className="topbar"><button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button><span className="topbar-label">Your learning workspace</span><div className="topbar-right"><span className="local-badge"><span />Local workspace</span><div className="avatar">Q</div></div></div><main className="page-content">{children}</main></div>
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
  return <>
    <Header eyebrow="OVERVIEW" title="Good to see you." description="A clear view of your courses, practice, and progress." actions={<Link className="button primary" to="/upload"><Plus size={17} /> Upload exam</Link>} />
    <div className="welcome-banner"><div><div className="banner-kicker">YOUR STUDY SPACE</div><h2>Ready for your next study session?</h2><p>Keep your momentum going with a quick practice exam.</p><Link to={data.recent_exams[0] ? `/exams/${data.recent_exams[0].id}/start` : '/courses'} className="button white">{data.recent_exams.length ? 'Start practicing' : 'Create a course'} <ArrowRight size={16} /></Link></div><div className="banner-art" aria-hidden="true"><div className="paper paper-back" /><div className="paper paper-front"><span /><span /><span /><span /></div><div className="banner-check"><Check size={22} /></div></div></div>
    <section className="stat-grid"><StatCard icon={BookOpen} label="Total courses" value={data.total_courses} tone="blue" /><StatCard icon={FileText} label="Total exams" value={data.total_exams} tone="violet" /><StatCard icon={CheckCircle2} label="Completed attempts" value={data.total_attempts} tone="mint" /><StatCard icon={Target} label="Average score" value={fmtScore(data.average_score)} tone="peach" /></section>
    <div className="dashboard-grid"><section className="panel"><div className="section-heading"><div><h2>Recent exams</h2><p>Pick up where you left off.</p></div><Link className="subtle-link" to="/exams">View all <ArrowRight size={15} /></Link></div>{data.recent_exams.length ? <div className="list-stack">{data.recent_exams.map(e => <Link className="recent-row" to={`/exams/${e.id}/start`} key={e.id}><div className="row-icon"><FileText size={19} /></div><div className="row-main"><strong>{e.title}</strong><span>{e.course_name} · {e.question_count} questions</span></div><span className="row-score">{fmtScore(e.last_score)}</span><ChevronRight size={17} className="row-chevron" /></Link>)}</div> : <Empty title="No exams yet" text="Upload a standardized MCQ PDF to make your first exam." action="Upload exam" to="/upload" />}</section>
      <section className="panel"><div className="section-heading"><div><h2>Recent attempts</h2><p>Your latest study sessions.</p></div><Link className="subtle-link" to="/history">View all <ArrowRight size={15} /></Link></div>{data.recent_attempts.length ? <div className="list-stack">{data.recent_attempts.map(a => <Link to={`/attempts/${a.id}`} className="recent-row" key={a.id}><div className="row-icon mint"><Target size={19} /></div><div className="row-main"><strong>{a.exam_title}</strong><span>{fmtDate(a.completed_at)} · {a.score}/{a.total_questions} correct</span></div><span className="score-pill">{fmtScore(a.percentage)}</span></Link>)}</div> : <div className="small-empty">Your completed exams will appear here.</div>}</section></div>
    <div className="dashboard-grid lower"><section className="panel"><div className="section-heading"><div><h2>Course progress</h2><p>A snapshot of each subject.</p></div><Link className="subtle-link" to="/courses">All courses <ArrowRight size={15} /></Link></div>{data.courses.length ? <div className="progress-list">{data.courses.map(c => <Link to={`/courses/${c.id}`} className="progress-row" key={c.id}><div className="progress-top"><strong>{c.name}</strong><span>{fmtScore(c.average_score)}</span></div><div className="progress-track"><span style={{ width: `${c.average_score || 0}%` }} /></div><div className="progress-meta">{c.exam_count} exams · {c.attempt_count} attempts</div></Link>)}</div> : <div className="small-empty">Create your first course to track progress.</div>}</section><section className="panel highlight-panel"><div className="highlight-icon"><GraduationCap size={23} /></div><p className="eyebrow">BEST PERFORMING COURSE</p><h2>{data.best_course?.name || 'Your next milestone'}</h2><p>{data.best_course ? `An average score of ${fmtScore(data.best_course.average_score)} across ${data.best_course.attempt_count} attempts.` : 'Complete an exam to see your strongest course here.'}</p>{data.best_course && <Link to={`/courses/${data.best_course.id}`} className="subtle-link">Explore course <ArrowRight size={15} /></Link>}</section></div>
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
  return <article className="exam-card"><div className="exam-card-main"><div className="exam-icon"><FileText size={21} /></div><div className="exam-info"><h3>{exam.title}</h3><p>{exam.question_count} questions <span>·</span> {exam.attempt_count} attempts <span>·</span> Created {fmtDate(exam.created_at)}</p></div><div className="exam-scores"><div><small>BEST</small><strong>{fmtScore(exam.best_score)}</strong></div><div><small>LATEST</small><strong>{fmtScore(exam.last_score)}</strong></div></div></div><div className="exam-card-footer"><div className="exam-meta">{exam.last_studied ? `Last studied ${fmtDate(exam.last_studied)}` : 'Ready when you are'}</div><div className="exam-actions"><button className="text-button" onClick={() => onRename(exam)}>Rename</button><button className="text-button danger" onClick={() => onDelete(exam)}>Delete</button><Link className="button secondary compact" to={`/exams/${exam.id}/review`}>Review</Link><Link className="button primary compact" to={`/exams/${exam.id}/start`}>Start exam <ArrowRight size={15} /></Link></div></div></article>
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
  return <><div className="list-toolbar"><label className="search-box"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search exams" aria-label="Search exams" /></label><select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort exams"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="best">Best score</option><option value="lowest">Lowest score</option><option value="recent">Recently studied</option></select></div>{visible.length ? <div className="exam-list">{visible.map(e => <ExamCard exam={e} key={e.id} onRename={setModal} onDelete={remove} />)}</div> : <Empty title={query ? 'No matching exams' : emptyTitle} text={query ? 'Try a different search term.' : emptyText} action={!query ? 'Upload exam' : undefined} to="/upload" />}{modal && <TextModal title="Rename exam" label="Exam title" initial={modal.title} onClose={() => setModal(null)} onSave={rename} busy={busy} />}</>
}

function CourseDetail() {
  const { id } = useParams()
  const { data, loading, error, refresh } = useData(() => api.course(id), id)
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  return <><Header back="/courses" eyebrow="COURSE LIBRARY" title={data.name} description={`${data.exam_count} exams · ${data.question_count} questions · Average score ${fmtScore(data.average_score)}`} actions={<Link className="button primary" to={`/upload?course=${id}`}><Plus size={17} /> Create / Upload Exam</Link>} /><div className="course-detail-summary"><div><span>EXAMS</span><strong>{data.exam_count}</strong></div><div><span>QUESTIONS</span><strong>{data.question_count}</strong></div><div><span>AVERAGE SCORE</span><strong>{fmtScore(data.average_score)}</strong></div><div><span>LAST STUDIED</span><strong>{fmtDate(data.last_studied)}</strong></div></div><div className="section-heading spaced"><div><h2>Exams in this course</h2><p>Choose an exam to practice or review.</p></div></div><ExamList exams={data.exams} refresh={refresh} /></>
}

function Exams() {
  const { data, loading, error, refresh } = useData(api.exams, 'exams')
  return <><Header eyebrow="PRACTICE LIBRARY" title="Recent Exams" description="Find an exam, pick a mode, and keep practicing." actions={<Link className="button primary" to="/upload"><Plus size={17} /> Upload exam</Link>} />{loading ? <Loading /> : error ? <ErrorBox message={error} retry={refresh} /> : <ExamList exams={data} refresh={refresh} />}</>
}

function ImportPractice({ questions, onSave, busy }) {
  const [position, setPosition] = useState(0)
  const [choices, setChoices] = useState({})
  const question = questions[position]
  const selected = choices[position]
  const correct = selected === question.correct_answer

  function choose(letter) {
    setChoices(previous => previous[position] ? previous : { ...previous, [position]: letter })
  }

  return <>
    <div className="preview-practice-toolbar">
      <div><strong>Practice before saving</strong><p>Choose an answer to see feedback. Save the exam when you're ready to track your results.</p></div>
      <label>Jump to <select aria-label="Jump to question" value={position} onChange={event => setPosition(Number(event.target.value))}>{questions.map((item, index) => <option key={item.source_id} value={index}>Question {index + 1}</option>)}</select></label>
    </div>
    <div className="preview-question preview-practice-question">
      <div className="question-label">QUESTION {position + 1} OF {questions.length}<span>PDF ID {question.source_id}</span></div>
      <h3>{question.question_text}</h3>
      <div className="answer-options">{'ABCD'.split('').map(letter => <button type="button" key={letter} disabled={!!selected} onClick={() => choose(letter)} className={`answer-option ${selected === letter ? 'selected' : ''} ${selected && question.correct_answer === letter ? 'correct' : ''} ${selected === letter && !correct ? 'wrong' : ''}`}><span className="option-letter">{letter}</span><span>{optionText(question, letter)}</span>{selected && question.correct_answer === letter && <Check size={18} className="answer-check" />}</button>)}</div>
      {selected && <div className={`study-feedback ${correct ? 'positive' : 'negative'}`} role="status"><strong>{correct ? 'Correct!' : 'Not quite.'}</strong> {correct ? 'You got it.' : `The correct answer is ${question.correct_answer}: ${optionText(question, question.correct_answer)}.`}</div>}
      <div className="question-footer"><button type="button" className="button secondary" disabled={position === 0} onClick={() => setPosition(value => value - 1)}><ArrowLeft size={16} /> Previous</button><button type="button" className="button secondary" disabled={position === questions.length - 1} onClick={() => setPosition(value => value + 1)}>Next question <ArrowRight size={16} /></button></div>
    </div>
    <div className="save-bar"><p>{questions.length} valid questions ready to import · {Object.keys(choices).length} tried here</p><button className="button primary" disabled={busy} onClick={onSave}>{busy ? 'Saving…' : 'Save exam'} <ArrowRight size={17} /></button></div>
  </>
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
  async function parse(event) {
    event.preventDefault(); setMessage(''); setPreview(null)
    if (!courseId || !title.trim() || !file) { setMessage('Choose a course, enter a title, and select a PDF.'); return }
    setBusy(true)
    try { setPreview(await api.preview(file)) } catch (e) { setMessage(e.message) } finally { setBusy(false) }
  }
  async function save() {
    setBusy(true); setMessage('')
    try { const exam = await api.saveExam({ course_id: Number(courseId), title: title.trim(), questions: preview.questions }); navigate(`/courses/${exam.course_id}`) } catch (e) { setMessage(e.message) } finally { setBusy(false) }
  }
  return <><Header back={courseId ? `/courses/${courseId}` : '/courses'} eyebrow="CREATE AN EXAM" title="Upload an MCQ PDF" description="Turn a standardized question PDF into an interactive practice exam." />{loading ? <Loading /> : error ? <ErrorBox message={error} retry={refresh} /> : !courses.length ? <Empty title="Create a course first" text="Your exam needs a course to live in. Create one, then come back to upload." action="Go to courses" to="/courses" /> : <div className="upload-layout"><div className="panel upload-form-panel"><div className="step-heading"><span>01</span><div><h2>Exam details</h2><p>Choose where this exam belongs.</p></div></div><form onSubmit={parse}><label className="field-label" htmlFor="course">Course</label><select id="course" value={courseId} onChange={e => { setCourseId(e.target.value); setPreview(null) }}><option value="">Select a course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><label className="field-label" htmlFor="title">Exam title</label><input id="title" value={title} onChange={e => { setTitle(e.target.value); setPreview(null) }} placeholder="e.g. Java Basics" maxLength={160} /><label className="field-label">MCQ PDF</label><label className={`drop-zone ${file ? 'has-file' : ''}`}><UploadCloud size={29} /><strong>{file ? file.name : 'Choose a PDF file'}</strong><span>{file ? `${(file.size / 1024).toFixed(0)} KB · Click to replace` : 'Standardized question format · Maximum 20 MB'}</span><input type="file" accept=".pdf,application/pdf" onChange={e => { setFile(e.target.files?.[0] || null); setPreview(null) }} /></label>{message && <div className="inline-error">{message}</div>}<button className="button primary wide" disabled={busy}>{busy ? <><span className="spinner small" /> Parsing PDF…</> : <>Parse & preview <ArrowRight size={17} /></>}</button></form></div><div className="upload-side"><div className="panel guide-panel"><div className="guide-icon"><FileText size={23} /></div><h3>How it works</h3><div className="guide-step"><span>1</span><p>Generate your MCQ PDF using the required question format.</p></div><div className="guide-step"><span>2</span><p>Upload it here and try the questions without seeing the answers first.</p></div><div className="guide-step"><span>3</span><p>Save the exam only when the preview looks right.</p></div></div><div className="format-note"><CheckCircle2 size={20} /><p>The website only reads the PDF structure. No AI is used in the application.</p></div></div></div>}{preview && <section className="preview-section"><div className="section-heading"><div><p className="eyebrow">STEP 02 · REVIEW</p><h2>Import preview</h2><p>Try the questions without seeing the answers first, then save your exam.</p></div></div><div className="preview-stats"><div><strong>{preview.detected_count}</strong><span>Detected blocks</span></div><div><strong>{preview.valid_count}</strong><span>Valid questions</span></div><div><strong>{preview.invalid_count}</strong><span>Invalid blocks</span></div></div>{preview.errors.length > 0 && <div className="parse-errors"><strong>Issues found</strong><p>Valid questions can still be saved. The blocks below will be skipped.</p>{preview.errors.map((item, index) => <div className="parse-error-row" key={index}><span>{item.block ? `Block ${item.block}${item.source_id ? ` · ID ${item.source_id}` : ''}` : `Line ${item.line || '—'}`}</span><span>{item.messages.join('; ')}</span></div>)}</div>}{preview.questions.length ? <><ImportPractice questions={preview.questions} onSave={save} busy={busy} /></> : <div className="inline-error">No valid questions were found. Fix the PDF format and upload it again.</div>}</section>}</>
}

function StartExam() {
  const { id } = useParams()
  const { data, loading, error, refresh } = useData(() => api.exam(id), id)
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  return <><Header back={`/courses/${data.course_id}`} eyebrow={data.course_name.toUpperCase()} title={data.title} description={`${data.question_count} questions · Pick the way you want to practice.`} /><div className="mode-grid"><Link className="mode-card" to={`/exams/${id}/take?mode=exam`}><div className="mode-icon blue"><Target size={27} /></div><h2>Exam Mode</h2><p>Answer at your own pace. See your score and correct answers after you submit.</p><span>Start Exam Mode <ArrowRight size={18} /></span></Link><Link className="mode-card" to={`/exams/${id}/take?mode=study`}><div className="mode-icon mint"><BookOpen size={27} /></div><h2>Study Mode</h2><p>Check each answer as you go and learn from immediate feedback.</p><span>Start Study Mode <ArrowRight size={18} /></span></Link></div><div className="panel start-info"><div><Clock3 size={20} /><strong>No time limit</strong><span>Move through questions at your own pace.</span></div><div><CheckCircle2 size={20} /><strong>Track every attempt</strong><span>Your results are saved to your history.</span></div></div></>
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
  const questions = useMemo(() => data?.questions.filter(q => !subset.length || subset.includes(q.id)) || [], [data, params.toString()])
  const q = questions[position]
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
    try { const result = await api.submit(id, { mode, question_ids: questions.map(item => item.id), answers }); navigate(`/attempts/${result.id}`) } catch (e) { setMessage(e.message); setBusy(false) }
  }
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  if (!questions.length) return <ErrorBox message="No questions were found for this practice session." />
  return <div className="exam-taking"><div className="exam-top"><Link className="back-link" to={`/exams/${id}/start`}><ArrowLeft size={16} /> Leave session</Link><span className="mode-badge">{mode === 'study' ? 'Study Mode' : 'Exam Mode'}</span></div><div className="exam-heading"><div><p className="eyebrow">{data.course_name.toUpperCase()}</p><h1>{data.title}</h1></div><div className="progress-count">Question <strong>{position + 1}</strong> of {questions.length}</div></div><div className="exam-progress"><span style={{ width: `${((position + 1) / questions.length) * 100}%` }} /></div><div className="exam-workspace"><div className="question-panel"><div className="question-label">QUESTION {position + 1} <span>{answered} of {questions.length} answered</span></div><h2>{q.question_text}</h2><div className="answer-options">{'ABCD'.split('').map(letter => { const state = checked[q.id]; const isSelected = selected === letter; const isCorrect = state?.correct_answer === letter; return <button type="button" disabled={!!state || (mode === 'study' && (!!selected || busy))} className={`answer-option ${isSelected ? 'selected' : ''} ${state && isCorrect ? 'correct' : ''} ${state && isSelected && !isCorrect ? 'wrong' : ''}`} key={letter} onClick={() => choose(letter)}><span className="option-letter">{letter}</span><span>{optionText(q, letter)}</span>{state && isCorrect && <Check size={18} className="answer-check" />}</button> })}</div>{mode === 'study' && checked[q.id] && <div className={`study-feedback ${checked[q.id].is_correct ? 'positive' : 'negative'}`}><strong>{checked[q.id].is_correct ? 'Correct answer!' : 'Not quite.'}</strong> The correct answer is {checked[q.id].correct_answer}: {optionText(q, checked[q.id].correct_answer)}.</div>}{message && <div className="inline-error">{message}</div>}<div className="question-footer"><button className="button secondary" disabled={position === 0 || busy} onClick={() => setPosition(p => p - 1)}><ArrowLeft size={16} /> Previous</button><div>{position < questions.length - 1 ? <button className="button primary" disabled={busy} onClick={() => setPosition(p => p + 1)}>Next question <ArrowRight size={16} /></button> : <button className="button primary" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit exam'} <ArrowRight size={16} /></button>}</div></div></div><aside className="navigator-panel"><div className="navigator-top"><h3>Questions</h3><span>{answered}/{questions.length} answered</span></div><div className="question-grid">{questions.map((item, index) => <button key={item.id} disabled={busy} onClick={() => setPosition(index)} className={`${index === position ? 'current' : ''} ${answers[item.id] ? 'answered' : ''}`} title={`Question ${index + 1}${answers[item.id] ? ' answered' : ' unanswered'}`}>{index + 1}</button>)}</div><div className="legend"><span><i className="legend-current" />Current</span><span><i className="legend-answered" />Answered</span><span><i />Unanswered</span></div><button className="button secondary wide" disabled={busy} onClick={submit}>Submit exam</button></aside></div></div>
}

function Result() {
  const { id } = useParams()
  const { data, loading, error, refresh } = useData(() => api.attempt(id), id)
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  const wrongIds = data.answers.filter(a => !a.is_correct).map(a => a.id)
  return <><Header back={`/courses/${data.course_id}`} eyebrow="EXAM COMPLETE" title="Your results" description={`${data.exam_title} · ${data.course_name} · ${fmtDate(data.completed_at)}`} /><div className="results-hero"><div className="score-ring" style={{ '--score': `${data.percentage}%` }}><div><strong>{fmtScore(data.percentage)}</strong><span>YOUR SCORE</span></div></div><div className="result-summary"><div className="result-kicker">NICE WORK · {data.mode === 'study' ? 'STUDY MODE' : 'EXAM MODE'}</div><h2>{data.score} out of {data.total_questions} correct</h2><p>Every attempt is a step forward. Review your answers to see what you know and what to revisit.</p><div className="result-actions"><Link className="button primary" to={`/attempts/${id}/review`}>Review answers <ArrowRight size={16} /></Link><Link className="button secondary" to={`/exams/${data.exam_id}/take?mode=exam`}>Retry exam</Link></div></div></div><div className="result-stats"><div><span className="dot mint" /><strong>{data.correct_count}</strong><span>Correct</span></div><div><span className="dot peach" /><strong>{data.wrong_count}</strong><span>Wrong</span></div><div><span className="dot gray" /><strong>{data.unanswered_count}</strong><span>Unanswered</span></div></div><div className="result-links">{wrongIds.length > 0 && <Link className="button secondary" to={`/exams/${data.exam_id}/take?mode=exam&questions=${wrongIds.join(',')}`}>Retry wrong questions <ArrowRight size={16} /></Link>}<Link className="button text-only" to={`/courses/${data.course_id}`}>Back to course</Link></div></>
}

function Review() {
  const { id, attemptId } = useParams()
  const loader = attemptId ? () => api.attempt(attemptId) : () => api.examReview(id)
  const { data, loading, error, refresh } = useData(loader, attemptId || id)
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} retry={refresh} />
  const questions = attemptId ? data.answers : data.questions
  return <><Header back={attemptId ? `/attempts/${attemptId}` : `/courses/${data.course_id}`} eyebrow="ANSWER REVIEW" title={data.exam_title || data.title} description={attemptId ? `Your attempt on ${fmtDate(data.completed_at)} · ${data.score}/${data.total_questions} correct` : 'Explore the answer key before your next practice session.'} actions={<Link className="button primary" to={`/exams/${data.exam_id || data.id}/take?mode=exam`}>Try exam <ArrowRight size={16} /></Link>} /><div className="review-list">{questions.map((q, index) => <article className="review-card" key={q.id}><div className="review-head"><span>QUESTION {index + 1}</span>{attemptId && <span className={`review-status ${q.is_correct ? 'right' : q.selected_answer ? 'wrong' : 'skipped'}`}>{q.is_correct ? 'Correct' : q.selected_answer ? 'Incorrect' : 'Unanswered'}</span>}</div><h3>{q.question_text}</h3><div className="review-options">{'ABCD'.split('').map(letter => <div key={letter} className={`${q.correct_answer === letter ? 'right' : ''} ${q.selected_answer === letter && !q.is_correct ? 'wrong' : ''}`}><span className="option-letter">{letter}</span><span>{optionText(q, letter)}</span>{q.correct_answer === letter && <span className="answer-tag"><Check size={14} /> Correct answer</span>}{q.selected_answer === letter && q.correct_answer !== letter && <span className="answer-tag">Your answer</span>}</div>)}</div>{attemptId && !q.selected_answer && <p className="review-note">You left this question unanswered.</p>}</article>)}</div></>
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
