import math
import json
import httpx
import logging
from decimal import Decimal
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

# === Профессиональные отраслевые ставки роялти (Industry Benchmarks) ===
# Источники: RoyaltyStat, MARKABLES, экспертные оценки
INDUSTRY_ROYALTY_RATES = {
    "it": (0.05, 0.15),        # Программное обеспечение, SaaS
    "pharma": (0.10, 0.25),     # Патенты на лекарственные средства
    "manufacturing": (0.03, 0.08),# Технологии производства
    "retail": (0.01, 0.04),     # Товарные знаки в ритейле
    "services": (0.02, 0.06),   # Консалтинг, франшизы
    "media": (0.15, 0.35),      # Контент, музыка, кино
    "fashion": (0.05, 0.12),    # Бренды одежды
    "fintech": (0.07, 0.18),    # Финансовые алгоритмы
}

# === ЮРИДИЧЕСКИЕ ФАКТОРЫ 2.0 (Legal Weighting) ===
LEGAL_FACTORS = {
    "registered": 0.25,   # Наличие патента/регистрации (базовая защита)
    "defense": 0.30,      # Прецеденты успешной защиты в суде (высокая ликвидность)
    "examination": 0.15,  # Гос. экспертиза (снижает риск аннулирования)
    "maintenance": 0.10,  # Регулярное продление (подтверждает интерес владельца)
    "international": 0.20 # PCT/WIPO (возможность экспансии)
}

def calculate_discount_rate(risk_pct: float, industry: str = "it") -> float:
    """
    Рассчитывает ставку дисконтирования на основе базовой ставки и риска.
    WACC (базово) + IP Risk Premium.
    """
    # Базовая ставка для РФ (Ключевая ставка + премия за риск рынка)
    base_rates = {
        "it": 0.18,
        "pharma": 0.15,
        "manufacturing": 0.20,
        "retail": 0.16,
        "services": 0.17,
        "media": 0.22,
    }
    base_rate = base_rates.get(industry, 0.18)
    return base_rate + risk_pct

def calculate_dcf(annual_benefit: float, years: int, discount_rate: float) -> float:
    """
    Расчет чистой приведенной стоимости (NPV) будущих выгод от ИС.
    """
    total_npv = 0.0
    for t in range(1, years + 1):
        total_npv += annual_benefit / ((1 + discount_rate) ** t)
    return total_npv

def calculate_subtype_metrics_factor(metrics: dict) -> float:
    if not metrics:
        return 1.0
    vals = [float(v) for v in metrics.values()]
    if not vals:
        return 1.0
    avg = sum(vals) / len(vals)
    # Диапазон 1-10 -> множитель 0.6 - 1.5 (более агрессивно выделяем лидерство)
    return 0.6 + (avg / 10.0) * 0.9

MARKET_REACH_FACTOR = {"local": 0.7, "region": 0.9, "national": 1.1, "international": 1.5}
JURISDICTION_FACTOR = lambda n: 1.0 + min(1.0, 0.15 * max(0, n - 1))
BRAND_STRENGTH_FACTOR = lambda s: 0.4 + (s * 0.12) # 1=0.52, 10=1.6

VALUATION_PURPOSE_MULTIPLIER = {
    "market": 1.0,
    "liquidation": 0.4, # Глубокий дисконт для срочной продажи
    "investment": 1.25,
    "accounting": 0.85
}

# === ПОДКЛЮЧАЕМ локальный ИИ ===
from app.services.local_ai import local_ai_generate

