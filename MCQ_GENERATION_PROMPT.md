# Reusable ChatGPT prompt for QuizFlow PDFs

Attach the **course PDF** to ChatGPT, then paste this prompt. Replace the bracketed values before sending.

```text
Use the attached course PDF as the only source. Create [NUMBER, e.g. 30] multiple-choice study questions for [COURSE OR TOPIC]. Aim for [DIFFICULTY, e.g. mixed beginner/intermediate]. Cover the important sections of the source proportionally. Do not invent facts that are not supported by the PDF. If the source does not support the requested number of good questions, make fewer and tell me the actual count in your chat reply.

Create a downloadable PDF named [COURSE]-mcq.pdf for my QuizFlow website. The PDF must contain selectable, extractable text. Do not make it an image or scan. Use a simple single-column layout. Do not put a title, instructions, page numbers, headers, footers, explanations, source citations, markdown formatting, or any other text inside the PDF.

The PDF content must consist only of repeated question blocks in this exact structure and order:

[QUESTION_START]
ID: 1
QUESTION: What does JVM stand for?
OPTION_A: Java Virtual Machine
OPTION_B: Java Visual Manager
OPTION_C: Java Variable Method
OPTION_D: Java Verification Mode
CORRECT_ANSWER: A
[QUESTION_END]

The JVM block above shows the format only. Do not include it in the final PDF unless the attached course PDF actually covers that topic.

Rules for every block:
- Use the marker lines and field names exactly as shown, with uppercase letters and underscores.
- Number IDs consecutively from 1, with no duplicates.
- Include one clear question and exactly four nonempty options, A through D.
- Put the correct answer letter on the CORRECT_ANSWER line: exactly A, B, C, or D. Do not include an explanation or the option text on that line.
- Make exactly one option correct. Avoid ambiguous questions, trick wording, and duplicate options.
- Spread correct answers across A, B, C, and D without forcing an obvious repeating pattern.
- Keep each field label and its value together. Use a readable font and let long question or option text wrap naturally within that field; do not break a field into a new labeled field.
- Leave one blank line between blocks. Keep each full block on one page when possible.
- Do not add any text outside the blocks in the PDF.

Before giving me the file, check the text extracted from the finished PDF. Confirm that every block has both markers, all seven required fields, a unique positive ID, four nonempty options, and a single-letter correct answer. Confirm the final valid question count in your chat reply. If you cannot create an actual downloadable PDF, tell me clearly instead of presenting plain chat text as a PDF.
```

Upload the resulting PDF to QuizFlow and review the preview before saving the exam. The website reports invalid blocks and imports valid ones.
