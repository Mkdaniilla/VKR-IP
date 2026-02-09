import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import auth, ip_objects, documents, knowledge, deadlines, counterparties
from app.routers import videos
from app.routers import valuation
from app.core.settings import settings
from app.database import engine, Base
import app.models  # Импортируем модели, чтобы Base их увидел


def create_app() -> FastAPI:
    # root_path="/api" говорит FastAPI, что все ссылки должны начинаться с /api
    app = FastAPI(title="MDM IP API", root_path="/api")

    # --- CORS ---
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Proxy Headers Middleware (для правильных HTTPS редиректов) ---
    from starlette.middleware.trustedhost import TrustedHostMiddleware
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.requests import Request
    
    class ProxyHeadersMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            # Если запрос пришел через HTTPS прокси, обновляем scheme
            if request.headers.get("x-forwarded-proto") == "https":
                request.scope["scheme"] = "https"
            response = await call_next(request)
            return response
    
    app.add_middleware(ProxyHeadersMiddleware)

    # --- Static files (для документов) ---
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # app/
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")         # app/uploads/
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # документы доступны по /uploads/*
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

    # --- Static files (отчёты об оценке ИС) ---
    # storage/valuation_reports лежит на уровне проекта (/app/storage/valuation_reports)
    PROJECT_ROOT = os.path.dirname(BASE_DIR)  # /app
    VALUATION_DIR = os.path.join(PROJECT_ROOT, "storage", "valuation_reports")
    os.makedirs(VALUATION_DIR, exist_ok=True)

    # отчёты доступны по /valuation_reports/*
    app.mount("/valuation_reports", StaticFiles(directory=VALUATION_DIR), name="valuation_reports")

    # --- Routers ---
    app.include_router(documents.router)           # -> /documents/*
    app.include_router(auth.router)                # -> /auth/*
    app.include_router(ip_objects.router)          # -> /ip_objects/*
    app.include_router(knowledge.router)           # -> /knowledge/*
    app.include_router(deadlines.router)           # -> /deadlines/*
    app.include_router(counterparties.router)      # -> /counterparties/*
    app.include_router(videos.router)              # Видео
    app.include_router(valuation.router)           # Оценка ИС

    # --- DB INIT ---
    Base.metadata.create_all(bind=engine)

    # --- System ---
    @app.get("/health")
    def health():
        return {"ok": True}

    @app.get("/")
    def root():
        return {"status": "ok", "message": "Backend API is running"}

    return app


app = create_app()
