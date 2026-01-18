from sqlalchemy.orm import Session
from app.models.ip_object import IPObject, IPStatus
from app.schemas.ip_object import IPObjectCreate, IPObjectUpdate


def get_ip_objects(db: Session, owner_id: int):
    return db.query(IPObject).filter(IPObject.owner_id == owner_id).all()


def create_ip_object(db: Session, obj: IPObjectCreate, owner_id: int):
    db_obj = IPObject(**obj.dict(), owner_id=owner_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_ip_object(db: Session, ip_id: int, owner_id: int, obj_in: IPObjectUpdate):
    db_obj = (
        db.query(IPObject)
        .filter(IPObject.id == ip_id, IPObject.owner_id == owner_id)
        .first()
    )
    if not db_obj:
        return None

    update_data = obj_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_ip_object(db: Session, ip_id: int, owner_id: int):
    obj = (
        db.query(IPObject)
        .filter(IPObject.id == ip_id, IPObject.owner_id == owner_id)
        .first()
    )
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False


def get_ip_objects_by_status(db: Session, status: IPStatus, owner_id: int):
    return (
        db.query(IPObject)
        .filter(IPObject.owner_id == owner_id, IPObject.status == status)
        .all()
    )
