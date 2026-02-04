import math
import json
import httpx
import logging
from decimal import Decimal
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

# === Факторы оценки ===
BASE_REVENUE_MULTIPLES = {
    "trademark": (1.0, 3.5),
    "software": (3.0, 7.0),
    "literary_work": (1.5, 4.0),
    "invention": (2.5, 6.0),
    "utility_model": (1.5, 3.5),
    "industrial_design": (1.2, 3.0),
    "database": (2.0, 5.0),
    "trade_name": (1.0, 2.5),
    "know_how": (2.0, 4.5),
}

def calculate_subtype_metrics_factor(metrics: dict) -> float:
    if not metrics:
        return 1.0
    vals = [float(v) for v in metrics.values()]
    if not vals:
        return 1.0
    avg = sum(vals) / len(vals)
    # 5 is neutral. Each point +/- adds/removes 5% value
    # Range 1-10 -> 0.8 to 1.25 multiplier
    return 1.0 + (avg - 5) * 0.05

MARKET_REACH_FACTOR = {"local": 0.8, "region": 0.95, "national": 1.0, "international": 1.2}
JURISDICTION_FACTOR = lambda n: 1.0 + min(0.5, 0.05 * max(0, n - 1))
BRAND_STRENGTH_FACTOR = lambda s: 0.6 + 0.05 * s
LIFE_FACTOR = lambda years: min(1.0, 0.1 + 0.1 * years)

# === ЮРИДИЧЕСКИЕ ФАКТОРЫ (Professional 2.0) ===
LEGAL_ROBUSTNESS_WEIGHTS = {
    "defense": 0.15,      # успешная защита в суде
    "examination": 0.10,  # пройдена экспертиза
    "maintenance": 0.05,  # активное поддержание в силе
    "international": 0.10 # международная регистрация
}

VALUATION_PURPOSE_MULTIPLIER = {
    "market": 1.0,
    "liquidation": 0.6,
    "investment": 1.1,
    "accounting": 0.85
}

RISK_BASE = 0.15

# === ПОДКЛЮЧАЕМ локальный ИИ ===
from app.services.local_ai import local_ai_generate

def calculate_legal_robustness_factor(robustness_list: list[str]) -> float:
    factor = 1.0
    for key in robustness_list:
        factor += LEGAL_ROBUSTNESS_WEIGHTS.get(key, 0)
    return factor

def calculate_scope_factor(scope: int) -> float:
    # scope 1-10 -> factor 0.8 to 1.3
    return 0.75 + (scope * 0.055)

