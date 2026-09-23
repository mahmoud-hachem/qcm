# QuizFlow

QuizFlow turns a ChatGPT-generated, standardized MCQ PDF into an interactive practice exam. PDF reading, scoring, and saving happen in the visitor's browser. The live site needs only static hosting; it has no server or database account.

## Run locally

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`. You do not need to start the old FastAPI backend.

## Try a PDF

1. Create a course.
2. Choose **Upload exam**, enter a title, and select `sample/sample-mcq.pdf`.
3. Review the parsed questions, then save the exam.
4. Take the exam in Exam or Study Mode and check its result in History.

To generate a PDF from your own course material, use `MCQ_GENERATION_PROMPT.md` with ChatGPT. The PDF must contain selectable text and use the exact question blocks below. A scanned image PDF needs OCR first.

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

IDs must be unique positive whole numbers. Answers must be A, B, C, or D. Invalid blocks are reported in the import preview and skipped. The app does not generate questions or run AI.

## Data and privacy

Each browser stores its own courses, parsed questions, and results in IndexedDB. PDF bytes are read locally and are not uploaded to a server. Other visitors cannot see this browser's workspace. Another browser or device starts with an empty workspace. Use **Settings → Export backup** and **Import backup** to move or back up your data. Clearing site data can erase it.

The existing `backend/` and root `Dockerfile` are from the earlier server-based version and are no longer used by the frontend. Existing local SQLite files are left intact; this browser-only version does not automatically import them.

For Vercel and the Porkbun domain, follow `DEPLOYMENT.md`.
