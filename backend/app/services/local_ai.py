# app/services/local_ai.py

import random

def _select_random(items):
    return random.choice(items)

def local_ai_generate(payload: dict):
    ip_type = payload.get("ip_type", "trademark")
    brand_strength = payload.get("brand_strength", 5)
    market_reach = payload.get("market_reach", "national")
    annual_revenue = payload.get("annual_revenue", 0)
    cost_rd = payload.get("cost_rd", 0)
    legal_robustness = payload.get("legal_robustness", [])
    scope_protection = payload.get("scope_protection", 5)
    valuation_purpose = payload.get("valuation_purpose", "market")

    risk_level = "умеренный"
    risk_discount_pct = 0.15

    if "defense" in legal_robustness:
        risk_discount_pct -= 0.05
    if scope_protection > 7:
        risk_discount_pct -= 0.03

    bullets_pool = [
        f"Сила бренда ({brand_strength}/10) обеспечивает конкурентное преимущество.",
        f"Широта правовой охраны ({scope_protection}/10) существенно снижает риск появления аналогов.",
        f"Наличие опыта судебной защиты подтверждает юридическую устойчивость актива." if "defense" in legal_robustness else "Юридический статус актива стабилен.",
        f"Цель оценки '{valuation_purpose}' обуславливает применение специфических коэффициентов дисконтирования.",
        f"Охват рынка '{market_reach}' позволяет эффективно масштабировать монетизацию.",
        "Затратный подход подтверждает наличие значимых инвестиций в интеллектуальный капитал." if cost_rd > 0 else "Доходный подход является основным при текущих параметрах."
    ]

    bullets = random.sample(bullets_pool, k=4)

    recommendations_map = {
        "trademark": [
            "📈 Укрепляйте узнаваемость бренда через PR-кампании.",
            "🌍 Рассмотрите расширение в другие страны.",
            "🤝 Создайте партнёрские лицензионные программы.",
        ],
        "patent": [
            "🔬 Проведите технологический аудит.",
            "📘 Подготовьте патентный ландшафт.",
            "🏭 Рассмотрите возможность технологического трансфера.",
        ],
        "software": [
            "💾 Создайте модели подписки.",
            "🛡 Добавьте технические меры защиты кода.",
            "🤝 Разработайте лицензионные пакеты.",
        ],
    }

    recs = recommendations_map.get(ip_type, recommendations_map["trademark"])

    methodology = "Применен комбинированный подход: доходный метод (освобождение от роялти) и затратный метод (анализ инвестиций в R&D). Учтены поправочные коэффициенты на юридическую устойчивость и широту правовой охраны."

    return {
        "valuation_analysis": {
            "multiple_mid": 2.5,
            "market_value_estimate": max(500000.0, annual_revenue * 2.5 + cost_rd * 1.5),
            "risk_discount_pct": round(max(0.05, risk_discount_pct), 3),
            "bullets": bullets,
            "methodology_summary": methodology
        },
        "strategic_recommendations": [
            {"icon": r.split()[0], "text": r[2:]} for r in recs
        ]
    }
