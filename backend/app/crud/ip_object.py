from sqlalchemy.orm import Session
from app.models.ip_objects import IPObject as models
from app.schemas.ip_object import IPObjectCreate


def create_ip_object(db: Session, user_id: int, obj: IPObjectCreate):
    db_obj = models.IPObject(title=obj.title, user_id=user_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_ip_objects(db: Session, user_id: int):
    return db.query(models.IPObject).filter(models.IPObject.user_id == user_id).all()


def delete_ip_object(db: Session, user_id: int, ip_id: int):
    obj = db.query(models.IPObject).filter_by(id=ip_id, user_id=user_id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False
