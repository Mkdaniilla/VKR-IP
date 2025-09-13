import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import PlainTextResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.database import Base, engine
from app.routers import auth, ip as ip_router, docgen, deadlines, ip_objects, monitoring
from app.limiter import limiter  # если не используешь — можешь закомментировать или удалить


def create_app() -> FastAPI:
    app = FastAPI(title="MDM IP API")

    # --- CORS ---
    origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # --- Rate Limiting ---
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return PlainTextResponse("Too Many Requests", status_code=429)

    # --- DB init (dev only, иначе лучше через Alembic) ---
    Base.metadata.create_all(bind=engine)

    # --- Routers ---
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(ip_router.router, prefix="/ip", tags=["ip"])
    app.include_router(docgen.router, prefix="/docgen", tags=["docgen"])
    app.include_router(deadlines.router, prefix="/deadlines", tags=["deadlines"])
    app.include_router(ip_objects.router, prefix="/ip_objects", tags=["ip_objects"])
    app.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])

    # --- System ---
    @app.get("/health")
    def health():
        return {"ok": True}

    @app.get("/")
    def root():
        return {"status": "ok", "message": "Backend API is running"}

    return app


app = create_app()
