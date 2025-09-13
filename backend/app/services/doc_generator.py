from docxtpl import DocxTemplate
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from pathlib import Path
from typing import Dict

BASE = Path(__file__).resolve().parents[1]  # /app/app
OUT = BASE / "generated"
OUT.mkdir(exist_ok=True)

def render_docx(template_path: str, context: Dict, filename: str) -> str:
    tpl = DocxTemplate(str(BASE / "templates" / template_path))
    tpl.render(context)
    dst = OUT / f"{filename}.docx"
    tpl.save(str(dst))
    return str(dst)

def render_pdf_from_text(text: str, filename: str) -> str:
    dst = OUT / f"{filename}.pdf"
    c = canvas.Canvas(str(dst), pagesize=A4)
    width, height = A4
    y = height - 72
    for line in text.splitlines():
        c.drawString(72, y, line)
        y -= 18
        if y < 72:
            c.showPage()
            y = height - 72
    c.save()
    return str(dst)