async def ai_consultant_hint(ai_client, payload: dict) -> Dict[str, Any]:
    # (AI Prompt remains similar but with focus on DCF methodology)
    is_revenue_based = payload.get("annual_revenue") and float(payload.get("annual_revenue", 0)) > 0
    
    valuation_task = """
    "valuation_analysis": {
        "risk_discount_pct": float (0.05 to 0.45),
        "bullets": [строки с анализом юридических рисков и рыночных барьеров],
        "methodology_summary": "Описание применения метода Relief from Royalty и DCF"
    }
    """
    prompt = f"""
    Ты — ведущий эксперт по оценке ИС (IVS 2024). Проведи глубокий анализ для {payload.get('ip_type')} ({payload.get('subtype')}).
    Оцени специфические риски актива: юридическую защищенность, рыночные барьеры, зависимость от команды.
    Используй профессиональную терминологию (NPV, WACC, Royalty Relief).
    Входящие данные: {json.dumps(payload, ensure_ascii=False)}
    
    Верни строго JSON:
    {{
        {valuation_task},
        "strategic_recommendations": [
            {{ "icon": "🚀", "text": "Трендовый совет по монетизации" }},
            {{ "icon": "🛡️", "text": "Юридический совет по ГК РФ и защите" }},
            {{ "icon": "💰", "text": "Совет по минимизации рисков (WACC)" }}
        ]
    }}
    """
    try:
        data = await ai_client.complete(prompt)
        return data if isinstance(data, dict) and "valuation_analysis" in data else local_ai_generate(payload)
    except:
        return local_ai_generate(payload)

