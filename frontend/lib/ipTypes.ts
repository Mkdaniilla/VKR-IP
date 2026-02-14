// Константы типов объектов ИС для фронтенда
export const IP_TYPE_LABELS: Record<string, string> = {
    // 1. Результаты творческой деятельности
    literary_work: "Произведения науки, литературы и искусства",
    software: "Программы для ЭВМ",
    database: "Базы данных",
    performance: "Исполнения",
    phonogram: "Фонограммы",
    broadcast: "Сообщения радио- и телепередач",

    // 2. Объекты промышленной собственности
    invention: "Изобретения",
    utility_model: "Полезные модели",
    industrial_design: "Промышленные образцы",
    plant_variety: "Селекционные достижения",
    topology: "Топологии интегральных микросхем",

    // 3. Средства индивидуализации
    trademark: "Товарные знаки и знаки обслуживания",
    trade_name: "Фирменные наименования",
    commercial_designation: "Коммерческие обозначения",
    geographical_indication: "Географические указания и НМПТ",

    // 4. Нетрадиционные объекты
    know_how: "Секреты производства (ноу-хау)",

    other: "Другое"
};

export const IP_CATEGORIES = {
    copyright: {
        label: "Результаты творческой деятельности",
        description: "Охраняются по факту создания (регистрация не обязательна)",
        types: ["literary_work", "software", "database", "performance", "phonogram", "broadcast"]
    },
    industrial_property: {
        label: "Объекты промышленной собственности",
        description: "Обязательна государственная регистрация в Роспатенте",
        types: ["invention", "utility_model", "industrial_design", "plant_variety", "topology"]
    },
    individualization: {
        label: "Средства индивидуализации",
        description: "Служат для отличия товаров или компаний на рынке",
        types: ["trademark", "trade_name", "commercial_designation", "geographical_indication"]
    },
    non_traditional: {
        label: "Нетрадиционные объекты",
        description: "Охраняются режимом коммерческой тайны",
        types: ["know_how"]
    }
};

export const IP_SUBTYPES: Record<string, Array<{ value: string, label: string }>> = {
    literary_work: [
        { value: "book", label: "Книга / Литературный контент" },
        { value: "course", label: "Образовательный курс / Методика" },
        { value: "content", label: "Медиа-контент / Блог" },
        { value: "art", label: "Искусство / Дизайн-объект" },
    ],
    software: [
        { value: "saas", label: "SaaS Решение / Веб-сервис" },
        { value: "mobile", label: "Мобильное приложение (App)" },
        { value: "enterprise", label: "ERP/CRM (Корпоративный софт)" },
        { value: "ai", label: "AI / Алгоритм / Библиотека" },
    ],
    invention: [
        { value: "invention", label: "Изобретение (Технология)" },
        { value: "utility", label: "Полезная модель (Улучшение)" },
        { value: "pharma", label: "Фармацевтика / Химия" },
        { value: "electronics", label: "Электроника / Hardware" },
    ],
    trademark: [
        { value: "product", label: "Товарный бренд" },
        { value: "service", label: "Бренд услуг" },
        { value: "retail", label: "Торговая сеть" },
        { value: "personal", label: "Персональный бренд" },
    ],
};

export const SUBTYPE_METRICS: Record<string, Array<{ key: string, label: string, tooltip: string }>> = {
    literary_work: [
        { key: "audience", label: "Объем аудитории / Охват", tooltip: "Количество потенциальных или реальных потребителей контента (подписчики, читатели, студенты)." },
        { key: "uniqueness", label: "Уникальность контента", tooltip: "Насколько сложно воссоздать подобный контент без нарушения авторских прав. Эксклюзивность методики." },
        { key: "production", label: "Стоимость перепроизводства", tooltip: "Сколько ресурсов (времени, денег) потребуется конкуренту, чтобы создать аналог с нуля." },
    ],
    software: [
        { key: "complexity", label: "Сложность архитектуры / Кода", tooltip: "Использование уникальных алгоритмов, AI, сложных интеграций или инновационной архитектуры." },
        { key: "scalability", label: "Масштабируемость", tooltip: "Насколько легко система может обслуживать в 100 раз больше клиентов без полной переработки кода." },
        { key: "stack", label: "Зрелость стека (отсутствие долга)", tooltip: "Использование современных технологий и чистота кода, снижающая затраты на поддержку (Tech Debt)." },
    ],
    invention: [
        { key: "science", label: "Наукоемкость (R&D глубина)", tooltip: "Уровень инженерных или научных изысканий, стоявших за созданием технологии." },
        { key: "bypass", label: "Защита от обхода (Work-around)", tooltip: "Насколько сложно конкурентам создать аналогичный продукт, не нарушая формулу вашего патента." },
        { key: "implementation", label: "Сложность реализации", tooltip: "Требуются ли специальные производственные мощности или редкие компетенции для воплощения в жизнь." },
    ],
    trademark: [
        { key: "awareness", label: "Узнаваемость бренда", tooltip: "Процент целевой аудитории, который идентифицирует ваш бренд без подсказок." },
        { key: "loyalty", label: "Лояльность аудитории (LTV)", tooltip: "Готовность клиентов возвращаться к вашему бренду и рекомендовать его другим (Retention Rate)." },
        { key: "geo", label: "География присутствия", tooltip: "Распространенность бренда: от одного города до международного признания." },
    ],
};

export function getCategoryForType(ipType: string): string {
    for (const [category, data] of Object.entries(IP_CATEGORIES)) {
        if (data.types.includes(ipType)) {
            return category;
        }
    }
    return "other";
}

export function getLabelForType(ipType: string): string {
    return IP_TYPE_LABELS[ipType] || ipType;
}
