import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from database import Base, engine, get_db
from models import Attempt, AttemptAnswer, Course, Exam, Question, Workspace
from parser import PDFReadError, parse_pdf
from schemas import AttemptInput, CheckInput, CourseInput, ExamInput, ExamRename
from workspaces import get_workspace


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if engine.dialect.name == "sqlite":
        with engine.begin() as connection:
            columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(courses)")}
            if columns and "workspace_id" not in columns:
                existing = connection.exec_driver_sql("SELECT COUNT(*) FROM courses").scalar()
                if existing:
                    raise RuntimeError("This older SQLite database contains courses. Back it up and migrate them before enabling private workspaces.")
                connection.exec_driver_sql("ALTER TABLE courses ADD COLUMN workspace_id VARCHAR(64)")
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="QuizFlow API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173,http://127.0.0.1:5173").split(",")],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)


def fail(message: str, status: int = 400):
    raise HTTPException(status_code=status, detail=message)


def require_course(db: Session, course_id: int, workspace: Workspace):
    course = db.scalar(select(Course).where(Course.id == course_id, Course.workspace_id == workspace.id))
    if not course:
        fail("Course not found.", 404)
    return course


def require_exam(db: Session, exam_id: int, workspace: Workspace):
    exam = db.scalar(select(Exam).join(Course).options(selectinload(Exam.questions), selectinload(Exam.attempts), selectinload(Exam.course)).where(Exam.id == exam_id, Course.workspace_id == workspace.id))
    if not exam:
        fail("Exam not found.", 404)
    return exam


def question_data(question: Question, include_answer=False):
    data = {"id": question.id, "source_id": question.source_id, "question_number": question.question_number,
            "question_text": question.question_text, "option_a": question.option_a, "option_b": question.option_b,
            "option_c": question.option_c, "option_d": question.option_d}
    if include_answer:
        data["correct_answer"] = question.correct_answer
    return data


def exam_summary(exam: Exam):
    attempts = sorted(exam.attempts, key=lambda a: a.completed_at, reverse=True)
    return {"id": exam.id, "course_id": exam.course_id, "course_name": exam.course.name,
            "title": exam.title, "created_at": exam.created_at, "question_count": len(exam.questions),
            "attempt_count": len(attempts), "best_score": max((a.percentage for a in attempts), default=None),
            "last_score": attempts[0].percentage if attempts else None,
            "last_studied": attempts[0].completed_at if attempts else None,
            "latest_attempt_id": attempts[0].id if attempts else None}


def course_summary(course: Course):
    exams = course.exams
    attempts = [attempt for exam in exams for attempt in exam.attempts]
    return {"id": course.id, "name": course.name, "created_at": course.created_at,
            "exam_count": len(exams), "question_count": sum(len(exam.questions) for exam in exams),
            "average_score": round(sum(a.percentage for a in attempts) / len(attempts), 1) if attempts else None,
            "attempt_count": len(attempts),
            "last_studied": max((a.completed_at for a in attempts), default=None)}


def attempt_summary(attempt: Attempt):
    return {"id": attempt.id, "exam_id": attempt.exam_id, "exam_title": attempt.exam.title,
            "course_id": attempt.exam.course_id, "course_name": attempt.exam.course.name,
            "mode": attempt.mode, "score": attempt.score, "total_questions": attempt.total_questions,
            "percentage": attempt.percentage, "correct_count": attempt.correct_count,
            "wrong_count": attempt.wrong_count, "unanswered_count": attempt.unanswered_count,
            "completed_at": attempt.completed_at}


