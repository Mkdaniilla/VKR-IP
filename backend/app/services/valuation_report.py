from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from xml.sax.saxutils import escape as xml_escape
from datetime import datetime
import os
from typing import Any

# === ШРИФТ ===
def _pick_font_path() -> str | None:
    env_path = os.getenv("VALUATION_FONT_PATH")
    candidates = []
    if env_path: candidates.append(env_path)
    try:
        script_dir = os.path.dirname(__file__)
        static_font_path = os.path.abspath(os.path.join(script_dir, "..", "static", "fonts", "DejaVuLGCSans.ttf"))
        candidates.append(static_font_path)
    except Exception: pass
    local_path = os.path.join(os.path.dirname(__file__), "fonts", "DejaVuLGCSans.ttf")
    candidates.append(local_path)
    candidates += ["/usr/share/fonts/truetype/dejavu/DejaVuLGCSans.ttf"]
    for p in candidates:
        if os.path.exists(p): return p
    return None

_font_path = _pick_font_path()
if _font_path:
    pdfmetrics.registerFont(TTFont("CyrillicBase", _font_path))
    FONT = "CyrillicBase"
else:
    FONT = "Helvetica"

REPORT_DIR = "storage/valuation_reports"

def _p(text: str) -> str:
    return xml_escape(str(text) if text is not None else "")

# --- LOCALIZATION MAPS ---
PURPOSE_MAP = {
    "market": "Рыночная стоимость",
    "liquidation": "Ликвидационная стоимость",
    "investment": "Инвестиционная привлекательность",
    "accounting": "Для бухгалтерского учета"
}

ROBUSTNESS_MAP = {
    "registered": "Государственная регистрация / Патент",
    "defense": "Защита в суде (успешная)",
    "examination": "Гос. экспертиза (пройдена)",
    "maintenance": "Поддержание в силе (оплачено)",
    "international": "Международная регистрация"
}

IP_TYPE_MAP = {
    # Результаты творческой деятельности
    "literary_work": "Произведения науки, литературы и искусства",
    "software": "Программы для ЭВМ",
    "database": "Базы данных",
    "performance": "Исполнения",
    "phonogram": "Фонограммы",
    "broadcast": "Сообщения радио- и телепередач",
    
    # Объекты промышленной собственности
    "invention": "Изобретения",
    "utility_model": "Полезные модели",
    "industrial_design": "Промышленные образцы",
    "plant_variety": "Селекционные достижения",
    "topology": "Топологии интегральных микросхем",
    
    # Средства индивидуализации
    "trademark": "Товарные знаки и знаки обслуживания",
    "trade_name": "Фирменные наименования",
    "commercial_designation": "Коммерческие обозначения",
    "geographical_indication": "Географические указания и НМПТ",
    
    # Нетрадиционные объекты
    "know_how": "Секреты производства (ноу-хау)",
    
    # Устаревшие (для совместимости)
    "patent": "Патент / Изобретение",
    "design": "Промышленный образец (Дизайн)",
    "copyright": "Авторское право",
    "knowhow": "Секрет производства (Ноу-хау)",
    "other": "Другое"
}

