# QuizFlow

QuizFlow turns chapter study questions into an interactive exam. Questions and results stay in the visitor's browser; the site needs only static hosting.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Add a study exam

1. Open the shared workspace and create a course.
2. Use [the reusable prompt](MCQ_GENERATION_PROMPT.md) with any course or chapter PDF in ChatGPT. Copy all generated mixed Q1/Q2 questions from its single code block and paste them into **Add a study exam**.
3. Preview the imported questions, then save the exam. The example in [sample-mixed-exam.txt](sample/sample-mixed-exam.txt) shows the required layout.
4. Use Study Mode for immediate answer feedback and explanations, or Exam Mode to review pages, answers, and explanations after submission.

Questions use numbered `Q1.` headings, a `Type:`, a source `PDF page:` (or range), and `Explanation:`. Supported types:

- `MCQ`: choices A-D and `Correct answer: B`.
- `TRUE_FALSE`: A. True / B. False and a correct letter.
- `CLOZE`: a paragraph with numbered `[[1]]` placeholders and one `Blank 1: MCQ` block per dropdown, each with its own choices and correct letter. Can include `Blank n: TEXT` blocks too.
- `FILL_BLANK`: a paragraph with numbered placeholders and `Blank n: TEXT` blocks with `Accepted answers: term | equivalent variant`.

See [the mixed sample](sample/sample-mixed-exam.txt) for all four types and a paragraph combining dropdown and typed blanks. The sample's page references are illustrative. Existing four-choice Q1 imports and legacy `[QUESTION_START]` imports still work. The importer validates every detected question and blocks saving when a question has errors. Page references come from the generated text and are not independently checked against the PDF.

Click an inline blank to open its dropdown, or type into a text blank. In Study Mode, choices get immediate feedback; complete all paragraph blanks and click **Check answers** to review them together. Exam Mode lets you revise responses before submission. Each question is one point; all blanks must be correct to earn a paragraph question's point. Reviews show every blank's response and accepted answers. Typed answers ignore capitalization, Unicode compatibility differences, and extra spaces, but otherwise must match a listed accepted variant.

Study Mode follows source PDF page order. Exam Mode shuffles questions and choices, including choices inside each dropdown. Shorter exams sample across the course.

There is one shared library per browser with no profile chooser. On first opening this version, both previous profile libraries merge automatically, preserving courses, questions, results, and their relationships even when IDs overlap. Original profile records remain available in browser storage as migration sources. The shared workspace does not sync between devices or visitors. Use Settings to export or import backups; older profile backups can also be imported.

## Checks

```powershell
node --test src/*.test.js
npm run build
```

For deployment, see [DEPLOYMENT.md](DEPLOYMENT.md).
