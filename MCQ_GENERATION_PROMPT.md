# Reusable course PDF study exam prompt

Attach the course or chapter PDF in ChatGPT, then paste this prompt. Copy the resulting question block and paste it into QuizFlow's **Add a study exam** text box.

```text
Use the attached course or chapter PDF as the source to create an MCQ study exam covering the entire material. Use whichever PDF I attach; do not assume a particular chapter number, title, or subject.

- Read the entire source PDF, including its final pages, before writing questions.
- Cover all important concepts, definitions, principles, comparisons, processes, and ideas. Mix knowledge, understanding, application, and comparison questions.
- Base every question on the source PDF. Avoid unrelated trivia, filler, and repeated questions about the same point. Choose the number of questions needed for thorough but manageable coverage.
- Give every question exactly four distinct, plausible choices A through D and exactly one correct answer. Vary the correct answer letters without a predictable sequence.
- Order questions by their source PDF pages, starting at Q1 and numbering consecutively.
- Immediately after each question, give the verified page of the attached source PDF where its answer is taught. Count the first PDF page as page 1. Use "PDF page: 108" for one page or "PDF pages: 108–109" for a range. Do not guess page numbers.
- After the choices, give the correct answer letter and a short, useful explanation.

Return the entire exam as plain, copyable text in ONE code block so I can use its Copy button to copy every question at once. Do not create or link a PDF. Do not add a title, introduction, answer key, summary, or commentary before or after the code block. Keep one blank line between question blocks. Use this exact structure, including the ** markers around the page, answer, and explanation labels:

Q1. <question text>
**PDF page: <verified source page number>**
A. <option text>
B. <option text>
C. <option text>
D. <option text>
**Correct answer: <A, B, C, or D>**
**Explanation:** <short useful explanation>

For a question using more than one source page, use **PDF pages: <first page>–<last page>**. Continue with Q2, Q3, and so on. Replace every placeholder with actual content. Keep each choice on its own line; do not use a trailing backslash for line breaks.

Before replying, check important concepts in every section including the final pages, remove duplicates, verify every source page, and confirm that each question has four options, one correct answer, and an explanation. Output only the complete code block so all questions can be copied together.
```
