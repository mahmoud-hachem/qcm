# QuizFlow

QuizFlow turns chapter study questions into an interactive exam. Questions and results stay in the visitor's browser; the site needs only static hosting.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Add a study exam

1. Choose the Mahmoud or Amer profile and create a course.
2. Use [the reusable prompt](MCQ_GENERATION_PROMPT.md) with any course or chapter PDF in ChatGPT. Download the generated, text-selectable MCQ PDF and upload it through **Add a study exam**. You can also paste the Q1/Q2 text or upload it as `.txt` or `.md`.
3. Preview the imported questions, then save the exam. The example in [sample-mcq.txt](sample/sample-mcq.txt) shows the required layout.
4. Use Study Mode for immediate answer feedback and explanations, or Exam Mode to review pages, answers, and explanations after submission.

Each question must have a numbered `Q1.` heading, `PDF page: X` or `PDF pages: X–Y`, options `A.` through `D.`, `Correct answer: A` (or B/C/D), and `Explanation:`. Long questions, options, and explanations may wrap to later lines. Import errors appear in the preview and must be fixed before saving, so questions are not silently omitted. The page references are copied from the generated questions; QuizFlow does not verify them against the course PDF. Older `[QUESTION_START]` PDF imports still work, without page references or explanations.

Study Mode defaults to all questions in source PDF page order and keeps the original answer positions; shorter study sessions start from the beginning in the same order. Exam Mode shuffles questions and answer positions, including in full sessions; shorter exams sample across the course. Existing exams and results remain in local browser storage. Each profile has separate courses, exams, and attempts; use Settings to export or import a backup. Profiles have no passwords or online sync.

For deployment, see [DEPLOYMENT.md](DEPLOYMENT.md).
