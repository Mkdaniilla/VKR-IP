import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.document import Document
from app.models.ip_objects import IPObject
from app.models.counterparty import Counterparty
from app.models.user import User
from app.services.security import get_current_user
from app.schemas.document import DocumentOut
from app.services.document_service import render_document
from app.services.legal_ai import get_legal_customization

# Абсолютный путь к папке app/uploads/documents
BASE_DIR = Path(__file__).resolve().parent.parent     # app/
UPLOAD_DIR = BASE_DIR / "uploads" / "documents"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

TEMPLATES_DIR = BASE_DIR / "templates"  # где лежат *.docx.jinja

router = APIRouter(prefix="/documents", tags=["documents"])


# ==========================
# 📌 1. Загрузка документа
# ==========================
@router.post("/", response_model=DocumentOut)
async def upload_document(
    ip_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip_obj = db.query(IPObject).filter_by(id=ip_id, owner_id=current_user.id).first()
    if not ip_obj:
        raise HTTPException(status_code=404, detail="IP object not found")

    save_path = UPLOAD_DIR / file.filename
    with open(save_path, "wb") as f:
        f.write(await file.read())

    relative_path = f"documents/{file.filename}"

    doc = Document(ip_id=ip_id, filename=file.filename, filepath=relative_path)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# ==========================
# 📌 2. Список документов
# ==========================
@router.get("/", response_model=List[DocumentOut])
def list_documents(
    ip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = (
        db.query(Document)
        .join(IPObject)
        .filter(IPObject.owner_id == current_user.id, Document.ip_id == ip_id)
        .all()
    )
    return docs


# ==========================
# 📌 3. Удаление документа
# ==========================
@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = (
        db.query(Document)
        .join(IPObject)
        .filter(Document.id == doc_id, IPObject.owner_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = BASE_DIR / "uploads" / doc.filepath
    if file_path.exists():
        file_path.unlink()

    db.delete(doc)
    db.commit()
    return {"detail": "Document deleted"}


# ==========================
# 📌 4. Защищенный просмотр документа
# ==========================
@router.get("/auth-view/{doc_id}")
def view_document_protected(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = (
        db.query(Document)
        .join(IPObject)
        .filter(Document.id == doc_id, IPObject.owner_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Если это отчет об оценке (лежит в storage/valuation_reports)
    if doc.filepath.startswith("valuation_"):
        file_path = BASE_DIR.parent / "storage" / "valuation_reports" / doc.filepath
    else:
        # Обычный документ (лежит в app/uploads/)
        file_path = BASE_DIR / "uploads" / doc.filepath

    import logging
    logger = logging.getLogger(__name__)

    if not file_path.exists():
        logger.error(f"File not found on disk: {file_path}")
        raise HTTPException(status_code=404, detail=f"File not found: {doc.filename}")

    logger.info(f"Serving file: {file_path} (ID: {doc_id})")
    # Возвращаем FileResponse без filename, чтобы работал inline (для PDF)
    # Браузер сам решит, открывать или скачивать на основе MIME-типа
    return FileResponse(file_path)


# ==========================
# 📌 5. Генерация документа из шаблона
# ==========================
@router.get("/generate/{template}/{ip_id}")
async def generate_document(
    template: str,
    ip_id: int,
    counterparty_id: int = Query(..., description="ID контрагента"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Проверяем, что объект существует и принадлежит пользователю
    ip_object = (
        db.query(IPObject)
        .filter(IPObject.id == ip_id, IPObject.owner_id == current_user.id)
        .first()
    )
    if not ip_object:
        raise HTTPException(status_code=404, detail="IP object not found")

    # 2. Проверяем контрагента
    counterparty = (
        db.query(Counterparty)
        .filter(Counterparty.id == counterparty_id, Counterparty.owner_id == current_user.id)
        .first()
    )
    if not counterparty:
        raise HTTPException(status_code=404, detail="Counterparty not found")

    # 3. Проверяем наличие шаблона и маппинг устаревших названий
    # Map legacy template names from older frontend versions to the actual template files.
    # New templates are used directly without mapping.
    template_map = {
        "contract": "license",  # старый фронтенд может слать 'contract'
        "dogovor": "license",
        "claim": "pretension",
        # новые типы документов
        "nda": "nda",
        "assignment": "assignment",
        "license": "license",
        "isk": "isk",
        "pretension": "pretension",
        "franchise": "franchise",
        "pledge": "pledge",
        "notice": "notice",
    }
    real_template = template_map.get(template, template)
    
    template_file = TEMPLATES_DIR / f"{real_template}.docx.jinja"
    if not template_file.exists():
        raise HTTPException(status_code=404, detail=f"Template '{template}' (mapped to '{real_template}') not found")
    # 4. Получаем интеллектуальную юридическую добавку от ИИ
    ai_content_raw = await get_legal_customization(
        template=real_template,
        ip_title=ip_object.title,
        counterparty_name=counterparty.name,
        owner_name=current_user.email
    )

    # 5. Ensure all required keys exist with fallback values for each template type
    ai_content = {
        # Common fallbacks
        "main_text": ai_content_raw.get("main_text", "Детали будут уточнены позднее."),
        
        # NDA keys
        "subject": ai_content_raw.get("subject", "Предмет соглашения: защита конфиденциальной информации."),
        "confidential_info": ai_content_raw.get("confidential_info", "Любая информация, относящаяся к объекту интеллектуальной собственности."),
        "obligations": ai_content_raw.get("obligations", "Стороны обязуются не разглашать конфиденциальную информацию третьим лицам."),
        
        # Assignment keys
        "consideration": ai_content_raw.get("consideration", "Вознаграждение определяется отдельным соглашением."),
        "warranties": ai_content_raw.get("warranties", "Правообладатель гарантирует отсутствие обременений."),
        
        # License keys
        "scope": ai_content_raw.get("scope", "Воспроизведение, распространение, публичный показ."),
        "territory": ai_content_raw.get("territory", "Территория Российской Федерации."),
        "term": ai_content_raw.get("term", "Срок действия лицензии: 1 год с момента подписания."),
        
        # Pretension keys
        "infringement_desc": ai_content_raw.get("infringement_desc", "Нарушение исключительных прав путём несанкционированного использования."),
        "legal_ground": ai_content_raw.get("legal_ground", "Статьи 1229, 1252 ГК РФ."),
        "demands": ai_content_raw.get("demands", "Требую прекратить нарушение и выплатить компенсацию."),
        
        # ISK (lawsuit) keys
        "claims": ai_content_raw.get("claims", "Прошу суд запретить использование объекта ИС и взыскать компенсацию."),
        "facts": ai_content_raw.get("facts", "Ответчик использует объект ИС без разрешения правообладателя."),
        "justification": ai_content_raw.get("justification", "Согласно ст. 1252 ГК РФ, правообладатель вправе требовать защиты своих прав."),
        
        # Pledge keys
        "secured_obligation": ai_content_raw.get("secured_obligation", "Обеспечиваемое обязательство определяется отдельным соглашением."),
        "valuation": ai_content_raw.get("valuation", "Оценка предмета залога производится по соглашению сторон."),
        "pledgor_obligations": ai_content_raw.get("pledgor_obligations", "Залогодатель обязуется сохранять предмет залога в надлежащем состоянии."),
    }

    # 6. Контекст для шаблона
    context = {
        "ip_object": {
            "title": ip_object.title,
            "number": getattr(ip_object, "number", None) or "—",
            "registration_date": ip_object.registration_date.strftime("%Y-%m-%d")
            if ip_object.registration_date
            else "—",
        },
        "owner_name": current_user.email,
        "counterparty": {
            "name": counterparty.name,
            "contact_person": counterparty.contact_person or "—",
            "email": counterparty.email or "—",
            "phone": counterparty.phone or "—",
            "address": counterparty.address or "—",
        },
        "ai_content": ai_content,
        "is_exclusive": True,  # Дефолт для лицензии
    }

    # 6. Генерация документа в памяти
    buffer = render_document(f"{real_template}.docx.jinja", context)

    # 6. Сохраняем файл на диск
    filename = f"{real_template}_{uuid.uuid4().hex}.docx"
    save_path = UPLOAD_DIR / filename
    with open(save_path, "wb") as f:
        f.write(buffer.getvalue())

    relative_path = f"documents/{filename}"

    # 7. Сохраняем запись в БД
    doc = Document(
        ip_id=ip_object.id,
        filename=filename,
        filepath=relative_path,
        counterparty_id=counterparty.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 8. Отдаём пользователю скачивание
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


