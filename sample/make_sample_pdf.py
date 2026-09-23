"""Create a text-based sample PDF that the upload parser can read."""

from pathlib import Path

import pymupdf as fitz


directory = Path(__file__).resolve().parent
lines = (directory / "sample-mcq.txt").read_text(encoding="utf-8").splitlines()
document = fitz.open()
page = document.new_page()
y = 48
for line in lines:
    if y > page.rect.height - 48:
        page = document.new_page()
        y = 48
    page.insert_text((48, y), line, fontsize=10, fontname="cour")
    y += 17
document.save(directory / "sample-mcq.pdf")
print(directory / "sample-mcq.pdf")
