from sqlalchemy.orm import Session
from datetime import date, timedelta

from app.models.deadline import Deadline
from app.schemas.deadline import DeadlineCreate, DeadlineUpdate

def create_deadline(db: Session, deadline: DeadlineCreate):
    db_item = Deadline(**deadline.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_deadlines(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Deadline).offset(skip).limit(limit).all()

def get_deadline(db: Session, deadline_id: int):
    return db.query(Deadline).filter(Deadline.id == deadline_id).first()

def update_deadline(db: Session, deadline_id: int, deadline: DeadlineUpdate):
    db_item = get_deadline(db, deadline_id)
    if not db_item:
        return None
    for key, value in deadline.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_deadline(db: Session, deadline_id: int):
    db_item = get_deadline(db, deadline_id)
    if not db_item:
        return None
    db.delete(db_item)
    db.commit()
    return db_item

def get_upcoming_deadlines(db: Session, days: int = 30):
    today = date.today()
    target_date = today + timedelta(days=days)
    return (
        db.query(Deadline)
        .filter(Deadline.due_date >= today, Deadline.due_date <= target_date)
        .all()
    )