SUBTYPE_MAP = {
    # Literary work
    "book": "Книги и статьи",
    "course": "Образовательные курсы",
    "content": "Медиа-контент",
    "music": "Музыкальные произведения",
    "art": "Произведения искусства",
    "film": "Аудиовизуальные произведения",
    
    # Software
    "saas": "SaaS решение",
    "mobile": "Мобильное приложение",
    "enterprise": "Корпоративный софт",
    "ai": "AI и алгоритмы",
    "game": "Игры",
    
    # Database
    "users": "База клиентских данных",
    "financial": "Финансовая база данных",
    "science": "Научно-исследовательская база",
    "marketing": "Маркетинговая аналитическая база",
    
    # Utility model
    "instrum": "Инструменты и приспособления",
    "device": "Устройства и механизмы",
    "component": "Детали и компоненты",
    
    # Industrial design
    "exterior": "Промышленный дизайн (Внешний вид)",
    "interior": "Интерьерное решение",
    "package": "Упаковка и этикетка",
    
    # Performance
    "live": "Живое исполнение",
    "recorded": "Запись выступления",
    "concert": "Концертная программа",
    
    # Phonogram
    "album": "Музыкальный альбом",
    "single": "Сингл / Трек",
    "podcast": "Подкаст / Аудиопередача",

    # Scenario titles mapping
    "Технологический аудит ПО": "Программный продукт (Информационные технологии)",
    "Бренд-интервью": "Средства индивидуализации (Бренд)",
    "Техническая экспертиза изобретения": "Техническое изобретение",
    "Аудит режима секретности": "Секрет производства (Ноу-хау)",
    "Анализ контента и дистрибуции": "Творческое произведение",
    "Аудит прав исполнителя": "Объект смежных прав (Исполнение)",
    "Анализ структуры базы данных": "Информационная база данных",
    "Экспертиза полезной модели": "Полезная модель",
    "Аудит фонограммы": "Объект смежных прав (Фонограмма)",
    "Оценка промышленного дизайна": "Промышленный образец (Дизайн)",
    "Общий аудит объекта ИС": "Основной профиль актива",

    "other": "Другое",
    "standard": "Основной профиль"
}

METRIC_LABELS = {
    # Общие
    "uniqueness": "Уникальность",
    "scalability": "Масштабируемость",
    "protection": "Защищенность",
    "monetization": "Монетизация",
    "reputation": "Репутация",
    "potential": "Потенциал",
    
    # Книги / Курсы
    "circulation": "Тираж / Продажи",
    "literary_value": "Лит. ценность",
    "adaptation_potential": "Потенциал адаптации",
    "students": "Количество студентов",
    "rating": "Рейтинг",
    "content_freshness": "Актуальность контента",
    
    # ПО
    "mrr": "MRR / ARR (Доход)",
    "churn": "Churn Rate (Отток)",
    "tech_debt": "Технический долг",
    "downloads": "Количество загрузок",
    "dau_mau": "Активность (DAU/MAU)",
    "store_rating": "Рейтинг в сторах",
    "clients": "Количество клиентов",
    "avg_deal": "Средний чек",
    "integrations": "Интеграции",
    "lock_in": "Vendor Lock-in",
    "accuracy": "Точность алгоритмов",
    
    # Игры
    "players": "Активные игроки",
    "retention": "Удержание (Retention)",
    "arpu": "Доход на юзера (ARPU)",
    "ip_potential": "IP Потенциал",
    
    # Изобретения / Модели
    "development_stage": "Стадия разработки",
    "market_size": "Объем рынка",
    "efficacy": "Эффективность",
    "patent_strength": "Сила патента",
    "innovation": "Инновационность",
    "manufacturability": "Готовность к пр-ву",
    "competitive_edge": "Конкурентное превосходство",
    "novelty_level": "Уровень новизны",
    "practical_use": "Практическая польза",
    "bypass_difficulty": "Сложность обхода",
    
    # Базы данных
    "data_uniqueness": "Уникальность данных",
    "data_volume": "Объем данных",
    "data_utility": "Полезность данных",
    "data_freshness": "Актуальность данных",
    
    # Дизайн
    "aesthetic_appeal": "Эстетическая ценность",
    "distinctiveness": "Узнаваемость",
    "ergonomics": "Эргономика",
    
    # Бренды / Имена
    "market_stability": "Устойчивость на рынке",
    "network_value": "Стоимость связей",
    "brand_awareness": "Узнаваемость бренда",
    "customer_loyalty": "Лояльность (NPS)",
    "premium": "Премиальность",
    "service_quality": "Качество сервиса",
    "differentiation": "Дифференциация",
    "audience": "Аудитория",
    "influence": "Влияние",
    "commercial_potential": "Коммерческий потенциал",
    
    # Ноу-хау
    "economic_value": "Экономическая ценность",
    "secrecy_level": "Степень секретности",
    "useful_life": "Срок актуальности",
}