def all_courses(db: Session, workspace: Workspace):
    return db.scalars(select(Course).options(selectinload(Course.exams).selectinload(Exam.questions),
                                              selectinload(Course.exams).selectinload(Exam.attempts)).where(Course.workspace_id == workspace.id).order_by(Course.created_at.desc())).all()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    courses = [course_summary(c) for c in all_courses(db, workspace)]
    exams = db.scalars(select(Exam).join(Course).options(selectinload(Exam.questions), selectinload(Exam.attempts), selectinload(Exam.course)).where(Course.workspace_id == workspace.id).order_by(Exam.created_at.desc()).limit(5)).all()
    attempts = db.scalars(select(Attempt).join(Exam).join(Course).options(selectinload(Attempt.exam).selectinload(Exam.course)).where(Course.workspace_id == workspace.id).order_by(Attempt.completed_at.desc()).limit(5)).all()
    total_attempts = db.scalar(select(func.count(Attempt.id)).join(Exam).join(Course).where(Course.workspace_id == workspace.id)) or 0
    average = db.scalar(select(func.avg(Attempt.percentage)).join(Exam).join(Course).where(Course.workspace_id == workspace.id))
    ranked = [c for c in courses if c["average_score"] is not None]
    best = max(ranked, key=lambda c: c["average_score"], default=None)
    return {"total_courses": len(courses), "total_exams": db.scalar(select(func.count(Exam.id)).join(Course).where(Course.workspace_id == workspace.id)) or 0,
            "total_attempts": total_attempts, "average_score": round(average, 1) if average is not None else None,
            "recent_exams": [exam_summary(e) for e in exams], "recent_attempts": [attempt_summary(a) for a in attempts],
            "best_course": best, "courses": courses}


