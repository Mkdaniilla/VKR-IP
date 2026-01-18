from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app import models
from app.database import get_db
from app.services import security as security_service
from app.core import security
from app.core.settings import settings
from app.schemas import user as user_schema
from app.schemas import auth_schemas

# ✅ NEW: инициализация персональной базы знаний
from app.services.knowledge_init import ensure_default_knowledge_for_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=user_schema.UserOut)
def register(user_in: user_schema.UserCreate, db: Session = Depends(get_db)):
    user = (
        db.query(models.user.User)
        .filter(models.user.User.email == user_in.email)
        .first()
    )
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует",
        )

    hashed_password = security_service.get_password_hash(user_in.password)
    new_user = models.user.User(email=user_in.email, hashed_password=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # ✅ NEW: создаём персональную структуру БЗ (категории + шаблоны статей)
    # Идемпотентно: если вдруг вызовется повторно — дубли не создаст.
    ensure_default_knowledge_for_user(db, new_user.id)

    return new_user


@router.post("/login", response_model=auth_schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = (
        db.query(models.user.User)
        .filter(models.user.User.email == form_data.username)
        .first()
    )
    if not user or not security_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=user_schema.UserOut)
def read_users_me(current_user: models.user.User = Depends(security.get_current_user)):
    return current_user
