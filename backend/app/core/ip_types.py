"""
Константы и справочники для классификации объектов ИС
"""

# Человекочитаемые названия типов объектов ИС
IP_TYPE_LABELS = {
    # 1. Результаты творческой деятельности
    "literary_work": "Произведения науки, литературы и искусства",
    "software": "Программы для ЭВМ",
    "database": "Базы данных",
    "performance": "Исполнения",
    "phonogram": "Фонограммы",
    "broadcast": "Сообщения радио- и телепередач",
    
    # 2. Объекты промышленной собственности
    "invention": "Изобретения",
    "utility_model": "Полезные модели",
    "industrial_design": "Промышленные образцы",
    "plant_variety": "Селекционные достижения",
    "topology": "Топологии интегральных микросхем",
    
    # 3. Средства индивидуализации
    "trademark": "Товарные знаки и знаки обслуживания",
    "trade_name": "Фирменные наименования",
    "commercial_designation": "Коммерческие обозначения",
    "geographical_indication": "Географические указания и НМПТ",
    
    # 4. Нетрадиционные объекты
    "know_how": "Секреты производства (ноу-хау)",
    
    "other": "Другое"
}

# Группировка по категориям
IP_CATEGORIES = {
    "copyright": {
        "label": "Результаты творческой деятельности",
        "description": "Охраняются по факту создания (регистрация не обязательна)",
        "types": ["literary_work", "software", "database", "performance", "phonogram", "broadcast"]
    },
    "industrial_property": {
        "label": "Объекты промышленной собственности",
        "description": "Обязательна государственная регистрация в Роспатенте",
        "types": ["invention", "utility_model", "industrial_design", "plant_variety", "topology"]
    },
    "individualization": {
        "label": "Средства индивидуализации",
        "description": "Служат для отличия товаров или компаний на рынке",
        "types": ["trademark", "trade_name", "commercial_designation", "geographical_indication"]
    },
    "non_traditional": {
        "label": "Нетрадиционные объекты",
        "description": "Охраняются режимом коммерческой тайны",
        "types": ["know_how"]
    }
}

# Подтипы для специфических метрик оценки
IP_SUBTYPES = {
    "literary_work": [
        {"value": "book", "label": "Книга / Литературный контент"},
        {"value": "course", "label": "Образовательный курс / Методика"},
        {"value": "content", "label": "Медиа-контент / Блог"},
        {"value": "art", "label": "Искусство / Дизайн-объект"},
    ],
    "software": [
        {"value": "saas", "label": "SaaS Решение / Веб-сервис"},
        {"value": "mobile", "label": "Мобильное приложение (App)"},
        {"value": "enterprise", "label": "ERP/CRM (Корпоративный софт)"},
        {"value": "ai", "label": "AI / Алгоритм / Библиотека"},
    ],
    "invention": [
        {"value": "invention", "label": "Изобретение (Технология)"},
        {"value": "utility", "label": "Полезная модель (Улучшение)"},
        {"value": "pharma", "label": "Фармацевтика / Химия"},
        {"value": "electronics", "label": "Электроника / Hardware"},
    ],
    "trademark": [
        {"value": "product", "label": "Товарный бренд"},
        {"value": "service", "label": "Бренд услуг"},
        {"value": "retail", "label": "Торговая сеть"},
        {"value": "personal", "label": "Персональный бренд"},
    ],
}

# Специфические метрики для каждого типа
SUBTYPE_METRICS = {
    "literary_work": [
        {"key": "audience", "label": "Объем аудитории / Охват", "tooltip": "Количество потенциальных или реальных потребителей контента"},
        {"key": "uniqueness", "label": "Уникальность контента", "tooltip": "Насколько сложно воссоздать подобный контент без нарушения авторских прав"},
        {"key": "production", "label": "Стоимость перепроизводства", "tooltip": "Сколько ресурсов потребуется конкуренту для создания аналога"},
    ],
    "software": [
        {"key": "complexity", "label": "Сложность архитектуры / Кода", "tooltip": "Использование уникальных алгоритмов, AI, сложных интеграций"},
        {"key": "scalability", "label": "Масштабируемость", "tooltip": "Насколько легко система может обслуживать в 100 раз больше клиентов"},
        {"key": "stack", "label": "Зрелость стека (отсутствие долга)", "tooltip": "Использование современных технологий и чистота кода"},
    ],
    "invention": [
        {"key": "science", "label": "Наукоемкость (R&D глубина)", "tooltip": "Уровень инженерных или научных изысканий"},
        {"key": "bypass", "label": "Защита от обхода (Work-around)", "tooltip": "Насколько сложно конкурентам создать аналог без нарушения патента"},
        {"key": "implementation", "label": "Сложность реализации", "tooltip": "Требуются ли специальные производственные мощности"},
    ],
    "trademark": [
        {"key": "awareness", "label": "Узнаваемость бренда", "tooltip": "Процент целевой аудитории, который идентифицирует ваш бренд"},
        {"key": "loyalty", "label": "Лояльность аудитории (LTV)", "tooltip": "Готовность клиентов возвращаться к вашему бренду"},
        {"key": "geo", "label": "География присутствия", "tooltip": "Распространенность бренда: от одного города до международного признания"},
    ],
}


def get_category_for_type(ip_type: str) -> str:
    """Возвращает категорию для данного типа объекта ИС"""
    for category, data in IP_CATEGORIES.items():
        if ip_type in data["types"]:
            return category
    return "other"


def get_label_for_type(ip_type: str) -> str:
    """Возвращает человекочитаемое название типа"""
    return IP_TYPE_LABELS.get(ip_type, ip_type)
