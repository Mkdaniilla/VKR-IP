from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from app.database import SessionLocal
from app.models.ip_objects import IPObject  # ✅ Верно
from app.models.document import Document
from app.services.doc_generator import render_docx, render_pdf_from_text

router = APIRouter(prefix="/docgen", tags=["documents"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/pretension/{ip_id}", response_model=dict)
def gen_pretension(ip_id: int, db: Session = Depends(get_db)):
    ip = db.get(IPObject, ip_id)
    if not ip:
        raise HTTPException(404, "IP object not found")
    ctx = {
        "title": ip.title,
        "number": ip.number or "—",
        "today": date.today().strftime("%d.%m.%Y"),
        "owner_id": ip.owner_id,
    }
    docx_path = render_docx("claims/pretension.docx", ctx, filename=f"pretension_{ip_id}")
    pdf_path = render_pdf_from_text(f"Претензия по объекту: {ip.title}\nНомер: {ip.number or '—'}",
                                    filename=f"pretension_{ip_id}")
    db.add(Document(ip_id=ip_id, name="Претензия", path=docx_path))
    db.commit()
    return {"docx": docx_path, "pdf": pdf_path}
