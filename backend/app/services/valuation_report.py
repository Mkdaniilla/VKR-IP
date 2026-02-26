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
    "pharma": "Фармацевтика / Биотехнологии",
    "manufacturing": "Промышленность / Производство",
    "retail": "Ритейл / Торговля",
    "fmcg": "FMCG / Потребительские товары",
    "energy": "Энергетика и добыча",
    "agro": "Сельское хозяйство",
    "horeca": "HoReCa / Гостеприимство",
    "fintech": "Финтех / Цифровые активы",
    "media": "Медиа / Развлечения",
    "services": "Услуги / Консалтинг",
    "education": "Образование / EdTech",
    "construction": "Строительство / Девелопмент",
    "other": "Другое"
}

DIRECTION_MAP = {
    "corporate": "Корпоративный бренд (Зонтичный)",
    "product": "Продуктовая линейка",
    "retail_chain": "Торговая сеть",
    "personal": "Личный бренд",
    "franchise": "Франшиза / Модель",
    "other": "Общее использование"
}

MARKET_REACH_MAP = {
    "local": "Локальный (Город/Регион)",
    "national": "Национальный (Россия)",
    "regional": "Межрегиональный (СНГ/ЕАЭС)",
    "global": "Международный / Глобальный"
}
# --- ANALYTICAL INTERPRETATIONS 3.0 (Ultimate Expert Knowledge Base) ---
# --- ANALYTICAL INTERPRETATIONS 3.5 (Expert Trademark Knowledge Base) ---
ANALYTICAL_RULES = {
    # == БАЗОВЫЕ ЮРИДИЧЕСКИЕ ФАКТОРЫ ==
    "Да, полностью": {
        "explanation": "Полная юридическая чистота прав и наличие документальных доказательств владения (титула) исключает риски оспаривания. Это фундаментальный фактор, обеспечивающий ликвидность актива в сделках.",
        "impact": "+10.0%", "type": "positive"
    },
    "Нет, обременений нет": {
        "explanation": "Отсутствие залогов, арестов и сторонних притязаний подтверждает статус актива как 'чистого' обеспечения. Это минимизирует дисконт за правовую неопределенность.",
        "impact": "+5.0%", "type": "positive"
    },
    "зарегистрированы в Роспатенте": {
        "explanation": "Наличие государственной регистрации — высший уровень правовой охраны. Она создает неоспоримую презумпцию владения и позволяет эффективно блокировать действия нарушителей.",
        "impact": "+10.0%", "type": "positive"
    },
    "успешных защит": {
        "explanation": "История успешной защиты прав в судах или ППС подтверждает 'выживаемость' знака. Это повышает доверие инвестора, так как актив уже прошел проверку на прочность.",
        "impact": "+12.0%", "type": "positive"
    },
    "залоге у банка": {
        "explanation": "Наличие обременения в пользу кредитных организаций существенно ограничивает права распоряжения активом. Модель закладывает дисконт на финансовые риски и риски взыскания.",
        "impact": "-20.0%", "type": "negative"
    },
    "были сложности / споры": {
        "explanation": "Наличие текущих или прошлых судебных споров создает риск аннулирования или ограничения охраны. В стоимость заложен консервативный дисконт на юридические издержки.",
        "impact": "-25.0%", "type": "negative"
    },

    # == МАСШТАБ И РЫНОЧНЫЙ ОХВАТ ==
    "Глобальный": {
        "explanation": "Международный масштаб использования превращает бренд в глобальный нематериальный актив. Это открывает доступ к рынкам с высокой покупательной способностью и валютной выручке.",
        "impact": "x 1.8", "type": "multiplier"
    },
    "Масштаб: СНГ": {
        "explanation": "Межрегиональный охват (СНГ / ЕАЭС) обеспечивает устойчивость денежного потока в рамках нескольких дружественных юрисдикций, снижая страновые риски.",
        "impact": "x 1.4", "type": "multiplier"
    },
    "Экспорт: СНГ": {
        "explanation": "Наличие экспортных поставок или присутствие в странах содружества подтверждает высокую узнаваемость бренда за пределами домашнего рынка и его международную ликвидность.",
        "impact": "x 1.4", "type": "multiplier"
    },
    "Российский рынок": {
        "explanation": "Национальный масштаб обеспечивает устойчивость денежного потока в рамках одной юрисдикции. Стоимость базируется на стабильном внутреннем спросе.",
        "impact": "x 1.1", "type": "multiplier"
    },
    "Локальный": {
        "explanation": "Ограничение охвата одним регионом снижает потенциал масштабируемости, что учитывается через понижающий коэффициент к рыночному мультипликатору.",
        "impact": "x 0.7", "type": "multiplier"
    },

    # == ТИП ИСПОЛЬЗОВАНИЯ БРЕНДА ==
    "Корпоративный бренд": {
        "explanation": "Зонтичный бренд холдинга аккумулирует репутацию всех дочерних направлений. Это создает эффект синергии и долгосрочную премию к рыночной цене.",
        "impact": "+15.0%", "type": "positive"
    },
    "Торговая сеть": {
        "explanation": "Для ритейла сила бренда определяется количеством точек контакта. Развитая сеть подтверждает высокую узнаваемость и отработанные бизнес-процессы.",
        "impact": "+8.0%", "type": "positive"
    },
    "Франшиза": {
        "explanation": "Способность бренда к масштабированию через франчайзинг — признак высокодоходной бизнес-модели. Актив обладает отличной возвратностью инвестиций.",
        "impact": "+12.0%", "type": "positive"
    },
    "Личный бренд": {
        "explanation": "Высокая привязка к личности владельца является фактором риска: при смене собственника ценность актива может резко упасть. Модель применяет корректировку на неразрывную связь.",
        "impact": "-10.0%", "type": "negative"
    },
    "Продуктовая линейка": {
        "explanation": "Фокус на конкретной товарной группе позволяет сформировать лояльное ядро потребителей. Стоимость актива защищена специализацией.",
        "impact": "+7.0%", "type": "positive"
    },
    "Да, без регистрации": {
        "explanation": "Наличие лицензионных отношений подтверждает коммерческий спрос. Однако отсутствие регистрации договоров в Роспатенте создает юридические риски.",
        "impact": "+5.0%", "type": "neutral"
    },
    "В процессе переговоров": {
        "explanation": "Активная фаза переговоров по лицензированию свидетельствует о высоком коммерческом интересе к бренду. Это подтверждает потенциал масштабирования и будущих денежных потоков.",
        "impact": "+4.0%", "type": "positive"
    },
    "Нет, используем единолично": {
        "explanation": "Единоличное использование знака обеспечивает правообладателю полный контроль над репутацией и качеством товаров/услуг. Отсутствие внешних лицензий исключает риски потери управляемости брендом.",
        "impact": "+2.0%", "type": "positive"
    },
    "Ограничено лицензией": {
        "explanation": "Наличие действующих лицензий ограничивает правообладателя в части эксклюзивного распоряжения активом. Модель учитывает правовые ограничения и разделение выгод с лицензиатами.",
        "impact": "-5.0%", "type": "negative"
    },

    # == МАРКЕТИНГОВЫЙ БЮДЖЕТ (СИЛА ЗНАКА) ==
    "свыше 5 000 000": {
        "explanation": "Масштабные инвестиции в продвижение формируют статус Top-of-Mind. Исключительная узнаваемость позволяет обосновать максимальную ставку роялти.",
        "impact": "+25.0%", "type": "positive"
    },
    "1 000 000 - 5 000 000": {
        "explanation": "Высокая маркетинговая активность формирует устойчивый бренд-капитал. Актив находится в активной фазе роста капитализации.",
        "impact": "+18.0%", "type": "positive"
    },
    "до 1 000 000": {
        "explanation": "Средний уровень вложений обеспечивает стабильное присутствие на рынке в своем сегменте без претензий на доминирование.",
        "impact": "+10.0%", "type": "positive"
    },
    "до 200 000": {
        "explanation": "Начальный этап формирования бренда. Текущая стоимость базируется на потенциале, требующем дальнейшего инвестиционного подтверждения.",
        "impact": "+3.0%", "type": "neutral"
    },
    "до 50 000": {
        "explanation": "Минимальные вложения в маркетинг. Ценность актива на данном этапе формируется преимущественно за счет качественных характеристик продукта.",
        "impact": "+1.0%", "type": "neutral"
    }
}

