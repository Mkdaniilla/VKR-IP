from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import inspect, text
from jose import jwt, JWTError
import os

from app.database import SessionLocal
from app.models.ip_objects import IPObject
from app.models.ip import IPType, IPStatus
from app.models.user import User
from app.models.ip_kind import IPKind
from app.schemas.ip import IPCreate, IPItemOut
from app.schemas.ip_kind import IPKindsGrouped

router = APIRouter(prefix="/ip", tags=["ip"])
oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_change_me")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)) -> User:
    try:
        sub = jwt.get_unverified_claims(token).get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    u = db.get(User, int(sub)) if sub else None
    if not u:
        raise HTTPException(status_code=401, detail="User not found")
    return u


# ---------- Справочник подвидов ИС ----------
@router.get("/kinds", response_model=list[IPKindsGrouped])
def get_ip_kinds(db: Session = Depends(get_db)):
    rows = db.query(IPKind).order_by(IPKind.category, IPKind.title).all()
    groups: dict[str, list[IPKind]] = {}
    for r in rows:
        groups.setdefault(r.category, []).append(r)
    out = []
    for cat, items in groups.items():
        out.append({
            "category": cat,
            "items": [
                {
                    "code": i.code,
                    "category": i.category,
                    "title": i.title,
                    "term": i.term,
                    "registry": i.registry,
                    "notes": i.notes,
                }
                for i in items
            ],
        })
    return out


# ---------- Создание ----------
@router.post("", response_model=dict)
def create_ip(payload: IPCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    obj = IPObject(
        owner_id=user.id,
        type=IPType(payload.type),
        title=payload.title,
        number=payload.number,
        filing_date=payload.filing_date,
        registration_date=payload.registration_date,
        status=IPStatus(payload.status),
        meta=payload.meta,
        kind_code=payload.kind_code,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {"id": obj.id}


# ---------- Список ----------
@router.get("", response_model=list[IPItemOut])
def list_ip(user: User = Depends(current_user), db: Session = Depends(get_db)):
    items = (
        db.query(IPObject)
        .filter(IPObject.owner_id == user.id)
        .order_by(IPObject.id.desc())
        .all()
    )
    kinds = {k.code: k for k in db.query(IPKind).all()}
    res = []
    for i in items:
        k = kinds.get(i.kind_code) if i.kind_code else None
        res.append({
            "id": i.id,
            "type": i.type.value,
            "title": i.title,
            "status": i.status.value,
            "kind_code": i.kind_code,
            "kind_title": (k.title if k else None),
            "kind_term": (k.term if k else None),
            "kind_registry": (k.registry if k else None),
        })
    return res


# ---------- Удаление (три пути совместимости) ----------
def _force_delete_all_children_of_ip(db: Session, ip_id: int):
    engine = db.get_bind()
    insp = inspect(engine)
    target_table = "ip_objects"
    target_col = "id"

    for tbl in insp.get_table_names():
        for fk in insp.get_foreign_keys(tbl):
            ref_table = fk.get("referred_table")
            ref_cols = fk.get("referred_columns") or []
            con_cols = fk.get("constrained_columns") or []
            if (
                ref_table == target_table
                and len(ref_cols) == 1 and ref_cols[0] == target_col
                and len(con_cols) == 1
            ):
                fk_col = con_cols[0]
                db.execute(text(f'DELETE FROM "{tbl}" WHERE "{fk_col}" = :ip_id'), {"ip_id": ip_id})
    db.flush()


def _delete_ip_by_id(ip_id: int, user: User, db: Session) -> None:
    obj = (
        db.query(IPObject)
        .filter(IPObject.id == ip_id, IPObject.owner_id == user.id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="IP object not found")

    # сначала пытаемся обычным каскадом ORM
    for rel_name in ("documents", "monitoring_tasks", "deadlines", "notifications"):
        rel_items = getattr(obj, rel_name, None)
        if rel_items:
            for child in list(rel_items):
                db.delete(child)

    db.delete(obj)
    try:
        db.commit()
        return
    except IntegrityError:
        db.rollback()
        # силовой проход по FKs в БД
        _force_delete_all_children_of_ip(db, ip_id)
        db.delete(obj)
        db.commit()


@router.delete("/{ip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ip_path(
    ip_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    _delete_ip_by_id(ip_id, user, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_ip_query(
    id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    _delete_ip_by_id(id, user, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{ip_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_ip_compat(
    ip_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    _delete_ip_by_id(ip_id, user, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
