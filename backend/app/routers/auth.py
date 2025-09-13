# app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from json import JSONDecodeError

from app.database import SessionLocal
from app.models.user import User
from app.schemas.auth import RegisterIn, TokenOut
from app.services.security import hash_password, verify_password, create_access_token

router = APIRouter(tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=TokenOut)
def register(data: RegisterIn, db: Session = Depends(get_db)) -> TokenOut:
    email_norm = data.email.strip().lower()
    if db.query(User).filter(User.email == email_norm).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    u = User(email=email_norm, hashed_password=hash_password(data.password))
    db.add(u)
    db.commit()
    db.refresh(u)
    token = create_access_token(str(u.id))
    return TokenOut(access_token=token)

@router.post("/login", response_model=TokenOut)
async def login(request: Request, db: Session = Depends(get_db)) -> TokenOut:
    """
    Универсальный логин по одному пути:
    - принимает JSON ИЛИ form-data/x-www-form-urlencoded;
    - поддерживает поля 'email' ИЛИ 'username';
    - пароль из 'password'/'pwd'/'pass'.
    """
    ctype = (request.headers.get("content-type") or "").lower()
    login_value = None
    password = None

    # Аккуратно различаем контенты и корректно обрабатываем пустое/битое тело
    if "application/json" in ctype or ctype == "":
        try:
            data = await request.json()
        except JSONDecodeError:
            # Пытаемся быть дружелюбными: пустое тело или не-JSON при отсутствии Content-Type
            data = {}
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
        login_value = (str(data.get("email") or data.get("username") or "")).strip().lower()
        password = (str(data.get("password") or data.get("pwd") or data.get("pass") or "")).strip()
    elif "application/x-www-form-urlencoded" in ctype or "multipart/form-data" in ctype:
        try:
            form = await request.form()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid form body")
        login_value = (str(form.get("email") or form.get("username") or "")).strip().lower()
        password = (str(form.get("password") or form.get("pwd") or form.get("pass") or "")).strip()
    else:
        raise HTTPException(status_code=415, detail="Unsupported Content-Type")

    if not login_value or not password:
        raise HTTPException(status_code=400, detail="Email/username and password are required")

    # Формируем условия поиска: по email и (если есть колонка) по username
    filters = [User.email == login_value]
    if hasattr(User, "username"):
        # username может храниться в произвольном регистре — при необходимости добавьте .ilike
        filters.append(getattr(User, "username") == login_value)

    u = db.query(User).filter(or_(*filters)).first()
    if not u or not verify_password(password, u.hashed_password):
        # 401 — только для неверных учётных данных
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(str(u.id))
    return TokenOut(access_token=token)