def get_interpretation(val_text: str, factor_name: str = "") -> dict | None:
    """
    Final smart matching engine with semantic hierarchy.
    """
    v = str(val_text).lower()
    f = str(factor_name).lower()
    
    # 1. High Priority Keyword Mappings (Check value AND factor context)
    priority_map = [
        # Values
        ("глобальный", "Глобальный"),
        ("межрегиональный", "Масштаб: СНГ"),
        ("снг", "Экспорт: СНГ"),
        ("корпоративный", "Корпоративный бренд"),
        ("продуктов", "Продуктовая линейка"),
        ("торговая сеть", "Торговая сеть"),
        ("франшиза", "Франшиза"),
        ("полностью", "Да, полностью"),
        ("без регистрации", "Да, без регистрации"),
        ("лицензия", "Да, без регистрации"),
        ("обременений нет", "Нет, обременений нет"),
        ("роспатент", "зарегистрированы в Роспатенте"),
        ("защит", "успешных защит"),
        ("нац.", "Российский рынок"),
        ("россия", "Российский рынок"),
        ("российский рынок", "Российский рынок"),
        ("локальный", "Локальный"),
        ("залог", "залоге у банка"),
        ("переговоров", "В процессе переговоров"),
        ("единолично", "Нет, используем единолично"),
        ("ограничено лицензией", "Ограничено лицензией"),
        ("сложности", "были сложности / споры"),
        ("спор", "были сложности / споры"),
        ("личный бренд", "Личный бренд"),
        # Marketing budgets - Large values first!
        ("свыше 5 000 000", "свыше 5 000 000"),
        ("1 000 000 - 5 000 000", "1 000 000 - 5 000 000"),
        ("миллион", "до 1 000 000"),
        ("200 000", "до 200 000"),
        ("50 000", "до 50 000")
    ]
    
    # Match by priority keyword in value
    for kw, rule_key in priority_map:
        if kw in v:
            return ANALYTICAL_RULES.get(rule_key)

    # 2. General Fallback (Check keys in value)
    for key, rule in ANALYTICAL_RULES.items():
        if key.lower() in v:
            return rule
            
    # 3. Contextual fallback by factor name
    if "устойчивость" in f or "защиты" in f:
        return ANALYTICAL_RULES.get("успешных защит")
        
    if "географ" in f or "охват" in f:
        if "снг" in v or "межрегиональный" in v:
            return ANALYTICAL_RULES.get("Масштаб: СНГ")
        return ANALYTICAL_RULES.get("Российский рынок")

    if "экспорт" in f or "страна" in f or "страны" in f:
        if "снг" in v or "межрегиональный" in v:
            return ANALYTICAL_RULES.get("Экспорт: СНГ")
        return ANALYTICAL_RULES.get("Российский рынок")

    if "бюджет" in f or "маркетинг" in f:
        # If it's a budget question but we didn't match a specific range, give a safe 'Low/Mid' interpretation
        if "50 000" in v or "минимальный" in v:
            return ANALYTICAL_RULES.get("до 50 000")
        return ANALYTICAL_RULES.get("до 200 000")

    return None

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
        title=f"Отчет об оценке #{request_id}"
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
    
    industry_raw = results.get("industry_used", payload.get("industry", "other"))
    industry_str = INDUSTRY_MAP.get(industry_raw, industry_raw)
    
    reach_raw = payload.get("market_reach", "")
    
    # Sync market reach from interview if changed
    for resp in payload.get("interview_responses", []):
        q_text = str(resp.get("question_text", "")).lower()
        if "географ" in q_text or "охват" in q_text or "масштаб" in q_text:
            r_val = str(resp.get("value", "")).lower()
            if "глобал" in r_val or "международ" in r_val: reach_raw = "global"
            elif "снг" in r_val or "межрегион" in r_val: reach_raw = "regional"
            elif "нац" in r_val or "росси" in r_val: reach_raw = "national"
            elif "локал" in r_val: reach_raw = "local"

    reach_str = MARKET_REACH_MAP.get(reach_raw, reach_raw)

    robustness = payload.get("legal_robustness", [])
    if robustness:
        robustness_str = ", ".join([ROBUSTNESS_MAP.get(r, r) for r in robustness])
    else:
        robustness_str = "Нет подтвержденных факторов защиты"
    
    # Direction translation
    direction_raw = results.get("brand_direction", "product")
    direction_str = DIRECTION_MAP.get(direction_raw, "Продуктовая линейка")

    # Список прикрепленных документов
    attached_docs = payload.get("attached_documents", [])
    docs_str = ", ".join(attached_docs) if attached_docs else "Данные интервью"

    # Licensing detection for report
    licensing_str = "Не выявлено"
    for resp in payload.get("interview_responses", []):
        if "лицензии" in str(resp.get("question_text", "")).lower():
            licensing_str = resp.get("value", "Не выявлено")

    # Encumbrance detection for report
    pledge_str = "Отсутствуют"
    for resp in payload.get("interview_responses", []):
        if "залогом" in str(resp.get("question_text", "")).lower():
            pledge_str = resp.get("value", "Отсутствуют")

    # Defense history detection for report
    defense_str = "Стандартная"
    for resp in payload.get("interview_responses", []):
        if "защите" in str(resp.get("question_text", "")).lower() or "суде" in str(resp.get("question_text", "")).lower():
            defense_str = resp.get("value", "Стандартная")

    # Marketing budget detection for report
    mkt_str = "Минимальный"
    for resp in payload.get("interview_responses", []):
        if "бюджет" in str(resp.get("question_text", "")).lower() or "продвижение" in str(resp.get("question_text", "")).lower():
            mkt_str = resp.get("value", "Минимальный")

    # Data for the first table (Object Passport)
    table_data_1 = [
        ["Тип объекта:", Paragraph(ip_type_str, styles["BodyCyr"])],
        ["Цель оценки:", Paragraph(PURPOSE_MAP.get(payload.get("valuation_purpose", "market"), "Рыночная"), styles["BodyCyr"])],
        ["Отрасль:", Paragraph(industry_str, styles["BodyCyr"])],
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

    # Calculate consolidated Brand Strength Coefficient (%)
    baseline = results.get('baseline_value', 1)
    final = results.get('final_value', 1)
    # Protection against div zero and logic: (Final/Baseline - 1) * 100
    brand_strength_pct = ((final / baseline) - 1.0) * 100.0 if baseline > 0 else 0
    brand_strength_str = f"{'+' if brand_strength_pct >= 0 else ''}{brand_strength_pct:.1f}%"

    res_data = [
        ["Показатель", "Значение"],
        ["Оценка на базе доходов (Доходный метод)", fmt_curr(results.get('baseline_value', 0))],
        ["Коэффициент силы бренда (Премия/Дисконт)", brand_strength_str],
        ["Скидка за риск и ликвидность актива", pro_factors.get("discount_rate", "—")],
        ["Рыночная ставка за право использования (Роялти)", pro_factors.get("royalty_rate", "—")],
        ["Затраты на создание аналога (Затратный метод)", fmt_curr(payload.get('cost_rd', 0))],
        ["ИТОГОВАЯ РЫНОЧНАЯ СТОИМОСТЬ", fmt_curr(results.get('final_value', 0))],
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

    # --- 2a. Анализ факторов влияния --- (Removed as per user request to keep the report cleaner)
    # The detailed breakdown is now covered by the more readable 'Analytical Evidence' table below.

    # --- 2b. Доказательная база (Expert Analytical Table) ---
    evidence = results.get("evidence_logs", [])
    if evidence:
        content.append(Paragraph("Аналитическая доказательная база и верификация (Анализ факторов):", ParagraphStyle('SectionHeader', parent=styles['BodyCyr'], fontSize=12, textColor=colors.HexColor("#1e293b"), spaceBefore=20, spaceAfter=10)))
        
        # Table Header (High Professionalism)
        evidence_data = [[
            Paragraph("Обнаруженный факт / Фактор", ParagraphStyle('H', parent=styles['BodyCyr'], fontSize=9, fontStyle='Bold', textColor=colors.white)), 
            Paragraph("Экспертная интерпретация влияния на капитализацию", ParagraphStyle('H', parent=styles['BodyCyr'], fontSize=9, fontStyle='Bold', textColor=colors.white)), 
            Paragraph("Вес в модели", ParagraphStyle('H', parent=styles['BodyCyr'], fontSize=9, fontStyle='Bold', textColor=colors.white, alignment=1))
        ]]
        
        # Styles for table content
        q_style = ParagraphStyle('Q', parent=styles['BodyCyr'], fontSize=8, textColor=colors.HexColor("#64748b"))
        v_style = ParagraphStyle('V', parent=styles['BodyCyr'], fontSize=9, fontStyle='Bold', textColor=colors.HexColor("#0f172a"))
        i_style = ParagraphStyle('I', parent=styles['BodyCyr'], fontSize=8, leading=11, textColor=colors.HexColor("#334155"))
        impact_style = ParagraphStyle('Imp', parent=styles['BodyCyr'], fontSize=10, alignment=1, fontStyle='Bold')

        seen_rules = set()
        semantic_dedup = set() # To prevent showing same region/logic twice
        
        for e in evidence:
            val = str(e.get('value', '—')).strip()
            val_l = val.lower()
            factor = str(e.get('factor', 'Общий параметр'))
            
            # Skip empty or placeholder values
            if not val or val == "—" or "документ" in factor.lower():
                continue
                
            # Semantic Deduplication for Regions (CIS/Global)
            # If we already mentioned CIS/Global reach, don't repeat it for Export/Countries
            if any(kw in val_l for kw in ["снг", "межрегиональный", "глобальный", "международный"]):
                region_key = "CIS" if "снг" in val_l or "межрегиональный" in val_l else "GLOBAL"
                if region_key in semantic_dedup:
                    continue
                semantic_dedup.add(region_key)

            # Internal matching key for rule lookup
            rule_match = get_interpretation(val, factor)
            
            if rule_match:
                # Deduplication: if we already used this exact explanation, skip
                rule_explanation = rule_match["explanation"]
                if rule_explanation in seen_rules:
                    continue
                seen_rules.add(rule_explanation)
                
                explanation = rule_explanation
                impact_val = rule_match["impact"]
                imp_type = rule_match["type"]
            else:
                # Fallback entries are NOT deduplicated because they represent different unique answers
                explanation = f"Фактор '{factor}' подтвержден в ходе интервью. Влияние ответа '{val}' учтено в расчетной модели согласно стандартам IVS."
                impact_val = e.get('impact', 'Верифицировано')
                imp_type = "neutral"

            # Visual logic for impact colors
            if imp_type == "positive": imp_color = "#16a34a"
            elif imp_type == "negative": imp_color = "#dc2626"
            elif imp_type == "multiplier": imp_color = "#8b5cf6"
            else: imp_color = "#0284c7"
            
            # Dynamic color for manual impact values
            if not rule_match:
                if any(x in str(impact_val) for x in ['+', 'x', '1.']): imp_color = "#16a34a"
                elif '-' in str(impact_val): imp_color = "#dc2626"

            impact_p = Paragraph(f"<font color='{imp_color}'>{impact_val}</font>", impact_style)

            evidence_data.append([
                [Paragraph(factor, q_style), Spacer(1, 2), Paragraph(val, v_style)],
                Paragraph(explanation, i_style),
                impact_p
            ])
        
        te = Table(evidence_data, colWidths=[63*mm, 82*mm, 25*mm])
        te.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), FONT),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")), # Dark Header
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 10),
            ('BACKGROUND', (0,1), (-1,-1), colors.white),
        ]))
        content.append(te)
        content.append(Spacer(1, 15))

    # --- Explanation Block --- (Removed as per user request)

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

    # --- 3. Обоснование рыночной стоимости ---
    content.append(Paragraph("3. Обоснование и драйверы рыночной стоимости", styles["SectionHeader"]))
    
    # Plain language logic explanation
    logic_text = """
    <b>Логика расчета:</b> Оценка вашего актива выполнена на основе анализа будущих экономических выгод. 
    Мы оценили актив как инструмент, генерирующий дополнительную прибыль и обеспечивающий экономию на «аренде» чужой репутации (Method Relief from Royalty). 
    Итоговая стоимость учитывает текущую рыночную конъюнктуру, финансовые показатели проекта и качественные характеристики, подтвержденные в ходе интервью.
    """
    content.append(Paragraph(logic_text, styles["BodyCyr"]))
    content.append(Spacer(1, 10))

    # Dynamic Key Drivers selection
    evidence = results.get("evidence_logs", [])
    # Sort by absolute impact (to find the most important ones)
    def sort_key(e):
        imp = str(e.get('impact', '0'))
        if 'x' in imp: return float(imp.replace('x', '').strip()) * 10
        if '%' in imp: return abs(float(imp.replace('%', '').replace('+', '').strip()))
        return 0

    sorted_evidence = sorted(evidence, key=sort_key, reverse=True)
    drivers = sorted_evidence[:3] # Pick top 3

    if drivers:
        content.append(Paragraph("<b>Ключевые драйверы капитализации:</b>", styles["BodyCyr"]))
        content.append(Spacer(1, 5))
        
        for d in drivers:
            factor = d.get('factor', '').lower()
            val = d.get('value', '')
            impact = d.get('impact', '')
            
            header = "Рыночный фактор"
            
            if any(x in factor for x in ["охват", "географ", "рынок", "экспорт"]):
                header = "Масштабируемость"
            elif any(x in factor for x in ["защит", "роспатент", "юрид", "суд", "чистота"]):
                header = "Юридическая устойчивость"
            elif any(x in factor for x in ["бюджет", "маркетинг", "продвижение"]):
                header = "Сила продвижения"
            elif any(x in factor for x in ["выручка", "доход", "деньги", "прибыль"]):
                header = "Коммерческий потенциал"
            elif any(x in factor for x in ["франшиза", "лицензия", "переговор"]):
                header = "Потенциал роста"

            driver_para = f"<b>{header}:</b> {val}. Данный фактор оказывает прямое влияние на итоговую капитализацию актива ({impact})."
            content.append(Paragraph(f"• {driver_para}", styles["BodyCyr"]))
            content.append(Spacer(1, 4))

    content.append(Spacer(1, 10))
    # Verification Line
    verify_style = ParagraphStyle('Verify', parent=styles['BodyCyr'], fontSize=9, textColor=colors.HexColor("#64748b"), fontName=FONT)
    content.append(Paragraph("Верификация данных: Расчетные показатели базируются на актуальных рыночных данных и результатах проведенного экспертного интервью.", verify_style))

    content.append(Spacer(1, 15))

    # --- 4. Профессиональные стратегические рекомендации ---
    content.append(Paragraph("4. Рекомендации по повышению капитализации", styles["SectionHeader"]))
    
    # Expert logic for dynamic recommendations
    expert_recs = []
    evidence_text = " ".join([f"{e.get('factor')} {e.get('value')}" for e in evidence]).lower()
    
    # Trigger 1: Unregistered licenses
    if "без регистрации" in evidence_text:
        expert_recs.append("Зарегистрируйте все лицензионные договоры в Роспатенте. Отсутствие регистрации делает права лицензиатов уязвимыми и снижает общую прозрачность владения активом.")
    
    # Trigger 2: National reach only
    if "российский рынок" in evidence_text and "глобальный" not in evidence_text:
        expert_recs.append("Рассмотрите расширение правовой охраны в странах БРИКС и ЕАЭС (Мадридская система). Это защитит экспортный потенциал и увеличит стоимость бренда как международного актива.")
    
    # Trigger 3: Personal brand risk
    if "личный бренд" in evidence_text:
        expert_recs.append("Начните процесс деперсонализации бренда (разработка корпоративных стандартов и гайдлайнов). Это повысит ликвидность актива, так как он перестанет быть неразрывно связанным с личностью владельца.")
    
    # Trigger 4: Low marketing budget
    if "до 50 000" in evidence_text:
        expert_recs.append("Увеличьте инвестиции в имиджевое продвижение. Повышение узнаваемости бренда до уровня 'узнаваем в отрасли' позволит в будущем обосновать рост ставки роялти на 3-5%.")
    
    # Trigger 5: Encumbrances (strict check for affirmative "bad" status)
    if any(x in evidence_text for x in ["залог у банка", "были сложности", "под арестом", "наличие ареста"]):
        expert_recs.append("Разработайте план по досудебному урегулированию текущих споров или выводу актива из-под обременения. Это моментально снимет дисконт за юридическую неопределенность (-20%).")
    
    # Trigger 6: No registrations mentioned
    if "зарегистрированы в роспатенте" not in evidence_text:
        expert_recs.append("Проведите аудит и актуализацию перечня товаров и услуг (МКТУ). Своевременное расширение охраны на новые товарные категории защитит ваш бизнес от недобросовестной конкуренции.")

    # Always add 1-2 generic high-value recs if list is short
    if len(expert_recs) < 3:
        expert_recs.append("Внедрите систему внутреннего мониторинга (Trademark Monitoring) для оперативного выявления попыток регистрации схожих до степени смешения знаков конкурентами.")
        expert_recs.append("Используйте оценку бренда для постановки на баланс предприятия. Это увеличит чистые активы компании и повысит её инвестиционную привлекательность для кредитных организаций.")

    # Limit and display
    final_recs = expert_recs[:4]
    for rec_text in final_recs:
        content.append(Paragraph(f"• {rec_text}", styles["BodyCyr"]))
        content.append(Spacer(1, 4))

    # --- Footer ---
    content.append(Spacer(1, 40))
    content.append(Paragraph("___________________________________________________", styles["SmallNote"]))
    content.append(Paragraph("Документ сформирован автоматически системой MDM Valuation.", styles["SmallNote"]))
    content.append(Paragraph("Отчёт носит информационный характер и не является гарантией сделки.", styles["SmallNote"]))
    
    doc.build(content)
    # Return path relative to the static mount
    return f"/valuation_reports/{filename}"