@app.get("/api/courses")
def list_courses(db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    return [course_summary(c) for c in all_courses(db, workspace)]


@app.post("/api/courses", status_code=201)
def create_course(payload: CourseInput, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    name = payload.name.strip()
    if not name:
        fail("Enter a course name.")
    course = Course(name=name, workspace_id=workspace.id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return {"id": course.id, "name": course.name}


@app.get("/api/courses/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    course = db.scalar(select(Course).options(selectinload(Course.exams).selectinload(Exam.questions),
                                               selectinload(Course.exams).selectinload(Exam.attempts)).where(Course.id == course_id, Course.workspace_id == workspace.id))
    if not course:
        fail("Course not found.", 404)
    result = course_summary(course)
    result["exams"] = [exam_summary(exam) for exam in course.exams]
    return result


@app.patch("/api/courses/{course_id}")
def rename_course(course_id: int, payload: CourseInput, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    course = require_course(db, course_id, workspace)
    course.name = payload.name.strip()
    if not course.name:
        fail("Enter a course name.")
    db.commit()
    return {"id": course.id, "name": course.name}


@app.delete("/api/courses/{course_id}", status_code=204)
def delete_course(course_id: int, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    course = require_course(db, course_id, workspace)
    db.delete(course)
    db.commit()


@app.post("/api/exams/preview")
async def preview_exam(file: UploadFile = File(...), _workspace: Workspace = Depends(get_workspace)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        fail("Choose a PDF file ending in .pdf.")
    contents = await file.read(20 * 1024 * 1024 + 1)
    if len(contents) > 20 * 1024 * 1024:
        fail("The PDF is too large. Maximum size is 20 MB.")
    try:
        return parse_pdf(contents)
    except PDFReadError as exc:
        fail(str(exc))


@app.post("/api/exams", status_code=201)
def create_exam(payload: ExamInput, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    require_course(db, payload.course_id, workspace)
    title = payload.title.strip()
    if not title:
        fail("Enter an exam title.")
    ids = [q.source_id for q in payload.questions]
    if len(ids) != len(set(ids)):
        fail("Question IDs must be unique.")
    exam = Exam(course_id=payload.course_id, title=title)
    db.add(exam)
    db.flush()
    for index, item in enumerate(payload.questions, start=1):
        data = item.model_dump()
        data["question_number"] = index
        db.add(Question(exam_id=exam.id, **data))
    db.commit()
    return {"id": exam.id, "course_id": exam.course_id, "title": exam.title}


@app.get("/api/exams")
def list_exams(db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    exams = db.scalars(select(Exam).join(Course).options(selectinload(Exam.questions), selectinload(Exam.attempts), selectinload(Exam.course)).where(Course.workspace_id == workspace.id).order_by(Exam.created_at.desc())).all()
    return [exam_summary(exam) for exam in exams]


@app.get("/api/exams/{exam_id}")
def get_exam(exam_id: int, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    exam = require_exam(db, exam_id, workspace)
    return {**exam_summary(exam), "questions": [question_data(q) for q in exam.questions]}


@app.get("/api/exams/{exam_id}/review")
def review_exam(exam_id: int, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    exam = require_exam(db, exam_id, workspace)
    return {**exam_summary(exam), "questions": [question_data(q, True) for q in exam.questions]}


@app.patch("/api/exams/{exam_id}")
def rename_exam(exam_id: int, payload: ExamRename, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    exam = require_exam(db, exam_id, workspace)
    exam.title = payload.title.strip()
    if not exam.title:
        fail("Enter an exam title.")
    db.commit()
    return {"id": exam.id, "title": exam.title}


@app.delete("/api/exams/{exam_id}", status_code=204)
def delete_exam(exam_id: int, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    exam = require_exam(db, exam_id, workspace)
    db.delete(exam)
    db.commit()


@app.post("/api/exams/{exam_id}/check")
def check_answer(exam_id: int, payload: CheckInput, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    question = db.scalar(select(Question).join(Exam).join(Course).where(Question.exam_id == exam_id, Question.id == payload.question_id, Course.workspace_id == workspace.id))
    if not question:
        fail("Question not found in this exam.", 404)
    return {"correct_answer": question.correct_answer, "is_correct": payload.selected_answer == question.correct_answer}


@app.post("/api/exams/{exam_id}/attempts", status_code=201)
def submit_attempt(exam_id: int, payload: AttemptInput, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    exam = require_exam(db, exam_id, workspace)
    questions = {q.id: q for q in exam.questions}
    ids = payload.question_ids
    if len(ids) != len(set(ids)) or any(qid not in questions for qid in ids):
        fail("The selected questions do not belong to this exam.")
    if any(qid not in ids for qid in payload.answers):
        fail("An answer refers to a question outside this attempt.")
    answers = [(questions[qid], payload.answers.get(qid)) for qid in ids]
    correct = sum(selected == question.correct_answer for question, selected in answers)
    unanswered = sum(selected is None for _, selected in answers)
    attempt = Attempt(exam_id=exam_id, mode=payload.mode, score=correct, total_questions=len(ids),
                      percentage=round(correct / len(ids) * 100, 1), correct_count=correct,
                      wrong_count=len(ids) - correct - unanswered, unanswered_count=unanswered)
    db.add(attempt)
    db.flush()
    for question, selected in answers:
        db.add(AttemptAnswer(attempt_id=attempt.id, question_id=question.id,
                             selected_answer=selected, is_correct=selected == question.correct_answer))
    db.commit()
    return {"id": attempt.id}


@app.get("/api/attempts")
def list_attempts(exam_id: int | None = None, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    query = select(Attempt).join(Exam).join(Course).options(selectinload(Attempt.exam).selectinload(Exam.course)).where(Course.workspace_id == workspace.id).order_by(Attempt.completed_at.desc())
    if exam_id is not None:
        query = query.where(Attempt.exam_id == exam_id)
    return [attempt_summary(a) for a in db.scalars(query).all()]


@app.get("/api/attempts/{attempt_id}")
def get_attempt(attempt_id: int, db: Session = Depends(get_db), workspace: Workspace = Depends(get_workspace)):
    attempt = db.scalar(select(Attempt).join(Exam).join(Course).options(selectinload(Attempt.exam).selectinload(Exam.course),
                                                 selectinload(Attempt.answers).selectinload(AttemptAnswer.question)).where(Attempt.id == attempt_id, Course.workspace_id == workspace.id))
    if not attempt:
        fail("Attempt not found.", 404)
    result = attempt_summary(attempt)
    result["answers"] = [{**question_data(answer.question, True), "selected_answer": answer.selected_answer,
                          "is_correct": answer.is_correct} for answer in sorted(attempt.answers, key=lambda a: a.question.question_number)]
    return result


if os.getenv("SERVE_FRONTEND") == "1":
    frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
    if not (frontend_dist / "index.html").exists():
        raise RuntimeError("Frontend build is missing. Run npm run build before serving it from FastAPI.")
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend_fallback(path: str):
        if path.startswith("api/"):
            fail("API endpoint not found.", 404)
        return FileResponse(frontend_dist / "index.html")
