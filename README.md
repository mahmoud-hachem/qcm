# QuizFlow

QuizFlow turns a ChatGPT-generated, standardized MCQ PDF into an interactive practice exam. PDF reading, scoring, and saving happen in the visitor's browser. The live site needs only static hosting; it has no server or database account.

## Run locally

```powershell
npm install
npm run dev
```

Run these commands in the `qcm` folder, then open `http://127.0.0.1:5173/`.

## Try a PDF

1. Choose **Mahmoud** or **Amer**, then create a course.
2. Choose **Upload exam**, enter a title, and select `sample/sample-mcq.pdf`.
3. Try a question in the preview, then save the exam.
4. Choose a short session or the full exam. Study Mode checks each answer immediately; Exam Mode shows results after submission.

To generate a PDF from your own course material, use **Open ChatGPT** on the Upload page to open a new chat with the prompt ready. Attach your course PDF before sending. **Copy prompt** and `MCQ_GENERATION_PROMPT.md` are available if you need to paste it manually. The prompt aims for roughly 50–70 useful questions while covering the full source; if more are genuinely needed, it identifies what belongs in a second part. QuizFlow shuffles answer positions during practice and offers 10, 20, 40, 60, or all questions per session. The PDF must contain selectable text and use the exact question blocks below. A scanned image PDF needs OCR first.

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

Choose **Mahmoud** or **Amer** when opening the app. Each profile has separate courses, exams, and results in this browser. Existing data from before profiles were added belongs to **Mahmoud** automatically; Amer starts empty. Use **Switch profile** in the header to change profiles.

These are local profiles without passwords, not online accounts. Anyone using the same browser can open either profile. Another browser or device starts empty; profiles do not sync. PDF bytes are read locally and are not uploaded to a server. Use **Settings → Export backup** and **Import backup** to move or back up the selected profile's data. Importing replaces only that profile. Clearing site data can erase both profiles.

For Vercel and the Porkbun domain, follow `DEPLOYMENT.md`. The repository root is the Vite app, so Vercel does not need a custom Root Directory.
