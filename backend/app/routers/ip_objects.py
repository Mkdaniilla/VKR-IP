from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional

from app import models
from app.database import get_db
from app.services.security import get_current_user
from app.models.user import User
from app.models.ip_objects import IPObject, IPStatus
from app.schemas import ip_object as ip_schema

router = APIRouter(prefix="/ip_objects", tags=["ip_objects"])


# 🔹 Создать объект
@router.post("/", response_model=ip_schema.IPObjectOut)
def create_ip_object(
    ip_in: ip_schema.IPObjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip_obj = IPObject(**ip_in.dict(), owner_id=current_user.id)
    db.add(ip_obj)
    db.commit()
    db.refresh(ip_obj)
    return ip_obj


# 🔹 Получить список объектов (с фильтром по статусу)
@router.get("/", response_model=List[ip_schema.IPObjectOut])
def list_ip_objects(
    status: Optional[IPStatus] = Query(None, description="Фильтр по статусу (draft, filed, registered, expired)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(IPObject).filter(IPObject.owner_id == current_user.id)
    if status:
        query = query.filter(IPObject.status == status)
    return query.all()


# 🔹 Обновить все поля объекта (title, type, number, registration_date, owner_name)
@router.put("/{ip_id}", response_model=ip_schema.IPObjectOut)
def update_ip_object(
    ip_id: int,
    ip_in: ip_schema.IPObjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(IPObject).filter(
        IPObject.id == ip_id,
        IPObject.owner_id == current_user.id
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Объект не найден")

    update_data = ip_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(obj, field, value)

    db.commit()
    db.refresh(obj)
    return obj


# 🔹 Обновить статус отдельно (PATCH)
@router.patch("/{ip_id}/status", response_model=ip_schema.IPObjectOut)
def update_ip_object_status(
    ip_id: int,
    new_status: ip_schema.IPStatus = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(IPObject).filter(
        IPObject.id == ip_id,
        IPObject.owner_id == current_user.id
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Объект не найден")

    obj.status = new_status
    db.commit()
    db.refresh(obj)
    return obj


# 🔹 Удалить объект
@router.delete("/{ip_id}", status_code=204)
def delete_ip_object(
    ip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(IPObject).filter(
        IPObject.id == ip_id,
        IPObject.owner_id == current_user.id
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Объект не найден")
    db.delete(obj)
    db.commit()
    return {"ok": True}
