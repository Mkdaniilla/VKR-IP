from sqlalchemy.orm import Session
from app.models.counterparty import Counterparty
from app.schemas import counterparty as schema


def get_counterparties(db: Session, owner_id: int):
    return db.query(Counterparty).filter(Counterparty.owner_id == owner_id).all()


def get_counterparty(db: Session, counterparty_id: int, owner_id: int):
    return (
        db.query(Counterparty)
        .filter(Counterparty.id == counterparty_id, Counterparty.owner_id == owner_id)
        .first()
    )


def create_counterparty(db: Session, obj_in: schema.CounterpartyCreate, owner_id: int):
    db_obj = Counterparty(**obj_in.dict(), owner_id=owner_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_counterparty(db: Session, db_obj: Counterparty, obj_in: schema.CounterpartyUpdate):
    obj_data = obj_in.dict(exclude_unset=True)
    for field, value in obj_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_counterparty(db: Session, db_obj: Counterparty):
    db.delete(db_obj)
    db.commit()
