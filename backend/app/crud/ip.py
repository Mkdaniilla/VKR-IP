from __future__ import annotations
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import select, or_

from app.models.ip import IPObject
from app.schemas.ip import IPCreate, IPUpdate


def create_ip(db: Session, owner_id: int, data: IPCreate) -> IPObject:
    obj = IPObject(
        owner_id=owner_id,
        title=data.title,
        ip_type=data.ip_type,
        classes=data.classes,
        description=data.description,
        status=data.status or "active",
        is_active=True,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_ip(db: Session, owner_id: int, skip: int = 0, limit: int = 20, q: Optional[str] = None) -> List[IPObject]:
    stmt = select(IPObject).where(
        IPObject.owner_id == owner_id,
        IPObject.is_active.is_(True),
    )
    if q:
        stmt = stmt.where(or_(IPObject.title.ilike(f"%{q}%"), IPObject.description.ilike(f"%{q}%")))
    stmt = stmt.order_by(IPObject.created_at.desc()).offset(skip).limit(limit)
    return list(db.execute(stmt).scalars().all())


def count_ip(db: Session, owner_id: int, q: Optional[str] = None) -> int:
    # Для фронта (пагинация) — если нужно, можно добавить отдельный count
    return len(list_ip(db, owner_id, 0, 10_000, q))


def get_ip_for_owner(db: Session, owner_id: int, ip_id: int) -> Optional[IPObject]:
    stmt = select(IPObject).where(
        IPObject.id == ip_id,
        IPObject.owner_id == owner_id,
        IPObject.is_active.is_(True),
    )
    return db.execute(stmt).scalar_one_or_none()


def update_ip(db: Session, obj: IPObject, data: IPUpdate) -> IPObject:
    for field, value in data.dict(exclude_unset=True).items():
        setattr(obj, field, value)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_ip(db: Session, obj: IPObject, hard: bool = False) -> None:
    if hard:
        db.delete(obj)
    else:
        obj.is_active = False
        db.add(obj)
    db.commit()
