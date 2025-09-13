from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.ip_object import IPObjectCreate, IPObject
from app.crud import ip_object as crud
from app.dependencies import get_db, get_current_user
from app.models.user import User
from typing import List

router = APIRouter(prefix="/ip", tags=["IP объекты"])


@router.post("/", response_model=IPObject)
def create_ip_object(
    obj: IPObjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.create_ip_object(db, user_id=current_user.id, obj=obj)


@router.get("/", response_model=List[IPObject])
def list_ip_objects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.get_ip_objects(db, user_id=current_user.id)


@router.delete("/{ip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ip_object(
    ip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = crud.delete_ip_object(db, user_id=current_user.id, ip_id=ip_id)
    if not success:
        raise HTTPException(status_code=404, detail="Объект не найден")
