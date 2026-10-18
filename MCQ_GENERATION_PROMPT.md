# Reusable Moodle-style mixed exam prompt

Attach your course or chapter PDF in ChatGPT, then copy this prompt. Paste the entire generated question block into QuizFlow's **Add a study exam** box. The importer supports every format below in the same exam, including paragraphs containing both dropdown and typed blanks.

```text
Use the attached course or chapter PDF to create a mixed practice exam that prepares me for my professor's Moodle exam. Use whichever PDF I attach; do not assume any particular subject, chapter, or title.

My professor tests understanding and recognition of technical concepts. They may paraphrase definitions, explain a concept differently, or invent a realistic example or scenario instead of copying the PDF. Their exam mixes ordinary multiple-choice questions, True / False as two-choice MCQs, multiple-choice cloze paragraphs with several dropdown blanks, and fill-in-the-blank paragraphs without choices.

CONTENT REQUIREMENTS
- Read the entire PDF, including its final pages. Cover every important section, concept, definition, distinction, process, and application without repetitive filler. Choose enough questions for thorough but manageable coverage.
- Use all four question types, with substantial emphasis on paragraph cloze questions. As a guide, use roughly 25% MCQ, 15% TRUE_FALSE, 40% CLOZE, and 20% FILL_BLANK. Adjust for the source; include every type when there is enough material.
- Most questions should require understanding, comparison, or application. Paraphrase accurately, use unfamiliar but source-grounded examples, and distinguish nearby technical concepts. Keep the technical terms correct. Do not rely on remembering the PDF's exact sentence wording.
- Write coherent paragraphs containing definitions, explanations, or real-world scenarios. Most paragraph questions should have 2-4 blanks testing DIFFERENT concepts. Include some longer integrated scenarios. Give enough context that each blank has one unambiguous intended concept.
- For ordinary MCQs and dropdown blanks, provide four distinct, plausible choices A-D with exactly one correct answer. Avoid clues from grammar, answer length, other questions, or predictable correct-letter sequences. Each dropdown blank has its OWN choices and answer.
- For True / False, use a precise, unambiguous assertion and exactly A. True and B. False. Explain why, correcting any false assertion. Balance true and false answers.
- For typed blanks, target concise technical terms. List only genuinely equivalent accepted spellings, acronyms, or synonyms, separated by |. Do not accept related but different concepts. Capitalization and extra spaces are ignored by the app; spelling and wording otherwise must match an accepted answer.
- Ground every answer and explanation in the attached PDF. New scenarios may apply taught concepts, but must not introduce unsupported facts.
- Verify the source PDF page for every question. Count the first PDF page as 1, regardless of printed slide numbers. Use PDF page: 7 or PDF pages: 7–8. Do not guess page numbers. If the PDF cannot be read or its pages verified, ask me for a readable source before generating the exam.
- Order the questions by source page, starting with Q1 and numbering consecutively. Mix the types as the material allows.
- Include a short useful Explanation: after EVERY question, covering the reasoning for all its blanks when applicable.

STRICT COPY/PASTE FORMAT
Return ALL questions as plain text inside ONE code block. Output no title, introduction, answer-key section, or commentary outside it. Do not create a PDF, table, JSON, or Moodle GIFT/XML export. Leave one empty line between questions. Do not use trailing backslashes or Markdown lists. Use these exact labels and type names.

Every question starts Q<number>. <question or paragraph>, then Type:, then PDF page: (or PDF pages:). Each question ends with Explanation:. Question text and explanations may wrap across lines, but do not put metadata or choice blocks inside the paragraph.

For CLOZE and FILL_BLANK paragraphs, insert literal numbered placeholders [[1]], [[2]], etc. in the paragraph. Restart blank numbering at 1 for each question. Each placeholder must occur once and have one matching Blank block. Never use unnamed underscores or put the answer inside a placeholder.

FORMAT 1 — ordinary multiple choice:
Q1. <paraphrased question or scenario>
Type: MCQ
PDF page: <verified page number>
A. <choice>
B. <choice>
C. <choice>
D. <choice>
Correct answer: <A, B, C, or D>
Explanation: <reasoning>

FORMAT 2 — True / False as MCQ:
Q2. <statement to judge>
Type: TRUE_FALSE
PDF page: <verified page number>
A. True
B. False
Correct answer: <A or B>
Explanation: <why the statement is true or false; correct it if false>

FORMAT 3 — paragraph with multiple dropdown blanks:
Q3. <coherent paragraph with [[1]] and [[2]] testing different concepts>
Type: CLOZE
PDF pages: <first verified page>–<last verified page>
Blank 1: MCQ
A. <choice for blank 1>
B. <choice for blank 1>
C. <choice for blank 1>
D. <choice for blank 1>
Correct answer: <A, B, C, or D>
Blank 2: MCQ
A. <choice for blank 2>
B. <choice for blank 2>
C. <choice for blank 2>
D. <choice for blank 2>
Correct answer: <A, B, C, or D>
Explanation: <explain both answers and how the concepts differ>

FORMAT 4 — paragraph with typed blanks and NO choices:
Q4. <coherent paragraph with [[1]] and [[2]] identifying technical concepts>
Type: FILL_BLANK
PDF page: <verified page number>
Blank 1: TEXT
Accepted answers: <canonical term> | <equivalent accepted variant, only if valid>
Blank 2: TEXT
Accepted answers: <canonical term>
Explanation: <explain every blank>

You may also mix dropdown and typed blanks within a Type: CLOZE paragraph. Use Blank n: MCQ with its A-D options and Correct answer: for a dropdown, or Blank n: TEXT with Accepted answers: for a typed blank. Type: FILL_BLANK must contain only TEXT blanks. Put Explanation: once at the end, after ALL Blank blocks.

Replace every example placeholder above with real content. Use only answer LETTERS in Correct answer: and answer TEXT in Accepted answers:. Do not put choices A-D at question level for CLOZE or FILL_BLANK. Include no question titles between blocks. Never omit a block because it has a different type.

Before replying, verify complete coverage including the final pages, source-page accuracy, consistent numbering, all four question types, matching paragraph placeholders and blank definitions, exactly one correct choice for each MCQ/dropdown, meaningful typed-answer variants, and an explanation for each question. Output only the single complete copyable code block.
```
