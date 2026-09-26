# Reusable course PDF study exam prompt

Attach the course or chapter PDF you want to study, then copy this prompt into ChatGPT. Download the PDF it creates and upload that PDF to QuizFlow.

```text
Use the attached course or chapter PDF as the main source to create an MCQ study exam covering the entire attached material. Use whichever PDF I attach; do not assume a particular chapter number, title, or subject.

- Read the entire PDF before creating questions, including its final pages.
- Cover all important concepts, definitions, principles, comparisons, processes, and ideas.
- Mix direct knowledge, understanding, application/scenario, comparison, and concept-identification questions. Make students use the ideas, not merely recognize copied sentences.
- Base every question on the attached PDF. Do not introduce unrelated information or unimportant trivia.
- Choose the question count from the material itself, with no target, minimum, or fixed maximum. Keep the exam manageable: use only enough questions to cover the whole course properly. Combine repeated ideas, avoid testing the same point repeatedly, and remove filler. Do not leave out an important concept just to shorten the exam.
- Every question must have exactly four distinct options, A through D, and exactly one correct answer. Make wrong options plausible and related to the topic.
- Distribute correct letters across A, B, C, and D without an obvious sequence or one letter dominating.
- Arrange the question blocks in the order of the source PDF pages so the exam can also be used for step-by-step studying. QuizFlow will shuffle them in Exam Mode.
- Put the exact source PDF page reference immediately below every question, before option A. Use the page number of the attached course PDF, counting its first PDF page as page 1. Check the actual page where the answer is taught; do not guess or use the generated exam PDF's page number. For example, if the idea appears on source page 7, write "PDF page: 7". If it depends on source pages 7 and 8, write "PDF pages: 7–8". Replace these example numbers with the verified page or pages for each real question.
- After each question, state the correct answer and give a short, useful explanation. Explain the concept and, when helpful, why other choices are wrong.

Create one downloadable, text-selectable PDF containing the full exam. Name it after the attached source PDF with "-study-mcq" added before .pdf. In the generated PDF, use a clean single-column layout with no cover, introduction, running headers, separate answer key, or other text outside the question blocks. Every question must visibly contain its source PDF page reference in the exact format above. Keep each question, its options, page reference, answer, and explanation together when possible. Do not make an image-only PDF.

Use this exact plain-text structure in the generated PDF for every question, with consecutive numbers starting at Q1:

Q1. <question text>
PDF page: <actual source PDF page number>
A. <option text>
B. <option text>
C. <option text>
D. <option text>
Correct answer: <A, B, C, or D>
Explanation: <short useful explanation>

For a question based on more than one page, write "PDF pages: <first source page>–<last source page>" instead. Continue Q2, Q3, and so on in the same structure. Replace all placeholders with real content and verified source page numbers.

Before finishing, make an internal checklist of the important concepts in every section and check the complete exam against it, including the final pages. Remove unnecessary duplicates, verify every source page reference, confirm four options and one correct answer per question, check the answer-letter distribution, and confirm every question has an explanation. Extract the generated PDF's text and verify that every question still contains its source page line, options, correct answer, and explanation. In your chat reply, provide the downloadable PDF and briefly report the actual question count and coverage. If you cannot generate an actual downloadable PDF, say so clearly and provide the same question blocks as plain text.
```