INDUSTRY_MAP = {
    "it": "IT / Программное обеспечение",
    "retail": "Ритейл / Торговля",
    "manufacturing": "Производство",
    "services": "Услуги / Консалтинг",
    "finance": "Финансы / Финтех",
    "healthcare": "Медицина / HealthTech",
    "education": "Образование",
    "media": "Медиа / Развлечения",
    "other": "Другое"
}

MARKET_REACH_MAP = {
    "local": "Локальный (Город/Регион)",
    "national": "Национальный (РФ)",
    "global": "Международный / Глобальный"
}

def generate_pdf(request_id: int, payload: dict, results: dict, currency: str, filename: str) -> str:
    os.makedirs(REPORT_DIR, exist_ok=True)
    path = os.path.join(REPORT_DIR, filename)
    
    # Setup Document
    doc = SimpleDocTemplate(
        path, 
        pagesize=A4, 
        leftMargin=20*mm, 
        rightMargin=20*mm, 
        topMargin=20*mm, 
        bottomMargin=20*mm,
        title=f"Assessment Report #{request_id}"
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    styles.add(ParagraphStyle(
        name="TitleCyr", 
        fontName=FONT, 
        fontSize=24, 
        textColor=colors.HexColor("#1A5F7A"), 
        spaceAfter=20, 
        alignment=1, # Center
        leading=28
    ))
    styles.add(ParagraphStyle(
        name="SubtitleCyr",
        fontName=FONT,
        fontSize=12,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=30,
        alignment=1
    ))
    styles.add(ParagraphStyle(
        name="SectionHeader", 
        fontName=FONT, 
        fontSize=14, 
        textColor=colors.HexColor("#ea580c"), # Orange-600
        spaceBefore=15, 
        spaceAfter=10, 
        fontStyle='Bold',
        borderPadding=(0, 0, 5, 0),
        borderColor=colors.HexColor("#fed7aa"), # Orange-200
        borderWidth=1,
        borderKind='south'
    ))
    styles.add(ParagraphStyle(
        name="BodyCyr", 
        fontName=FONT, 
        fontSize=10, 
        leading=15,
        textColor=colors.HexColor("#334155")
    ))
    styles.add(ParagraphStyle(
        name="SmallNote", 
        fontName=FONT, 
        fontSize=8, 
        textColor=colors.gray, 
        alignment=1
    ))
    
    # Helper to format currency
    def fmt_curr(val):
        return f"{val:,.0f}".replace(",", " ") + (" ₽" if currency == "RUB" else f" {currency}")

    content = []

    # --- Header ---
    content.append(Paragraph("ЭКСПЕРТНОЕ ЗАКЛЮЧЕНИЕ ОБ ОЦЕНКЕ ИС", styles["TitleCyr"]))
    content.append(Paragraph(f"Объект № {request_id} &nbsp; | &nbsp; Дата формирования: {datetime.now().strftime('%d.%m.%Y')}", styles["SubtitleCyr"]))
    content.append(Spacer(1, 10))

    # --- 1. Parameters ---
    content.append(Paragraph("1. Характеристики объекта и правовой статус", styles["SectionHeader"]))
    
    ip_type_raw = payload.get("ip_type", "other")
    ip_type_str = IP_TYPE_MAP.get(ip_type_raw, ip_type_raw)
    
    industry_raw = payload.get("industry", "other")
    industry_str = INDUSTRY_MAP.get(industry_raw, industry_raw)
    
    reach_raw = payload.get("market_reach", "")
    reach_str = MARKET_REACH_MAP.get(reach_raw, reach_raw)

    robustness = payload.get("legal_robustness", [])
    if robustness:
        robustness_str = ", ".join([ROBUSTNESS_MAP.get(r, r) for r in robustness])
    else:
        robustness_str = "Нет подтвержденных факторов защиты"
    
    # Subtype translation
    subtype_raw = payload.get("subtype", "")
    subtype_str = SUBTYPE_MAP.get(subtype_raw, subtype_raw) if subtype_raw else "Не указано"

    # Data for the first table
    table_data_1 = [
        ["Тип объекта:", Paragraph(ip_type_str, styles["BodyCyr"])],
        ["Направленность:", Paragraph(subtype_str, styles["BodyCyr"])],
        ["Цель оценки:", Paragraph(PURPOSE_MAP.get(payload.get("valuation_purpose", "market"), "Рыночная"), styles["BodyCyr"])],
        ["Отрасль:", Paragraph(industry_str, styles["BodyCyr"])],
        ["Рынок сбыта:", Paragraph(reach_str, styles["BodyCyr"])],
        ["Широта охраны:", f"{payload.get('scope_protection', 5)} / 10"],
        ["Юридическая сила:", Paragraph(robustness_str, styles["BodyCyr"])],
        ["Годовой доход:", fmt_curr(payload.get('annual_revenue', 0))],
        ["Вложения (R&D):", fmt_curr(payload.get('cost_rd', 0))],
    ]
    
    t1 = Table(table_data_1, colWidths=[60*mm, 110*mm])
    t1.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), FONT),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TEXTCOLOR', (0,0), (0,-1), colors.HexColor("#475569")), # Slate-600 label
        ('TEXTCOLOR', (1,0), (1,-1), colors.black),
        ('GRID', (0,0), (-1,-1), 0.25, colors.HexColor("#e2e8f0")),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#f8fafc")), # Slate-50
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    content.append(t1)
    content.append(Spacer(1, 10))

    # --- 1a. Intellectual Metrics ---
    subtype_metrics = payload.get("subtype_metrics", {})
    if subtype_metrics:
        # Create a small grid for metrics
        metrics_data = []
        metrics_items = list(subtype_metrics.items())
        
        # Split into 2 columns
        style_metrics = ParagraphStyle('MetricStyle', parent=styles['BodyCyr'], fontSize=9)
        for i in range(0, len(metrics_items), 2):
            row = []
            for j in range(2):
                if i + j < len(metrics_items):
                    m_key, m_val = metrics_items[i + j]
                    m_label = METRIC_LABELS.get(m_key, m_key)
                    row.append(Paragraph(f"<b>{m_label}:</b> {m_val}/10", style_metrics))
                else:
                    row.append("")
            metrics_data.append(row)
        
        if metrics_data:
            content.append(Paragraph("Специфические метрики актива:", ParagraphStyle('SmallSub', parent=styles['BodyCyr'], fontSize=9, textColor=colors.HexColor("#64748b"), spaceAfter=5)))
            tm = Table(metrics_data, colWidths=[85*mm, 85*mm])
            tm.setStyle(TableStyle([
                ('FONTNAME', (0,0), (-1,-1), FONT),
                ('FONTSIZE', (0,0), (-1,-1), 9),
                ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#334155")),
                ('PADDING', (0,0), (-1,-1), 4),
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")), # Slate-100
            ]))
            content.append(tm)
            content.append(Spacer(1, 15))
    else:
        content.append(Spacer(1, 5))

    # --- 2. Financial Results ---
    content.append(Paragraph("2. Результаты профессиональной оценки", styles["SectionHeader"]))
    
    pro_factors = results.get("multiples_used", {}).get("pro_factors", {})
    
    # Range visualization (Min - Max)
    val_min = results.get('final_value_min', results['final_value'] * 0.9)
    val_max = results.get('final_value_max', results['final_value'] * 1.1)
    
    range_text = f"Динамический диапазон стоимости: <b>{fmt_curr(val_min)} — {fmt_curr(val_max)}</b>"
    content.append(Paragraph(range_text, ParagraphStyle('RangeStyle', parent=styles['BodyCyr'], alignment=1, fontSize=12, spaceAfter=15, textColor=colors.HexColor("#0369a1"))))

    res_data = [
        ["Показатель", "Значение"],
        ["Базовая финансовая модель (DCF/Cost)", fmt_curr(results['baseline_value'])],
        ["Ставка дисконтирования (WACC)", pro_factors.get("discount_rate", "18%")],
        ["Ставка роялти (Relief rate)", pro_factors.get("royalty_rate", "5%")],
        ["Затраты на воспроизводство (R&D)", fmt_curr(payload.get('cost_rd', 0))],
        ["ИТОГОВАЯ (РЕКОМЕНДУЕМАЯ) СТОИМОСТЬ", fmt_curr(results['final_value'])],
    ]
    
    t2 = Table(res_data, colWidths=[110*mm, 60*mm])
    t2.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), FONT),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#f0fdf4")),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.HexColor("#15803d")),
        ('FONTSIZE', (0,-1), (-1,-1), 12),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    content.append(t2)
    content.append(Spacer(1, 15))

    # --- 2a. Factor Impact Analysis ---
    factors = results.get("factors_breakdown", [])
    if factors:
        content.append(Paragraph("Детализация влияния факторов (Factor Analysis):", ParagraphStyle('SubHeader', parent=styles['BodyCyr'], fontSize=10, fontStyle='Bold', spaceAfter=8)))
        f_data = [["Фактор", "Влияние", "Значение / Множитель"]]
        for f in factors:
            impact_val = f.get('impact', 1.0)
            if f.get('type') == 'percentage':
                display_impact = f"{'+' if impact_val > 0 else ''}{impact_val}%"
            else:
                display_impact = f"x {impact_val}"
            
            f_data.append([
                f.get('icon', '') + " " + f.get('name', ''),
                display_impact,
                "Учтено в модели"
            ])
            
        tf = Table(f_data, colWidths=[70*mm, 40*mm, 60*mm])
        tf.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), FONT),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('GRID', (0,0), (-1,-1), 0.25, colors.HexColor("#cbd5e1")),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
            ('ALIGN', (1,1), (1,-1), 'CENTER'),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        content.append(tf)
        content.append(Spacer(1, 15))

    # --- 2b. Evidence Base ---
    evidence = results.get("evidence_logs", [])
    if evidence:
        content.append(Paragraph("Журнал доказательств (Audit Trail):", ParagraphStyle('SubHeader', parent=styles['BodyCyr'], fontSize=10, fontStyle='Bold', spaceAfter=5)))
        evidence_data = [["Фактор / Группа", "Значение / Доказательство", "Статус"]]
        for e in evidence:
            status_icon = "V" if e.get('status') == 'confirmed' else "?"
            evidence_data.append([
                Paragraph(e.get('factor', 'Фактор'), styles["BodyCyr"]),
                Paragraph(f"{e.get('value', '')} ({e.get('source', '')})", styles["BodyCyr"]),
                status_icon
            ])
        
        te = Table(evidence_data, colWidths=[50*mm, 100*mm, 20*mm])
        te.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), FONT),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.25, colors.HexColor("#cbd5e1")),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
            ('ALIGN', (2,0), (2,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        content.append(te)
        content.append(Spacer(1, 15))

    # --- Explanation Block ---
    content.append(Paragraph("Методологические пояснения:", styles["BodyCyr"]))
    explanation_style = ParagraphStyle(
        'Explanation',
        parent=styles['BodyCyr'],
        fontSize=9,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=6,
        leftIndent=10
    )
    
    explanations = [
        f"<b>• Модель DCF:</b> Оценка основана на методе дисконтированных денежных потоков по ставке {pro_factors.get('discount_rate')}.",
        f"<b>• Доказательная база:</b> Стоимость скорректирована на основе верифицированных фактов из интервью и документов.",
        "<b>• Диапазон стоимости:</b> Отражает уверенность ИИ в предоставленных данных. Большее количество доказательств сужает диапазон."
    ]
    
    for explanation in explanations:
        content.append(Paragraph(explanation, explanation_style))

    content.append(Spacer(1, 20))

    import re

    def clean_ai_text(text: str) -> str:
        """
        Очищает AI-сгенерированный текст от HTML-тегов и форматирует числа.
        """
        # 1. Удаляем все HTML-теги (<b>, <i>, <br>, и т.д.)
        text = re.sub(r'<[^>]+>', '', text)
        
        # 2. Очищаем малформированные валюты
        # "₽лей" → "₽", "рублей" → "₽"
        text = re.sub(r'₽лей', '₽', text)
        text = re.sub(r'рублей', '₽', text)
        text = re.sub(r'руб\.?', '₽', text)
        
        # 3. Форматируем числа с валютой
        def repl(match):
            num_str = match.group(1).replace(" ", "").replace("\xa0", "").replace(",", "")
            try:
                val = float(num_str)
                return fmt_curr(val)
            except:
                return match.group(0)
        
        # Pattern 1: Числа, уже имеющие валюту (RUB, руб., ₽)
        text = re.sub(r'(\d[\d\s\.,]*)\s?(?:RUB|₽)', repl, text, flags=re.IGNORECASE)
        
        # Pattern 2: Большие числа без валюты (вероятно, денежные суммы)
        # Ищем числа >= 1000 с пробелами или точками (например "100000.0" или "1 000 000")
        # которые стоят после слов "выручка", "вложения", "доход", "составляет" и т.д.
        def add_currency(match):
            num_str = match.group(1).replace(" ", "").replace("\xa0", "").replace(",", "")
            try:
                val = float(num_str)
                # Добавляем валюту только к большим числам (>= 100)
                if val >= 100:
                    return fmt_curr(val)
                return match.group(0)
            except:
                return match.group(0)
        
        # Ищем числа после ключевых слов, связанных с деньгами
        money_keywords = r'(?:выручка|вложения|доход|составляет|расход|стоимость|оценивается|капитализация)'
        text = re.sub(
            rf'{money_keywords}\s+(?:компании\s+)?(?:составляет\s+)?(\d[\d\s\.,]+)',
            lambda m: m.group(0).replace(m.group(1), add_currency(m)),
            text,
            flags=re.IGNORECASE
        )
        
        # 4. Экранируем XML-специальные символы
        return xml_escape(text)

    # --- 3. Methodology ---
    content.append(Paragraph("3. Методология и обоснование (Анализ ИИ)", styles["SectionHeader"]))
    
    methodology = results.get("multiples_used", {}).get("methodology", "Применен комбинированный подход.")
    content.append(Paragraph(f"<b>Методология:</b> {clean_ai_text(methodology)}", styles["BodyCyr"]))
    content.append(Spacer(1, 8))
    
    bullets = results.get("multiples_used", {}).get("ai_bullets", [])
    if bullets:
        content.append(Paragraph("Ключевые факторы:", styles["BodyCyr"]))
        for b in bullets:
            # Clean text and format numbers
            txt = str(b).lstrip("•-–* ")
            # Check if this bullet is just a duplicate of revenue info we already have in table?
            # We keep it but format it nicely.
            content.append(Paragraph(f"• {clean_ai_text(txt)}", styles["BodyCyr"]))

    content.append(Spacer(1, 15))

    # --- 4. Recommendations ---
    content.append(Paragraph("4. Стратегические рекомендации", styles["SectionHeader"]))
    
    recs = results.get("multiples_used", {}).get("strategic_recommendations", [])
    if not recs:
        content.append(Paragraph("Нет специфических рекомендаций.", styles["BodyCyr"]))
    else:
        for r in recs:
            text = r.get('text', '')
            # Format numbers in recommendations too
            formatted_text = clean_ai_text(text)
            content.append(Paragraph(f"• {formatted_text}", styles["BodyCyr"]))
            content.append(Spacer(1, 4))

    # --- Footer ---
    content.append(Spacer(1, 40))
    content.append(Paragraph("___________________________________________________", styles["SmallNote"]))
    content.append(Paragraph("Документ сформирован автоматически системой MDM IP Valuation.", styles["SmallNote"]))
    content.append(Paragraph("Отчёт носит информационный характер и не является гарантией сделки.", styles["SmallNote"]))
    
    doc.build(content)
    # Return path relative to the static mount
    return f"/valuation_reports/{filename}"