async def ai_consultant_hint(ai_client, payload: dict) -> Dict[str, Any]:
    is_revenue_based = payload.get("annual_revenue") and float(payload.get("annual_revenue", 0)) > 0
    
    valuation_task = """
    "valuation_analysis": {
        "multiple_mid": float,
        "risk_discount_pct": float,
        "bullets": [строки],
        "methodology_summary": "краткое описание примененных подходов"
    }
    """ if is_revenue_based else """
    "valuation_analysis": {
        "market_value_estimate": float,
        "risk_discount_pct": float,
        "bullets": [строки],
        "methodology_summary": "краткое описание примененных подходов"
    }
    """

    prompt = f"""
    Ты — ведущий эксперт по оценке интеллектуальной собственности и нематериальных активов.
    Твоя задача — провести глубокую экспертизу и дать СТРАТЕГИЧЕСКИЕ рекомендации.
    
    ⚠️ КРИТИЧЕСКИ ВАЖНО: 
    1. Весь твой ответ должен быть ТОЛЬКО на РУССКОМ ЯЗЫКЕ.
    2. НЕ используй HTML-теги (<b>, <i>, <br> и т.д.) - только чистый текст.
    3. НЕ используй английские слова, аббревиатуры или технические термины в скобках.
    4. ДЛЯ ВАЛЮТЫ: Используй ТОЛЬКО символ ₽ (без слов "рублей", "руб" и т.д.). 
       Правильно: "1 000 000 ₽", Неправильно: "1 000 000 ₽лей", "1 000 000 рублей"
    
    Используй русскоязычные термины:
    - bypass → "обход патента" или "обход защиты"
    - scope_protection → "широта охраны" или "степень защиты"
    - leverage → "использование", "применение"
    - revenue → "выручка", "доход"
    - и т.д.
    
    Входящие данные:
    {json.dumps(payload, ensure_ascii=False)}
    
    Контекст оценки:
    - Тип: {payload.get('ip_type')} (подтип: {payload.get('subtype', 'не указан')})
    - Специфические метрики (1-10): {json.dumps(payload.get('subtype_metrics', {}), ensure_ascii=False)}
    
    Специальные инструкции по типам:
    1. Авторское право / Литературные произведения: Если это КУРС или КНИГА, оценивай потенциал тиражируемости. Важны охват аудитории и уникальность.
    2. ПО / SaaS: Оценивай технологический стек, масштабируемость и пользовательскую базу. Если архитектура сложная (метрика > 7), это повышает стоимость.
    3. Патенты / Изобретения: Ориентируйся на наукоемкость и сложность обхода. Если защиту легко обойти (метрика защиты от обхода < 4), делай большой дисконт на риск.
    
    Требования к рекомендациям:
    1. ИНДИВИДУАЛЬНОСТЬ: Используй подтип ({payload.get('subtype')}) для советов. Если это SaaS — советуй по подпискам, если книга — по лицензированию прав на перевод/экранизацию.
    2. ЦИФРЫ: Ссылайся на выручку ({payload.get('annual_revenue')} ₽) и вложения, указывай их прямо в тексте числами с символом ₽.
    3. ШАГИ: Дай 3 конкретных шага для роста капитализации.
    4. ЯЗЫК: Используй ТОЛЬКО русский язык. Все термины, примеры и пояснения — на русском.
    5. ФОРМАТ: Чистый текст без HTML-тегов. Для выделения используй ЗАГЛАВНЫЕ БУКВЫ или "кавычки".
    
    Верни строго валидный JSON:
    {{
        {valuation_task},
        "strategic_recommendations": [
            {{ "icon": "🚀", "text": "Трендовый совет по монетизации подтипа (только русский текст, без HTML, валюта только ₽)." }},
            {{ "icon": "🛡️", "text": "Юридический совет по усилению защиты (только русский текст, без HTML, валюта только ₽)." }},
            {{ "icon": "💰", "text": "Совет по росту стоимости актива (только русский текст, без HTML, валюта только ₽)." }}
        ]
    }}
    """
    try:
        data = await ai_client.complete(prompt)
        # Валидация структуры ответа
        if not isinstance(data, dict) or "valuation_analysis" not in data:
            logger.warning("AI returned invalid structure, using local fallback")
            return local_ai_generate(payload)
        return data
    except Exception as e:
        logger.error(f"AI Error, using local fallback: {e}")
        return local_ai_generate(payload)

