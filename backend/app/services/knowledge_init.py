from __future__ import annotations

from sqlalchemy.orm import Session

from app import models

# Базовые категории (пустые, но уже дают структуру)
DEFAULT_CATEGORIES = [
    "Товарные знаки",
    "Патенты",
    "Авторское право",
    "ПО и базы данных",
    "Лицензии и договоры",
    "Претензии и защита",
    "Суд и доказательства",
    "Маркетплейсы и контент",
    "Due diligence ИС",
    "Типовые сценарии",
]

# Шаблон статьи (структурированный юридический сценарий)
ARTICLE_TEMPLATE = """## 1. Цель
(что решает эта инструкция)

## 2. Когда применять
(в каких ситуациях)

## 3. Входные данные
- ...

## 4. Чек-лист действий
- [ ] Шаг 1
- [ ] Шаг 2
- [ ] Шаг 3

## 5. Документы / артефакты
- ...

## 6. Риски и типовые ошибки
- ...

## 7. Нормативная база / ссылки
- ...

## 8. Комментарии и заметки
- ...
"""

# Минимальный набор статей-заготовок
DEFAULT_ARTICLES = [
    ("Товарные знаки", "Чек-лист: регистрация товарного знака"),
    ("Претензии и защита", "Сценарий: пришла претензия — что делать"),
    ("ПО и базы данных", "Инструкция: оформление прав на ПО"),
    ("Авторское право", "Чек-лист: фиксация авторских прав"),
    ("Маркетплейсы и контент", "Сценарий: клон карточки на маркетплейсе"),
]


def ensure_default_knowledge_for_user(db: Session, user_id: int) -> None:
    """
    Создаёт дефолтные категории и статьи для пользователя, если у него ещё нет БЗ.
    Идемпотентно: повторный запуск не ломает и не дублирует.
    """
    has_any = (
        db.query(models.KnowledgeCategory)
        .filter(models.KnowledgeCategory.user_id == user_id)
        .first()
    )
    if has_any:
        return

    # 1) категории
    title_to_cat = {}
    for title in DEFAULT_CATEGORIES:
        cat = models.KnowledgeCategory(user_id=user_id, title=title)
        db.add(cat)
        db.flush()  # получаем cat.id
        title_to_cat[title] = cat

    # 2) статьи
    for cat_title, article_title in DEFAULT_ARTICLES:
        cat = title_to_cat.get(cat_title)
        if not cat:
            continue
        art = models.KnowledgeArticle(
            user_id=user_id,
            category_id=cat.id,
            title=article_title,
            content=ARTICLE_TEMPLATE,
        )
        db.add(art)

    db.commit()
