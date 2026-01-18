from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app import models
from app.schemas import knowledge as schemas
from app.services.security import get_current_user
from app.models.user import User

# ✅ NEW: инициализация шаблонов БЗ
from app.services.knowledge_init import ensure_default_knowledge_for_user, ARTICLE_TEMPLATE
from app.services.ai_client import OpenRouterClient

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])


# --- Init (for existing users) ---
@router.post("/init")
def init_my_knowledge(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Создаёт дефолтные категории и шаблонные статьи, если у пользователя БЗ ещё пуста.
    Идемпотентно: повторный вызов не создаст дубли.
    """
    ensure_default_knowledge_for_user(db, current_user.id)
    return {"detail": "Knowledge base initialized"}


@router.get("/template")
def get_article_template():
    """Возвращает шаблон структуры статьи."""
    return {"template": ARTICLE_TEMPLATE}


@router.post("/ask", response_model=schemas.ChatResponse)
async def ask_knowledge_base(
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    ИИ-агент: отвечает на вопрос пользователя, используя только статьи из его БЗ.
    """
    # 1. Получаем все статьи пользователя
    articles = (
        db.query(models.KnowledgeArticle)
        .filter(models.KnowledgeArticle.user_id == current_user.id)
        .all()
    )

    if not articles:
        return {
            "answer": "У вас пока нет статей в базе знаний. Я не могу ответить на вопрос.",
            "sources": []
        }

    # 2. Формируем контекст из статей
    context_parts = []
    sources = []
    for art in articles:
        context_parts.append(f"СТАТЬЯ: {art.title}\nID: {art.id}\nСОДЕРЖАНИЕ:\n{art.content}\n---")
        sources.append({"id": art.id, "title": art.title})

    context_text = "\n".join(context_parts)

    # 3. Формируем промпт
    prompt = f"""
Ты — профессиональный юридический ИИ-ассистент. Твоя задача — отвечать на вопросы пользователя, используя ТОЛЬКО предоставленную базу знаний.

БАЗА ЗНАНИЙ ПОЛЬЗОВАТЕЛЯ:
{context_text}

ПРАВИЛА:
1. Отвечай только на основе текстов выше.
2. Если в базе знаний нет ответа на вопрос, вежливо скажи, что информации недостаточно.
3. В конце ответа ОБЯЗАТЕЛЬНО укажи ID статей, которые ты использовал (например: "Источник: Статья #12").
4. Твой ответ должен быть структурированным JSON в формате:
{{
  "answer": "текст твоего ответа...",
  "sources_used": [id1, id2, ...]
}}

ВОПРОС ПОЛЬЗОВАТЕЛЯ: {payload.question}
"""

    # 4. Вызываем ИИ
    ai = OpenRouterClient()
    try:
        # ai.complete возвращает распарсенный JSON (см. ai_client.py)
        ai_data = await ai.complete(prompt)
        
        # Фильтруем источники, которые реально использованы
        used_ids = ai_data.get("sources_used", [])
        final_sources = [s for s in sources if s["id"] in used_ids]

        return {
            "answer": ai_data.get("answer", "Не удалось сформировать ответ."),
            "sources": final_sources
        }
    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка ИИ-агента: {str(e)}")


# --- Categories ---
@router.post("/categories", response_model=schemas.KnowledgeCategoryOut)
def create_category(
    payload: schemas.KnowledgeCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exists = (
        db.query(models.KnowledgeCategory)
        .filter(models.KnowledgeCategory.user_id == current_user.id)
        .filter(models.KnowledgeCategory.title == payload.title)
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="Category already exists")

    category = models.KnowledgeCategory(user_id=current_user.id, **payload.dict())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/categories", response_model=list[schemas.KnowledgeCategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(models.KnowledgeCategory)
        .filter(models.KnowledgeCategory.user_id == current_user.id)
        .order_by(models.KnowledgeCategory.id.asc())
        .all()
    )


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = (
        db.query(models.KnowledgeCategory)
        .filter(models.KnowledgeCategory.id == category_id)
        .filter(models.KnowledgeCategory.user_id == current_user.id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # благодаря ondelete="CASCADE" и relationship cascade статьи удалятся тоже
    db.delete(category)
    db.commit()
    return {"detail": "Category deleted"}


# --- Articles ---
@router.post("/articles", response_model=schemas.KnowledgeArticleOut)
def create_article(
    payload: schemas.KnowledgeArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = (
        db.query(models.KnowledgeCategory)
        .filter(models.KnowledgeCategory.id == payload.category_id)
        .filter(models.KnowledgeCategory.user_id == current_user.id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    exists = (
        db.query(models.KnowledgeArticle)
        .filter(models.KnowledgeArticle.user_id == current_user.id)
        .filter(models.KnowledgeArticle.title == payload.title)
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="Article already exists")

    article = models.KnowledgeArticle(user_id=current_user.id, **payload.dict())
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.get("/articles", response_model=list[schemas.KnowledgeArticleOut])
def list_articles(
    category_id: int | None = Query(default=None),
    q: str | None = Query(default=None, description="Search in title/content"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(models.KnowledgeArticle)
        .filter(models.KnowledgeArticle.user_id == current_user.id)
    )

    if category_id is not None:
        # дополнительная проверка владения категорией (чтобы не подсунули чужую id)
        cat = (
            db.query(models.KnowledgeCategory)
            .filter(models.KnowledgeCategory.id == category_id)
            .filter(models.KnowledgeCategory.user_id == current_user.id)
            .first()
        )
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        query = query.filter(models.KnowledgeArticle.category_id == category_id)

    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                models.KnowledgeArticle.title.ilike(like),
                models.KnowledgeArticle.content.ilike(like),
            )
        )

    return query.order_by(models.KnowledgeArticle.id.desc()).all()


@router.get("/articles/{article_id}", response_model=schemas.KnowledgeArticleOut)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = (
        db.query(models.KnowledgeArticle)
        .filter(models.KnowledgeArticle.id == article_id)
        .filter(models.KnowledgeArticle.user_id == current_user.id)
        .first()
    )
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.put("/articles/{article_id}", response_model=schemas.KnowledgeArticleOut)
def update_article(
    article_id: int,
    payload: schemas.KnowledgeArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = (
        db.query(models.KnowledgeArticle)
        .filter(models.KnowledgeArticle.id == article_id)
        .filter(models.KnowledgeArticle.user_id == current_user.id)
        .first()
    )
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # если меняем категорию — проверяем, что новая категория принадлежит пользователю
    if payload.category_id is not None:
        category = (
            db.query(models.KnowledgeCategory)
            .filter(models.KnowledgeCategory.id == payload.category_id)
            .filter(models.KnowledgeCategory.user_id == current_user.id)
            .first()
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(article, key, value)

    db.commit()
    db.refresh(article)
    return article


@router.delete("/articles/{article_id}")
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = (
        db.query(models.KnowledgeArticle)
        .filter(models.KnowledgeArticle.id == article_id)
        .filter(models.KnowledgeArticle.user_id == current_user.id)
        .first()
    )
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    db.delete(article)
    db.commit()
    return {"detail": "Article deleted"}
