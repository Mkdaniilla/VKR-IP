from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from pydantic import BaseModel

from app.database import SessionLocal
from app.models.deadline import Deadline

router = APIRouter(prefix="/deadlines", tags=["deadlines"])


# ===== Dependency =====
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ===== Schemas =====
class DeadlineCreate(BaseModel):
    ip_id: int
    due_date: date
    kind: str
    note: str | None = None


class DeadlineOut(BaseModel):
    id: int
    ip_id: int
    due_date: date
    kind: str
    note: str | None = None
    notified: bool

    class Config:
        from_attributes = True


class DeadlineCreated(BaseModel):
    id: int


# ===== Routes =====

# Создать дедлайн
@router.post("", response_model=DeadlineCreated)
def add_deadline(payload: DeadlineCreate, db: Session = Depends(get_db)):
    d = Deadline(
        ip_id=payload.ip_id,
        due_date=payload.due_date,
        kind=payload.kind,
        note=payload.note,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return {"id": d.id}


# Получить все дедлайны
@router.get("", response_model=list[DeadlineOut])
def get_deadlines(db: Session = Depends(get_db)):
    return db.query(Deadline).all()


# Получить дедлайны на ближайшие N дней (включая просроченные)
@router.get("/upcoming/{days}", response_model=list[DeadlineOut])
def get_upcoming_deadlines(days: int, db: Session = Depends(get_db)):
    today = date.today()
    end_date = today + timedelta(days=days)
    return (
        db.query(Deadline)
        .filter(Deadline.due_date <= end_date)
        .order_by(Deadline.due_date.asc())
        .all()
    )


# Удалить дедлайн
@router.delete("/{deadline_id}")
def delete_deadline(deadline_id: int, db: Session = Depends(get_db)):
    d = db.query(Deadline).get(deadline_id)
    if not d:
        raise HTTPException(status_code=404, detail="Deadline not found")
    db.delete(d)
    db.commit()
    return {"ok": True}


# Обновить дедлайн
class DeadlineUpdate(BaseModel):
    due_date: date | None = None
    kind: str | None = None
    note: str | None = None
    notified: bool | None = None


@router.put("/{deadline_id}", response_model=DeadlineOut)
def update_deadline(deadline_id: int, payload: DeadlineUpdate, db: Session = Depends(get_db)):
    d = db.query(Deadline).get(deadline_id)
    if not d:
        raise HTTPException(status_code=404, detail="Deadline not found")

    if payload.due_date is not None:
        d.due_date = payload.due_date
    if payload.kind is not None:
        d.kind = payload.kind
    if payload.note is not None:
        d.note = payload.note
    if payload.notified is not None:
        d.notified = payload.notified

    db.commit()
    db.refresh(d)
    return d
