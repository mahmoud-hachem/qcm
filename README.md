# QuizFlow

A multi-course MCQ study app. Upload a standardized text-based PDF, preview the parsed questions, then save it as an interactive exam. No AI runs inside the app. Each browser has a separate private workspace.

## Project structure

```text
qcm/
├── backend/
│   ├── main.py           FastAPI routes and scoring
│   ├── database.py       SQLAlchemy engine and session
│   ├── models.py         relational database models
│   ├── parser.py         strict PDF question parser
│   ├── workspaces.py     anonymous workspace isolation
│   ├── schemas.py        request validation
│   └── requirements.txt
├── frontend/
│   ├── src/api.js        API calls and error messages
│   ├── src/App.jsx       pages and reusable UI components
│   ├── src/styles.css    responsive light theme
│   └── package.json
├── MCQ_GENERATION_PROMPT.md   reusable prompt for ChatGPT
├── Dockerfile            single-service cloud build
├── DEPLOYMENT.md         hosting and domain setup
└── sample/
    ├── sample-mcq.txt    required question format
    ├── sample-mcq.pdf    ready-to-upload sample PDF
    └── make_sample_pdf.py
```

## Run locally on Windows

Open **two PowerShell terminals** in the `qcm` folder.

### Terminal 1: backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

If PowerShell blocks activation, use `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`, then `.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000`.

### Terminal 2: frontend

```powershell
cd frontend
npm install
npm run dev
```

Open **http://127.0.0.1:5173/** in your browser. The backend API docs are at **http://127.0.0.1:8000/docs**. Keep both terminals running. SQLite creates `backend/studymcq.db` on first backend startup.

In **Settings**, copy your workspace recovery key before clearing browser data or moving to another device. Anyone with the key can access your courses and results.

## Try the complete flow

1. Open **Courses** and create a course, such as `Java`.
2. Open the course and choose **Create / Upload Exam**.
3. Enter an exam title and upload `sample/sample-mcq.pdf`.
4. Review the detected questions and choose **Save exam**.
5. Start the exam in Exam Mode or Study Mode, answer questions, and submit.
6. Review the result, retry the exam or wrong questions, and open **History**.

The sample PDF is generated from `sample/sample-mcq.txt`. To regenerate it, run `python sample/make_sample_pdf.py` from the project root after installing backend requirements.

To generate new exams from your own course material, attach the course PDF to ChatGPT and use `MCQ_GENERATION_PROMPT.md`. Always inspect the website's import preview before saving.

For the free-hosting trial with Render, Neon, and a Porkbun domain, follow `DEPLOYMENT.md`. The local app continues to use SQLite unless you set `DATABASE_URL`.

## PDF format

Each question must use this exact set of fields inside markers:

```text
[QUESTION_START]
ID: 1
QUESTION: What does JVM stand for?
OPTION_A: Java Virtual Machine
OPTION_B: Java Visual Manager
OPTION_C: Java Variable Method
OPTION_D: Java Verification Mode
CORRECT_ANSWER: A
[QUESTION_END]
```

IDs must be positive, unique whole numbers. Correct answers must be `A`, `B`, `C`, or `D`. All fields must contain text. Long question and option values may wrap onto continuation lines after their field label. The PDF must contain selectable text; scanned page images are not supported. Invalid blocks are reported and skipped. A preview with zero valid questions cannot be saved.

## Configuration

- Backend: `DATABASE_URL` defaults to `sqlite:///./studymcq.db`; `FRONTEND_ORIGIN` defaults to both `localhost:5173` and `127.0.0.1:5173`. Set these environment variables before starting the backend if needed. PostgreSQL is supported through `DATABASE_URL` for deployment.
- Frontend: copy `frontend/.env.example` to `frontend/.env` to override `VITE_API_URL`. The default is `http://127.0.0.1:8000/api`.
- App name: change `APP_NAME` in `frontend/src/config.js`.

## Current limitations

Anonymous workspaces are tied to a recovery key rather than an account, so key loss means workspace loss. The initial public trial still needs abuse controls before a larger launch. PDF parsing expects selectable text in the specified layout and does not perform OCR. Database tables are created on startup; a mature production service should use migrations and user accounts.
