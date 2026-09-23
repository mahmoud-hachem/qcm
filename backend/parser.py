import re

import pymupdf as fitz


FIELDS = ("ID", "QUESTION", "OPTION_A", "OPTION_B", "OPTION_C", "OPTION_D", "CORRECT_ANSWER")
START = "[QUESTION_START]"
END = "[QUESTION_END]"


class PDFReadError(ValueError):
    pass


def parse_text(text: str) -> dict:
    questions = []
    errors = []
    seen_ids = set()
    detected = 0
    block = None
    start_line = None

    def finish(lines, line_number, malformed=None):
        nonlocal detected
        detected += 1
        values = {}
        issues = []
        current_field = None
        if malformed:
            issues.append(malformed)
        for line in lines:
            match = re.match(r"^([A-Z_]+)\s*:\s*(.*)$", line)
            if not match:
                if current_field in ("QUESTION", "OPTION_A", "OPTION_B", "OPTION_C", "OPTION_D"):
                    values[current_field] = f"{values[current_field]} {line}".strip()
                else:
                    issues.append(f"Unrecognized line: {line[:70]}")
                continue
            if match.group(1) not in FIELDS:
                issues.append(f"Unrecognized field: {match.group(1)}")
                current_field = None
                continue
            key, value = match.groups()
            if key in values:
                issues.append(f"Duplicate {key} field")
            values[key] = value.strip()
            current_field = key
        for field in FIELDS:
            if not values.get(field):
                issues.append(f"Missing {field}")
        source_id = values.get("ID", "")
        if source_id and (not source_id.isdigit() or int(source_id) < 1):
            issues.append("ID must be a positive whole number")
        elif source_id:
            source_id = str(int(source_id))
        if source_id and source_id in seen_ids:
            issues.append(f"Duplicate question ID {source_id}")
        answer = values.get("CORRECT_ANSWER", "")
        if answer and answer not in ("A", "B", "C", "D"):
            issues.append("CORRECT_ANSWER must be A, B, C, or D")
        if issues:
            errors.append({"block": detected, "source_id": source_id or None, "line": line_number, "messages": issues})
            return
        seen_ids.add(source_id)
        questions.append({
            "source_id": source_id,
            "question_number": len(questions) + 1,
            "question_text": values["QUESTION"],
            "option_a": values["OPTION_A"],
            "option_b": values["OPTION_B"],
            "option_c": values["OPTION_C"],
            "option_d": values["OPTION_D"],
            "correct_answer": answer,
        })

    for number, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line:
            continue
        if line == START:
            if block is not None:
                finish(block, start_line, "Missing [QUESTION_END] before the next question")
            block, start_line = [], number
        elif line == END:
            if block is None:
                errors.append({"block": None, "source_id": None, "line": number, "messages": ["Unexpected [QUESTION_END]"]})
            else:
                finish(block, start_line)
                block = None
        elif block is not None:
            block.append(line)
        else:
            errors.append({"block": None, "source_id": None, "line": number, "messages": [f"Text outside a question block: {line[:70]}"]})
    if block is not None:
        finish(block, start_line, "Missing [QUESTION_END] at the end of the document")
    if not detected and not errors:
        errors.append({"block": None, "source_id": None, "line": None, "messages": ["No question blocks were found. Check the required markers."]})
    return {"detected_count": detected, "valid_count": len(questions), "invalid_count": detected - len(questions), "questions": questions, "errors": errors}


def parse_pdf(contents: bytes) -> dict:
    if not contents.startswith(b"%PDF-"):
        raise PDFReadError("This file is not a PDF. Select a standardized MCQ PDF.")
    try:
        with fitz.open(stream=contents, filetype="pdf") as document:
            if document.needs_pass:
                raise PDFReadError("This PDF is password protected. Upload an unlocked PDF.")
            text = "\n".join(page.get_text(sort=True) for page in document)
    except PDFReadError:
        raise
    except Exception as exc:
        raise PDFReadError("The PDF could not be read. Check that it is not corrupted.") from exc
    return parse_text(text)