async def run_valuation(ai_client, inputs: dict) -> Dict[str, Any]:
    # Валидация входных данных
    annual_revenue = float(inputs.get("annual_revenue", 0))
    royalty_rate = float(inputs.get("royalty_rate", 0))
    cost_rd = float(inputs.get("cost_rd", 0))
    remaining_years = int(inputs.get("remaining_years", 5))
    ip_type = inputs.get("ip_type", "trademark")
    
    # Проверка на валидность
    if annual_revenue < 0:
        raise ValueError("annual_revenue не может быть отрицательным")
    if royalty_rate < 0 or royalty_rate > 100:
        raise ValueError("royalty_rate должен быть между 0 и 100")
    if cost_rd < 0:
        raise ValueError("cost_rd не может быть отрицательным")
    if remaining_years <= 0:
        raise ValueError("remaining_years должен быть больше 0")
    if ip_type not in BASE_REVENUE_MULTIPLES:
        logger.warning(f"Unknown ip_type: {ip_type}, using default")
        ip_type = "trademark"
    
    # 1. AI Hint
    ai_hint = await ai_consultant_hint(ai_client, inputs)
    val_analysis = ai_hint.get("valuation_analysis", {})

    # 2. Доходный метод (Revenue-based)
    low, high = BASE_REVENUE_MULTIPLES.get(ip_type, (1.0, 1.0))
    
    income_val = 0.0
    if annual_revenue > 0:
        if royalty_rate > 0:
            # Метод освобождения от роялти (упрощенно)
            income_val = annual_revenue * (royalty_rate / 100.0) * remaining_years
        else:
            # Мультипликатор выручки
            income_val = annual_revenue * ((low + high) / 2.0)
    else:
        # Рыночная оценка от ИИ/Лисёнка с fallback
        income_val = val_analysis.get("market_value_estimate", 0.0)
        if income_val == 0.0 and cost_rd > 0:
            # Если нет оценки от AI и нет выручки, используем затратный метод
            income_val = cost_rd * 1.5

    # 3. Затратный метод (Cost-based)
    # Затраты обычно имеют коэффициент 1.2-1.5 для учета прибыли предпринимателя
    COST_MULTIPLIER = 1.3
    cost_val = cost_rd * COST_MULTIPLIER

    # 4. Базовая оценка (Смешиваем методы)
    # Если есть выручка, доходный метод весит 80%. Если нет - затратный весит больше.
    if annual_revenue > 0:
        baseline = (income_val * 0.8) + (cost_val * 0.2)
    elif cost_rd > 0:
        # Если нет выручки, но есть затраты
        baseline = (income_val * 0.3) + (cost_val * 0.7)
    else:
        # Если нет ни выручки, ни затрат - проверяем AI оценку
        baseline = income_val if income_val > 0 else 0.0
        
        # Если даже AI не дал оценку, возвращаем ошибку
        if baseline == 0.0:
            raise ValueError("Невозможно провести оценку: укажите годовой доход или затраты на создание/R&D. Для оценки необходимы финансовые данные.")
    
    # Минимальная оценка не может быть меньше 10% от затрат (если они есть)
    if cost_rd > 0:
        baseline = max(baseline, cost_rd * 0.1)

    # 5. Применяем юридические и рыночные факторы
    factored = baseline
    factored *= MARKET_REACH_FACTOR.get(inputs["market_reach"], 1.0)
    factored *= JURISDICTION_FACTOR(len(inputs.get("jurisdictions", ["RU"])))
    factored *= BRAND_STRENGTH_FACTOR(int(inputs.get("brand_strength", 5)))
    factored *= LIFE_FACTOR(int(inputs.get("remaining_years", 5)))
    
    # НОВЫЕ ФАКТОРЫ 2.0 + SUBTYPE METRICS
    factored *= calculate_legal_robustness_factor(inputs.get("legal_robustness", []))
    factored *= calculate_scope_factor(int(inputs.get("scope_protection", 5)))
    factored *= calculate_subtype_metrics_factor(inputs.get("subtype_metrics", {}))
    factored *= VALUATION_PURPOSE_MULTIPLIER.get(inputs.get("valuation_purpose", "market"), 1.0)

    # 6. Дисконт риска
    risk_pct = float(val_analysis.get("risk_discount_pct") or 0.15)
    
    # Sanitize AI output: if AI returns 15 instead of 0.15
    if risk_pct > 1.0:
        risk_pct = risk_pct / 100.0
        
    # Safety clamp: max discount 90%
    risk_pct = min(risk_pct, 0.9)
    # Min discount 0%
    risk_pct = max(risk_pct, 0.0)

    final = factored * (1.0 - risk_pct)

    return {
        "baseline_value": round(float(baseline), 2),
        "ai_adjustment": round(float(final - baseline), 2),
        "final_value": round(float(final), 2),
        "risk_discount": round(float(risk_pct) * 100, 2),
        "multiples_used": {
            "ai_bullets": val_analysis.get("bullets", []),
            "strategic_recommendations": ai_hint.get("strategic_recommendations", []),
            "methodology": val_analysis.get("methodology_summary", "Доходный и затратный методы с учетом юридических рисков."),
            "pro_factors": {
                "robustness": inputs.get("legal_robustness", []),
                "scope": inputs.get("scope_protection", 5),
                "purpose": inputs.get("valuation_purpose", "market")
            }
        },
    }
