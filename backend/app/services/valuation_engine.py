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
    "it": (0.05, 0.15),
    "pharma": (0.10, 0.25),
    "manufacturing": (0.03, 0.08),
    "retail": (0.01, 0.04),
    "fmcg": (0.02, 0.05),
    "energy": (0.03, 0.07),
    "agro": (0.02, 0.06),
    "horeca": (0.04, 0.10),
    "fintech": (0.07, 0.18),
    "media": (0.15, 0.35),
    "services": (0.02, 0.06),
    "education": (0.05, 0.12),
    "construction": (0.01, 0.03),
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
        "fmcg": 0.15,
        "energy": 0.14,
        "agro": 0.17,
        "horeca": 0.18,
        "fintech": 0.19,
        "media": 0.22,
        "services": 0.17,
        "education": 0.15,
        "construction": 0.21
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

MARKET_REACH_FACTOR = {
    "local": 0.7, 
    "national": 1.1, 
    "regional": 1.4, # СНГ / Ближнее зарубежье
    "global": 1.8     # Весь мир / Экспорт
}
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
    
    # 0. ИИ-детектор отрасли (Улучшено: уважаем выбор пользователя)
    industry = inputs.get("industry", "it")
    asset_type = inputs.get("ip_type", "other")
    
    # Запускаем автоопределение только если отрасль осталась "по умолчанию" (it)
    if industry == "it":
        asset_title = inputs.get("title", "Объект")
        
        industry_prompt = f"""
        Определи отрасль для объекта интеллектуальной собственности: "{asset_title}". Тип: {asset_type}.
        Варианты: it, pharma, manufacturing, retail, services, media, fintech.
        Верни ТОЛЬКО код отрасли (например, retail).
        """
        try:
            industry_res = await ai_client.complete(industry_prompt)
            detected_code = str(industry_res).lower().strip().replace('"', '').replace("'", "")
            if detected_code in INDUSTRY_ROYALTY_RATES:
                industry = detected_code
                logger.info(f"AI Detected Industry: {industry}")
        except:
            pass

    # 1. AI Анализ рисков
    ai_hint = await ai_consultant_hint(ai_client, {**inputs, "detected_industry": industry})
    val_analysis = ai_hint.get("valuation_analysis", {})
    risk_pct = float(val_analysis.get("risk_discount_pct", 0.15))
    
    # 2. Определение ставки роялти с градацией по типу объекта (Benchmark vs Type vs Input)
    bench_low, bench_high = INDUSTRY_ROYALTY_RATES.get(industry, (0.03, 0.08))
    
    if royalty_rate == 0:
        # Умная калибровка на основе типа актива (IVS 2024 Guidance)
        if asset_type == "patent":
            # Патенты - это ядро продукта, ставка стремится к максимуму
            royalty_rate = bench_low + (bench_high - bench_low) * 0.8  # 80% от диапазона
        elif asset_type == "trademark":
            # Бренды зависят от силы (маркетинга)
            brand_score = int(inputs.get("brand_strength", 5))
            
            # Умное определение силы на основе бюджета из интервью
            for resp in inputs.get("interview_responses", []):
                val = str(resp.get("value", "")).lower()
                if "бюджет" in str(resp.get("question_text", "")).lower() or "продвижение" in str(resp.get("question_text", "")).lower():
                    if "свыше 5 млн" in val: brand_score = 10
                    elif "1 000 000" in val: brand_score = 8
                    elif "200 000" in val: brand_score = 6
                    elif "50 000" in val: brand_score = 4
                    elif "до 50 000" in val: brand_score = 2
                    
            royalty_rate = bench_low + (bench_high - bench_low) * (brand_score / 10.0)
        elif asset_type == "know_how":
            # Ноу-хау ценно, но рискованно (нет гос. защиты)
            royalty_rate = bench_low + (bench_high - bench_low) * 0.6
        else:
            # Остальные - среднее значение
            royalty_rate = (bench_low + bench_high) / 2.0
    
    # 3. ДОХОДНЫЙ МЕТОД (Professional DCF)
    annual_benefit = revenue * royalty_rate
    
    # Дополнительный риск для Ноу-хау (премия за отсутствие патента)
    if asset_type == "know_how":
        risk_pct += 0.05 # +5% к риску из-за опасности раскрытия
        
    discount_rate = calculate_discount_rate(risk_pct, industry)
    income_val = calculate_dcf(annual_benefit, years, discount_rate)
    
    # 4. ЗАТРАТНЫЙ МЕТОД (Cost-based)
    # Коэффициент 1.6 включает налоги, инфляцию и прибыль разработчика
    cost_val = cost_rd * 1.6
    
    # 5. СИНТЕЗ (Смешивание методов)
    if revenue > 1000000:
        baseline = (income_val * 0.9) + (cost_val * 0.1)
    elif revenue > 0:
        baseline = (income_val * 0.7) + (cost_val * 0.3)
    elif cost_rd > 0:
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
                "factor": resp.get("question_text") or resp.get("question_group") or "Общий фактор",
                "value": resp.get("value"),
                "source": resp.get("evidence_source", "Интервью"),
                "status": "confirmed"
            })

    # Добавляем внешние логи документов как подтвержденные факты
    attached_docs = inputs.get("attached_documents", [])
    for doc in attached_docs:
        interview_bonus += 0.05 # Каждый документ +5% к уверенности в стоимости
        evidence_extracted.append({
            "factor": "Подтверждающий документ",
            "value": doc.get("filename"),
            "source": f"Файл ID: {doc.get('id')}",
            "status": "confirmed"
        })

    # Добавляем дополнительные логи доказательств
    evidence_extracted.extend(inputs.get("evidence_logs", []))

    # Юридическая сила
    legal_factor = 1.0
    for key in inputs.get("legal_robustness", []):
        legal_factor += LEGAL_FACTORS.get(key, 0)
    final *= legal_factor
    final *= interview_bonus
    
    # 8. Финализация охвата рынка из ответов
    market_reach = inputs.get("market_reach", "national")
    for resp in inputs.get("interview_responses", []):
        text = str(resp.get("value", "")).lower()
        if "глобальный" in text or "экспорт" in text:
            market_reach = "global"
        elif "снг" in text or "ближнее" in text:
            market_reach = "regional"
        elif "локальный" in text:
            market_reach = "local"
        elif "только россия" in text:
            market_reach = "national"

    final *= MARKET_REACH_FACTOR.get(market_reach, 1.1)
    final *= JURISDICTION_FACTOR(len(inputs.get("jurisdictions", ["RU"])))
    final *= BRAND_STRENGTH_FACTOR(int(inputs.get("brand_strength", 5)))
    
    # 7. Направленность бренда (из интервью)
    brand_direction = "product"
    direction_multiplier = 1.0
    for resp in inputs.get("interview_responses", []):
        text = str(resp.get("value", "")).lower()
        if "корпоратив" in text:
            brand_direction = "corporate"
            direction_multiplier = 1.15
            evidence_extracted.append({"factor": "Тип использования", "value": "Корпоративный бренд", "impact": "+15.0%"})
        elif "торговая сеть" in text:
            brand_direction = "retail_chain"
            direction_multiplier = 1.08
        elif "личный" in text:
            brand_direction = "personal"
            direction_multiplier = 0.9
            evidence_extracted.append({"factor": "Тип использования", "value": "Личный бренд", "impact": "-10.0%"})
        elif "франшиза" in text:
            brand_direction = "franchise"
            direction_multiplier = 1.12
            evidence_extracted.append({"factor": "Тип использования", "value": "Франшиза", "impact": "+12.0%"})
            
    final *= direction_multiplier
    
    # 8. Лицензионная активность
    licensing_bonus = 1.0
    encumbrance_discount = 1.0
    protection_bonus = 1.0
    
    for resp in inputs.get("interview_responses", []):
        text = str(resp.get("value", "")).lower()
        # Лицензии
        if "роспатент" in text:
            licensing_bonus = 1.10
            evidence_extracted.append({"factor": "Лицензионная активность", "value": "Да, зарегистрированы в Роспатенте", "impact": "+10.0%"})
        elif "без регистрации" in text:
            licensing_bonus = 1.05
            
        # Обременения (Штраф)
        if "залоге у банка" in text:
            encumbrance_discount = 0.80
            evidence_extracted.append({"factor": "Обременения", "value": "Да, в залоге у банка", "impact": "-20.0%"})
        elif "судебные споры" in text or "арест" in text:
            encumbrance_discount = 0.75
            
        # Защищенность (Бонус)
        if "несколько успешных защит" in text:
            protection_bonus = 1.12 # +12% за высокую устойчивость
            evidence_extracted.append({"factor": "Устойчивость бренда", "value": "Высокая (успешные защиты)", "impact": "+12.0%"})
        elif "один успешный кейс" in text:
            protection_bonus = 1.05 # +5% за проверенный бренд
            evidence_extracted.append({"factor": "Устойчивость бренда", "value": "Подтвержденная", "impact": "+5.0%"})
        
        # Бюджет
        if "1 000 000" in text and "5 000 000" in text:
            evidence_extracted.append({"factor": "Маркетинговый бюджет", "value": "1 000 000 - 5 000 000 руб./мес.", "impact": "High"})
        elif "свыше 5 000 000" in text:
            evidence_extracted.append({"factor": "Маркетинговый бюджет", "value": "свыше 5 000 000 руб./мес.", "impact": "Top"})
            
    # Добавляем данные о масштабе рынка в доказательства
    reach_labels = {"global": "Глобальный (Экспортер)", "regional": "Межрегиональный", "national": "Российский рынок", "local": "Локальный (Регистр. в РФ)"}
    reach_impacts = {"global": "x 1.8", "regional": "x 1.4", "national": "x 1.1", "local": "x 0.7"}
    evidence_extracted.append({
        "factor": "Географический охват",
        "value": reach_labels.get(market_reach, market_reach),
        "impact": reach_impacts.get(market_reach, "neutral")
    })

    final *= licensing_bonus
    final *= encumbrance_discount
    final *= protection_bonus
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
        "industry_used": industry,
        "brand_direction": brand_direction,
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


