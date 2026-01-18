from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
import os

from app.services.security import get_current_user  # твоя функция проверки JWT

router = APIRouter(prefix="/videos", tags=["Videos"])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(os.path.dirname(BASE_DIR), "uploads", "videos")


@router.get("/{filename}")
def get_video(filename: str, user=Depends(get_current_user)):
    """
    Доступ к видео только для авторизованных пользователей
    """
    filepath = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Видео не найдено")

    return FileResponse(filepath, media_type="video/mp4")
