from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.database import SessionLocal
from app.models.deadline import Deadline

router = APIRouter(prefix="/deadlines", tags=["deadlines"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", response_model=dict)
def add_deadline(ip_id: int, due_date: date, kind: str, note: str | None = None, db: Session = Depends(get_db)):
    d = Deadline(ip_id=ip_id, due_date=due_date, kind=kind, note=note)
    db.add(d)
    db.commit()
    db.refresh(d)
    return {"id": d.id}
