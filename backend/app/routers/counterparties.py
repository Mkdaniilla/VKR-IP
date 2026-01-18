from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.counterparty import Counterparty
from app.models.user import User
from app.services.security import get_current_user
from app.schemas.counterparty import CounterpartyOut, CounterpartyCreate, CounterpartyUpdate

router = APIRouter(prefix="/counterparties", tags=["counterparties"])


# 📌 Получить список контрагентов
@router.get("/", response_model=List[CounterpartyOut])
def list_counterparties(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Counterparty).filter(Counterparty.owner_id == current_user.id).all()


# 📌 Создать нового контрагента
@router.post("/", response_model=CounterpartyOut)
def create_counterparty(
    data: CounterpartyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    counterparty = Counterparty(**data.dict(), owner_id=current_user.id)
    db.add(counterparty)
    db.commit()
    db.refresh(counterparty)
    return counterparty


# 📌 Обновить контрагента
@router.put("/{counterparty_id}", response_model=CounterpartyOut)
def update_counterparty(
    counterparty_id: int,
    data: CounterpartyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    counterparty = (
        db.query(Counterparty)
        .filter(Counterparty.id == counterparty_id, Counterparty.owner_id == current_user.id)
        .first()
    )
    if not counterparty:
        raise HTTPException(status_code=404, detail="Counterparty not found")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(counterparty, field, value)

    db.commit()
    db.refresh(counterparty)
    return counterparty


# 📌 Удалить контрагента
@router.delete("/{counterparty_id}")
def delete_counterparty(
    counterparty_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    counterparty = (
        db.query(Counterparty)
        .filter(Counterparty.id == counterparty_id, Counterparty.owner_id == current_user.id)
        .first()
    )
    if not counterparty:
        raise HTTPException(status_code=404, detail="Counterparty not found")

    db.delete(counterparty)
    db.commit()
    return {"detail": "Counterparty deleted"}