async def run_valuation(ai_client, inputs: dict) -> Dict[str, Any]:
    # Преобразование типов
    revenue = float(inputs.get("annual_revenue", 0))
    royalty_rate = float(inputs.get("royalty_rate", 0)) / 100.0
    cost_rd = float(inputs.get("cost_rd", 0))
    years = int(inputs.get("remaining_years", 5))
    industry = inputs.get("industry", "it")
    
    # 1. AI Анализ рисков
    ai_hint = await ai_consultant_hint(ai_client, inputs)
    val_analysis = ai_hint.get("valuation_analysis", {})
    risk_pct = float(val_analysis.get("risk_discount_pct", 0.15))
    
    # 2. Определение ставки роялти (Benchmark vs Input)
    bench_low, bench_high = INDUSTRY_ROYALTY_RATES.get(industry, (0.03, 0.08))
    if royalty_rate == 0:
        # Умный выбор ставки внутри бенчмарка на основе силы бренда
        brand_score = int(inputs.get("brand_strength", 5))
        royalty_rate = bench_low + (bench_high - bench_low) * (brand_score / 10.0)
    
    # 3. ДОХОДНЫЙ МЕТОД (Professional DCF)
    # Метод освобождения от роялти (Relief from Royalty)
    annual_benefit = revenue * royalty_rate
    discount_rate = calculate_discount_rate(risk_pct, industry)
    
    income_val = calculate_dcf(annual_benefit, years, discount_rate)
    
    # 4. ЗАТРАТНЫЙ МЕТОД (Cost-based)
    # Учитываем воспроизводство и предпринимательскую прибыль (Entrepreneurial Profit)
    cost_val = cost_rd * 1.6
    
    # 5. СИНТЕЗ (Смешивание методов в зависимости от стадии жизни актива)
    if revenue > 1000000:
        # Зрелый актив: основной уклон на доход (90%)
        baseline = (income_val * 0.9) + (cost_val * 0.1)
    elif revenue > 0:
        # Ранняя коммерциализация (70/30)
        baseline = (income_val * 0.7) + (cost_val * 0.3)
    elif cost_rd > 0:
        # Стадия разработки
        baseline = cost_val
    else:
        baseline = float(val_analysis.get("market_value_estimate", 0))

    if baseline == 0:
        raise ValueError("Недостаточно данных для оценки. Укажите доход или инвестиции.")

    # 6. ПРИМЕНЕНИЕ КОЭФФИЦИЕНТОВ IP
    final = baseline
    
    # Модификация на основе интервью (уверенность ИИ)
    interview_bonus = 1.0
    evidence_extracted = []
    
    for resp in inputs.get("interview_responses", []):
        # Если ответ позитивный и подтвержден (упрощенная логика для прототипа)
        if resp.get("status") == "confirmed":
            interview_bonus += 0.02 # +2% за каждый подтвержденный факт
            evidence_extracted.append({
                "factor": resp.get("question_group", "Общий фактор"),
                "value": resp.get("value"),
                "source": resp.get("evidence_source", "Интервью"),
                "status": "confirmed"
            })

    # Добавляем внешние логи доказательств
    evidence_extracted.extend(inputs.get("evidence_logs", []))

    # Юридическая сила
    legal_factor = 1.0
    for key in inputs.get("legal_robustness", []):
        legal_factor += LEGAL_FACTORS.get(key, 0)
    final *= legal_factor
    final *= interview_bonus
    
    # Рыночные факторы
    final *= MARKET_REACH_FACTOR.get(inputs.get("market_reach"), 1.0)
    final *= JURISDICTION_FACTOR(len(inputs.get("jurisdictions", ["RU"])))
    final *= BRAND_STRENGTH_FACTOR(int(inputs.get("brand_strength", 5)))
    final *= calculate_subtype_metrics_factor(inputs.get("subtype_metrics", {}))
    final *= VALUATION_PURPOSE_MULTIPLIER.get(inputs.get("valuation_purpose", "market"), 1.0)

    # Итоговый дисконт на риск (уже заложен в DCF частично, но здесь финальный Clamp)
    final_value = round(final, 2)
    
    # Расчет диапазона (Evidence-based confidence)
    # Если доказательств мало - диапазон шире
    confidence_spread = 0.15 - (len(evidence_extracted) * 0.01)
    confidence_spread = max(0.05, confidence_spread)
    
    final_min = round(final_value * (1 - confidence_spread), 2)
    final_max = round(final_value * (1 + confidence_spread), 2)

    return {
        "baseline_value": round(float(baseline), 2),
        "ai_adjustment": round(float(final_value - baseline), 2),
        "final_value": final_value,
        "final_value_min": final_min,
        "final_value_max": final_max,
        "risk_discount": round(risk_pct * 100, 2),
        "discount_rate_used": round(discount_rate * 100, 2),
        "evidence_logs": evidence_extracted,
        "factors_breakdown": [
            {"name": "Юридическая чистота", "impact": round((legal_factor - 1) * 100, 1), "type": "percentage", "icon": "⚖️"},
            {"name": "Подтвержденные факты", "impact": round((interview_bonus - 1) * 100, 1), "type": "percentage", "icon": "✅"},
            {"name": "Рыночный охват", "impact": MARKET_REACH_FACTOR.get(inputs.get("market_reach"), 1.0), "type": "multiplier", "icon": "🌍"},
            {"name": "Юрисдикции", "impact": round(JURISDICTION_FACTOR(len(inputs.get("jurisdictions", ["RU"]))), 2), "type": "multiplier", "icon": "🏳️"},
            {"name": "Сила бренда", "impact": round(BRAND_STRENGTH_FACTOR(int(inputs.get("brand_strength", 5))), 2), "type": "multiplier", "icon": "💎"},
            {"name": "Специфические метрики", "impact": round(calculate_subtype_metrics_factor(inputs.get("subtype_metrics", {})), 2), "type": "multiplier", "icon": "📊"},
            {"name": "Цель оценки", "impact": VALUATION_PURPOSE_MULTIPLIER.get(inputs.get("valuation_purpose", "market"), 1.0), "type": "multiplier", "icon": "🎯"}
        ],
        "multiples_used": {
            "ai_bullets": val_analysis.get("bullets", []),
            "strategic_recommendations": ai_hint.get("strategic_recommendations", []),
            "methodology": "Метод освобождения от роялти (Relief from Royalty) с применением дисконтирования денежных потоков (DCF). Проведен анализ доказательной базы через AI-интервью.",
            "pro_factors": {
                "discount_rate": f"{round(discount_rate*100, 1)}%",
                "royalty_rate": f"{round(royalty_rate*100, 1)}%",
                "legal_weight": f"+{round((legal_factor-1)*100)}%"
            }
        },
    }


