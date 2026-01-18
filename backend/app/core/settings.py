from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "IP Registry API"
    API_V1_STR: str = "/api"
    ENV: str = "dev"
    
    # Database
    DATABASE_URL: str = "sqlite:///./dev.db"  # Default to local sqlite for dev
    
    # Security
    SECRET_KEY: str = "change_me_in_prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # CORS
    # (1) Оставляем как 'str', чтобы избежать ошибки JSONDecodeError
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # External APIs
    VALUATION_FONT_PATH: Optional[str] = None
    # (2) Оставляем 'str', чтобы Pydantic его требовал, но даем дефолт для тестов/сборки без ключа
    OPENROUTER_API_KEY: str = ""

    model_config = SettingsConfigDict(
        # Явно говорим Pydantic прочитать .env файл в корне backenda
        env_file=".env",
        case_sensitive=False,
        env_file_encoding='utf-8',
        extra='ignore'
    )


settings = Settings()
