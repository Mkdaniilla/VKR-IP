"""
Локальный AI-агент для базы знаний по интеллектуальной собственности.
Работает без внешних API, использует rule-based подход.
"""
import re
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeArticle

logger = logging.getLogger(__name__)


class LocalAIAgent:
    """Локальный AI-агент на основе правил и поиска"""
    
    # Ключевые слова для категорий ИС
    KEYWORDS = {
        "товарный знак": ["товарный знак", "тз", "trademark", "бренд", "логотип", "название", "регистрация знака"],
        "патент": ["патент", "изобретение", "полезная модель", "промышленный образец", "patent"],
        "авторское право": ["авторское право", "copyright", "произведение", "автор", "лицензия"],
        "коммерческая тайна": ["коммерческая тайна", "ноу-хау", "конфиденциальность", "секрет"],
        "договор": ["договор", "лицензия", "соглашение", "контракт", "сделка"],
        "нарушение": ["нарушение", "контрафакт", "подделка", "копия", "плагиат", "защита"],
        "оценка": ["оценка", "стоимость", "цена", "расчет", "валюация"],
    }
    
    # Шаблоны ответов
    TEMPLATES = {
        "greeting": "Здравствуйте! Я помогу вам найти информацию по вопросам интеллектуальной собственности.",
        "found_articles": "Я нашел {count} релевантных материалов по вашему запросу:",
        "no_results": "К сожалению, я не нашел точной информации по вашему запросу. Попробуйте переформулировать вопрос или обратитесь к специалисту.",
        "summary_intro": "На основе найденных материалов могу сказать следующее:",
    }
    
    def __init__(self, db: Session, user_id: int = None):
        self.db = db
        self.user_id = user_id
    
    def analyze_query(self, query: str) -> Dict[str, Any]:
        """Анализирует запрос пользователя и извлекает ключевые темы"""
        query_lower = query.lower()
        
        # Определяем категории
        detected_categories = []
        for category, keywords in self.KEYWORDS.items():
            if any(keyword in query_lower for keyword in keywords):
                detected_categories.append(category)
        
        # Извлекаем ключевые слова (слова длиннее 3 символов, исключая стоп-слова)
        stop_words = {"как", "что", "где", "когда", "почему", "это", "для", "или", "и", "в", "на", "с", "по"}
        words = re.findall(r'\b\w{4,}\b', query_lower)
        keywords = [w for w in words if w not in stop_words]
        
        return {
            "categories": detected_categories,
            "keywords": keywords[:5],  # Топ-5 ключевых слов
            "original_query": query
        }
    
    def search_articles(self, analysis: Dict[str, Any]) -> List[KnowledgeArticle]:
        """Ищет релевантные статьи в базе знаний"""
        from sqlalchemy import or_
        from app.models.knowledge import KnowledgeCategory
        
        logger.info(f"[MATRESHKA] Starting search for user_id={self.user_id}")
        logger.info(f"[MATRESHKA] Analysis: {analysis}")
        
        query = self.db.query(KnowledgeArticle).join(
            KnowledgeCategory, 
            KnowledgeArticle.category_id == KnowledgeCategory.id,
            isouter=True  # LEFT JOIN чтобы включить статьи без категории
        )
        
        # Фильтр по пользователю
        if self.user_id:
            query = query.filter(KnowledgeArticle.user_id == self.user_id)
        
        # Поиск по ключевым словам
        search_conditions = []
        
        # Добавляем прямой поиск по исходному запросу
        original_query = analysis.get("original_query", "").strip()
        if original_query and len(original_query) >= 3:
            # Ищем в заголовке статьи
            search_conditions.append(KnowledgeArticle.title.ilike(f"%{original_query}%"))
            # Ищем в контенте статьи
            search_conditions.append(KnowledgeArticle.content.ilike(f"%{original_query}%"))
            # Ищем в названии категории
            search_conditions.append(KnowledgeCategory.title.ilike(f"%{original_query}%"))
        
        # Добавляем поиск по извлеченным ключевым словам
        if analysis["keywords"]:
            for keyword in analysis["keywords"]:
                search_conditions.append(KnowledgeArticle.title.ilike(f"%{keyword}%"))
                search_conditions.append(KnowledgeArticle.content.ilike(f"%{keyword}%"))
                search_conditions.append(KnowledgeCategory.title.ilike(f"%{keyword}%"))
        
        logger.info(f"[MATRESHKA] Search conditions count: {len(search_conditions)}")
        
        if search_conditions:
            query = query.filter(or_(*search_conditions))
        
        # Ограничиваем результаты
        articles = query.limit(5).all()
        
        logger.info(f"[MATRESHKA] Found {len(articles)} articles")
        for article in articles:
            logger.info(f"[MATRESHKA] - Article: {article.id} - {article.title}")
        
        return articles
    
    def generate_answer(self, query: str, articles: List[KnowledgeArticle]) -> Dict[str, Any]:
        """Генерирует ответ на основе найденных статей"""
        
        if not articles:
            return {
                "answer": self.TEMPLATES["no_results"],
                "sources_used": [],
                "confidence": 0.0
            }
        
        # Формируем ответ
        answer_parts = [self.TEMPLATES["summary_intro"]]
        
        # Добавляем краткую информацию из каждой статьи
        for i, article in enumerate(articles[:3], 1):
            # Берем первые 200 символов контента
            snippet = article.content[:200].strip()
            if len(article.content) > 200:
                snippet += "..."
            
            answer_parts.append(f"\n\n{i}. **{article.title}**\n{snippet}")
        
        # Добавляем рекомендацию
        if len(articles) > 3:
            answer_parts.append(f"\n\nТакже найдено еще {len(articles) - 3} материалов по теме.")
        
        answer_parts.append("\n\nДля получения полной информации рекомендую ознакомиться с указанными материалами.")
        
        return {
            "answer": "".join(answer_parts),
            "sources_used": [article.id for article in articles],
            "confidence": min(len(articles) / 5.0, 1.0)  # Уверенность от 0 до 1
        }
    
    def ask(self, query: str) -> Dict[str, Any]:
        """Основной метод для обработки вопроса"""
        
        # Приветствие для коротких запросов
        if len(query.strip()) < 3:
            return {
                "answer": self.TEMPLATES["greeting"],
                "sources_used": [],
                "confidence": 1.0
            }
        
        # Анализируем запрос
        analysis = self.analyze_query(query)
        
        # Ищем статьи
        articles = self.search_articles(analysis)
        
        # Генерируем ответ
        result = self.generate_answer(query, articles)
        
        return result
