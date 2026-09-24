# ChatGPT prompt for QuizFlow PDFs

Attach your **course or slide PDF** to ChatGPT, then copy the prompt below. QuizFlow also has a **Copy ChatGPT prompt** button on its Upload page.

```text
Use the attached course PDF as the only source. Create an MCQ study exam for it that I can upload to QuizFlow.

Coverage and length:
- Read the whole source first. Identify the distinct testable ideas in every substantive slide or section. Combine slides that repeat the same idea. Do not make filler, trivia, duplicate, or unsupported questions.
- Make 20 to 30 high-value questions for this PDF, with a hard maximum of 40. Cover the breadth of the material, not only the beginning. Use a mix of recall, understanding, and application when the source supports it.
- If 40 questions cannot reasonably cover the material, split it into parts by topic or slide range. Create only Part 1 now (at most 40 questions). In your chat reply, say which topics/slides Part 1 covers and which remain. Wait for me to say “next part” before making Part 2. Each part must start its IDs at 1 and be a separate PDF.

Answer quality:
- Every question must have exactly one clearly correct answer and three plausible, distinct wrong answers. Avoid clues such as one option being much longer, more detailed, or grammatically different.
- Shuffle the four options independently for each question. Correct letters should be reasonably spread across A, B, C, and D over the whole PDF, but do not use any repeating sequence such as A-B-C-D-A-B-C-D, a fixed rotation, or a predictable pattern. Do not assign letters in slide order or question order.
- Before exporting, inspect the complete sequence of CORRECT_ANSWER letters. If a short sequence repeats or one letter dominates, reshuffle options and update the answer lines. Check that each CORRECT_ANSWER still points to the right option text.

PDF and exact format:
- Create a downloadable, text-selectable PDF named course-mcq-part-1.pdf. Use a clean single-column layout. Do not make a scanned or image-only PDF.
- The PDF must contain ONLY question blocks. No title, page number, introduction, explanations, answer key, citations, markdown, or other text inside the PDF.
- Use the following exact field names and markers for every question. Replace the example values; do not include this example question unless it is supported by the source:

[QUESTION_START]
ID: 1
QUESTION: What does JVM stand for?
OPTION_A: Java Visual Manager
OPTION_B: Java Variable Method
OPTION_C: Java Virtual Machine
OPTION_D: Java Verification Mode
CORRECT_ANSWER: C
[QUESTION_END]

- Number IDs consecutively from 1 within each PDF. Each block needs one QUESTION, OPTION_A through OPTION_D, and CORRECT_ANSWER containing only A, B, C, or D. Leave a blank line between blocks. Do not split marker or field labels across lines.

Before giving me the PDF, extract its text and verify that QuizFlow's markers and all seven fields appear for every block, all IDs are unique, and the final count is at most 40. In your chat reply, report the question count, coverage, and whether another part is needed. If you cannot create an actual downloadable PDF, say so clearly.
```

Upload each part as a separate exam in QuizFlow. You can choose a 10, 20, or 40 question practice session, or study the whole imported exam. QuizFlow shuffles answer positions during practice, including for older PDFs with a predictable answer sequence.
