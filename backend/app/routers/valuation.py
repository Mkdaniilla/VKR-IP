from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import date, timedelta
import os

from app import models
from app.database import get_db
from app.services.security import get_current_user
from app.schemas.valuation import ValuationCreate, ValuationOut, AssessmentPayload
from app.models.ip_objects import IPObject, IPStatus, IPType
from app.models.document import Document
from app.services.ai_client import OpenRouterClient
from app.services.valuation_engine import run_valuation
from app.services.valuation_report import generate_pdf

router = APIRouter(prefix="/valuation", tags=["valuation"])

REPORT_DIR = "storage/valuation_reports"

@router.post("/estimate", response_model=ValuationOut)
async def estimate_and_create(
    payload: ValuationCreate,
    db: Session = Depends(get_db),
    current_user: models.user.User = Depends(get_current_user),
):
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        ai_client = OpenRouterClient()
        results = await run_valuation(ai_client, payload.model_dump())

        # Если уже есть ID объекта, привязываем к нему
        if payload.ip_object_id:
            ip_object = db.query(IPObject).filter(IPObject.id == payload.ip_object_id, IPObject.owner_id == current_user.id).first()
            if not ip_object:
                raise HTTPException(status_code=404, detail="IP объект не найден")
            
            ip_object.estimated_value = results["final_value"]
            title = ip_object.title
        else:
            # Создаём новый черновик
            ip_object = IPObject(
                title=f"Оценка ИС ({payload.ip_type})",
                type=payload.ip_type,
                status=IPStatus.draft,
                owner_id=current_user.id,
                estimated_value=results["final_value"],
            )
            db.add(ip_object)
            db.flush()  # Получаем ID без коммита
            title = ip_object.title

        # Генерация PDF
        filename = f"valuation_{ip_object.id}.pdf"
        pdf_url = generate_pdf(ip_object.id, payload.model_dump(), results, payload.currency, filename)

        ip_object.report_path = pdf_url
        
        # Добавляем или обновляем документ
        doc_title = f"Оценка ИС - {title}.pdf"
        doc = db.query(Document).filter(
            Document.ip_id == ip_object.id,
            Document.filename == doc_title
        ).first()
        
        if not doc:
            doc = Document(
                ip_id=ip_object.id,
                filename=doc_title,
                filepath=filename
            )
            db.add(doc)
        else:
            doc.filename = doc_title
            doc.filepath = filename
            
        db.commit()
        
        logger.info(f"Valuation created for IP object {ip_object.id} by user {current_user.id}")

        return ValuationOut(
            id=ip_object.id,
            baseline_value=float(results["baseline_value"]),
            ai_adjustment=float(results["ai_adjustment"]),
            final_value=float(results["final_value"]),
            currency=payload.currency,
            risk_discount=float(results["risk_discount"]),
            multiples_used=results["multiples_used"],
            pdf_url=pdf_url,
            ip_object=ip_object,
        )
    except ValueError as e:
        # Ошибки валидации
        logger.warning(f"Validation error in valuation: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Откатываем транзакцию при ошибке
        db.rollback()
        logger.error(f"Error creating valuation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка при создании оценки: {str(e)}")

@router.get("/report/{filename}")
def view_report_pdf(
    filename: str,
    db: Session = Depends(get_db),
    current_user: models.user.User = Depends(get_current_user),
):
    # Защита от path traversal атак
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Недопустимое имя файла")
    
    # Проверяем, что файл существует
    file_path = os.path.abspath(os.path.join(REPORT_DIR, filename))
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF не найден")
    
    # Проверяем, что путь действительно находится в REPORT_DIR (дополнительная защита)
    if not file_path.startswith(os.path.abspath(REPORT_DIR)):
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Извлекаем ID объекта из имени файла (формат: valuation_{id}.pdf)
    try:
        ip_object_id = int(filename.replace("valuation_", "").replace(".pdf", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="Недопустимый формат имени файла")
    
    # Проверяем, что пользователь владеет этим объектом
    ip_object = db.query(IPObject).filter(
        IPObject.id == ip_object_id,
        IPObject.owner_id == current_user.id
    ).first()
    
    if not ip_object:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    return FileResponse(file_path, media_type="application/pdf")
