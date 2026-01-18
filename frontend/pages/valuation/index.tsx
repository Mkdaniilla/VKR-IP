"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import FormattedPrice from "../../components/FormattedPrice";
import {
  authFetch,
  getToken,
  getIPObjects,
  IPObject,
  ValuationPayload,
  getProtectedFileUrl,
} from "../../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ================= Типы ==================
type ValuationResponse = {
  id: number;
  baseline_value: number;
  ai_adjustment: number;
  final_value: number;
  currency: string;
  risk_discount: number;
  multiples_used: {
    ai_bullets: string[];
    strategic_recommendations: { icon: string; text: string }[];
    methodology: string;
  };
  pdf_url: string;
};

// ValuationPayload импортируется из api.ts

type IPQuickInfo = {
  id: number;
  title: string;
  type: string;
};

// ================= Компоненты ==================

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1 align-middle">
    <div className="bg-gray-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] cursor-help group-hover:bg-green-500 transition-colors">
      ?
    </div>
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-[11px] p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-gray-700 leading-relaxed">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

export default function ValuationPage() {
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<ValuationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ipObjects, setIpObjects] = useState<IPQuickInfo[]>([]);
  const [ipObjectsError, setIpObjectsError] = useState<string | null>(null);

  const [form, setForm] = useState<ValuationPayload>({
    ip_object_id: null,
    ip_type: "trademark",
    jurisdictions: ["RU"],
    brand_strength: 5,
    annual_revenue: 0,
    royalty_rate: 3,
    cost_rd: 0,
    remaining_years: 5,
    market_reach: "national",
    industry: "it",
    currency: "RUB",
    legal_robustness: [],
    scope_protection: 5,
    valuation_purpose: "market",
    subtype: "",
    subtype_metrics: {},
  });

  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  // Загрузка списка объектов и пресет из URL
  useEffect(() => {
    setMounted(true);

    // Пресет из URL
    const { revenue, brand, type, objectId } = router.query;
    if (revenue || brand || type || objectId) {
      setForm(p => ({
        ...p,
        annual_revenue: revenue ? Number(revenue) : p.annual_revenue,
        brand_strength: brand ? Number(brand) : p.brand_strength,
        ip_type: type ? String(type) : p.ip_type,
        ip_object_id: objectId ? Number(objectId) : p.ip_object_id,
      }));
    }

    async function fetchObjects() {
      try {
        const r = await authFetch(`${API_URL}/ip_objects/`);
        if (r.ok) {
          const data = await r.json();
          setIpObjects(data);
          setIpObjectsError(null);
        } else {
          setIpObjectsError("Не удалось загрузить список объектов");
        }
      } catch (e) {
        setIpObjectsError("Ошибка сети при загрузке объектов");
      }
    }
    fetchObjects();
  }, [router.query]); // Depend on query to handle subsequent navigation or initial load

  // Базовый онлайн-расчет (лайв-коэффициент) с мемоизацией
  const calculateLiveBaseline = useMemo(() => {
    let base = (form.annual_revenue * (form.royalty_rate / 100) * form.remaining_years) + (form.cost_rd * 1.3);

    // Add subtype metrics impact
    const metricsImpact = Object.values(form.subtype_metrics).reduce((sum: number, val: number) => sum + (val - 5), 0);
    const multiplier = 1 + (metricsImpact * 0.05); // each point above 5 adds 5%

    return base * (multiplier > 0.1 ? multiplier : 0.1);
  }, [form.annual_revenue, form.royalty_rate, form.remaining_years, form.cost_rd, form.subtype_metrics]);

  const bind = (k: keyof ValuationPayload, v: any) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const toggleRobustness = (key: string) => {
    setForm(p => ({
      ...p,
      legal_robustness: p.legal_robustness.includes(key)
        ? p.legal_robustness.filter(x => x !== key)
        : [...p.legal_robustness, key]
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Валидация формы
    if (form.remaining_years <= 0) {
      setError("Срок действия должен быть больше 0");
      return;
    }
    if (form.annual_revenue < 0) {
      setError("Годовой доход не может быть отрицательным");
      return;
    }
    if (form.cost_rd < 0) {
      setError("Инвестиции не могут быть отрицательными");
      return;
    }
    if (form.royalty_rate < 0 || form.royalty_rate > 100) {
      setError("Ставка роялти должна быть между 0 и 100%");
      return;
    }

    setLoading(true);
    setRes(null);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Необходима авторизация");
      }

      const r = await fetch(`${API_URL}/api/valuation/estimate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });

      const data = await r.json();
      if (!r.ok) {
        throw new Error(data.detail || "Ошибка при расчете на сервере");
      }
      setRes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenFile = async (url: string, filename?: string) => {
    try {
      const blobUrl = await getProtectedFileUrl(url);
      const lowerName = (filename || url).toLowerCase();
      const isPdf = lowerName.endsWith(".pdf");

      if (isPdf) {
        window.open(blobUrl, "_blank");
      } else {
        // Для DOCX и прочих — принудительное скачивание
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "document.docx";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e: any) {
      alert(e?.message || "Не удалось открыть файл. Проверьте соединение с сервером.");
    }
  };

  const Slider = ({ label, value, min, max, onChange, suffix = "", tooltip }: any) => (
    <div className="mb-6">
      <div className="flex justify-between mb-2 items-center">
        <label className="text-sm font-bold text-gray-700">
          {label}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
        <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">
          {value}{suffix}
        </span>
      </div>
      <input
        title={label}
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
      />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 mb-20">

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Капитализация 2.0 ⚖️</h1>
            <p className="text-gray-500 mt-1">Оценка ИС по методике патентных поверенных с поддержкой ИИ.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-right">
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Предварительный расчет</p>
            <p className="text-2xl font-black text-green-600">
              <FormattedPrice value={calculateLiveBaseline} currency={form.currency} />
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left: Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-50">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Данные об активе
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Объект из реестра
                    <Tooltip text="Выберите ваш патент или ТЗ из списка, чтобы привязать расчет к конкретному активу. Это позволит банку или инвестору видеть официальную связь." />
                  </label>
                  <select
                    className="w-full border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.ip_object_id || ""}
                    onChange={e => {
                      const id = e.target.value ? Number(e.target.value) : null;
                      const obj = ipObjects.find(x => x.id === id);
                      setForm(p => ({ ...p, ip_object_id: id, ip_type: obj ? obj.type : p.ip_type }));
                    }}
                  >
                    <option value="">-- Создать новый --</option>
                    {ipObjects.map(obj => (
                      <option key={obj.id} value={obj.id}>{obj.title} ({obj.type})</option>
                    ))}
                  </select>
                  {ipObjectsError && (
                    <p className="text-xs text-red-500 mt-1">{ipObjectsError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Тип объекта
                    <Tooltip text="Выберите юридическую категорию актива согласно классификации ГК РФ." />
                  </label>
                  <select
                    className="w-full border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.ip_type}
                    onChange={e => {
                      const type = e.target.value;
                      setForm(p => ({ ...p, ip_type: type, subtype: "", subtype_metrics: {} }));
                    }}
                    disabled={!!form.ip_object_id}
                  >
                    <optgroup label="📚 Результаты творческой деятельности">
                      <option value="literary_work">Произведения науки, литературы и искусства</option>
                      <option value="software">Программы для ЭВМ</option>
                      <option value="database">Базы данных</option>
                      <option value="performance">Исполнения</option>
                      <option value="phonogram">Фонограммы</option>
                      <option value="broadcast">Сообщения радио- и телепередач</option>
                    </optgroup>
                    <optgroup label="🏭 Объекты промышленной собственности">
                      <option value="invention">Изобретения</option>
                      <option value="utility_model">Полезные модели</option>
                      <option value="industrial_design">Промышленные образцы</option>
                      <option value="plant_variety">Селекционные достижения</option>
                      <option value="topology">Топологии интегральных микросхем</option>
                    </optgroup>
                    <optgroup label="🏷️ Средства индивидуализации">
                      <option value="trademark">Товарные знаки и знаки обслуживания</option>
                      <option value="trade_name">Фирменные наименования</option>
                      <option value="commercial_designation">Коммерческие обозначения</option>
                      <option value="geographical_indication">Географические указания и НМПТ</option>
                    </optgroup>
                    <optgroup label="🔐 Нетрадиционные объекты">
                      <option value="know_how">Секреты производства (ноу-хау)</option>
                    </optgroup>
                    <option value="other">Другое</option>
                  </select>
                </div>
              </div>

              {/* Subtype and Specific Metrics */}
              <div className="mt-8 border-t border-gray-50 pt-8">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Направленность / Категория
                      <Tooltip text="Выберите узкую специализацию вашего актива. Это позволит системе применить специфические метрики и дать более точные рекомендации." />
                    </label>
                    <select
                      className="w-full border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm"
                      value={form.subtype}
                      onChange={e => setForm(p => ({ ...p, subtype: e.target.value, subtype_metrics: {} }))}
                    >
                      <option value="">-- Выберите подкатегорию --</option>
                      {form.ip_type === 'literary_work' && (
                        <>
                          <option value="book">Книги и статьи · научные работы, художественная литература</option>
                          <option value="course">Образовательные курсы · методики обучения, учебные программы</option>
                          <option value="content">Медиа-контент · видео, подкасты, статьи</option>
                          <option value="music">Музыка · песни, композиции, саундтреки</option>
                          <option value="art">Искусство · картины, фотографии, скульптуры</option>
                          <option value="film">Фильмы и видео · кино, сериалы, анимация</option>
                        </>
                      )}
                      {form.ip_type === 'software' && (
                        <>
                          <option value="saas">SaaS · облачные сервисы, веб-платформы</option>
                          <option value="mobile">Мобильные приложения · iOS, Android</option>
                          <option value="enterprise">Корпоративный софт · ERP, CRM системы</option>
                          <option value="ai">AI и алгоритмы · машинное обучение, нейросети</option>
                          <option value="game">Игры · видеоигры, мобильные игры</option>
                        </>
                      )}
                      {form.ip_type === 'database' && (
                        <>
                          <option value="structured">Структурированные БД · каталоги, справочники</option>
                        </>
                      )}
                      {form.ip_type === 'performance' && (
                        <>
                          <option value="music_perform">Музыкальные исполнения · концерты, выступления</option>
                          <option value="theater">Театральные постановки · пьесы, спектакли</option>
                        </>
                      )}
                      {form.ip_type === 'invention' && (
                        <>
                          <option value="invention">Изобретение · новое техническое решение</option>
                          <option value="pharma">Фармацевтика · лекарства, химические соединения</option>
                          <option value="electronics">Электроника · устройства, компоненты</option>
                        </>
                      )}
                      {form.ip_type === 'trademark' && (
                        <>
                          <option value="product">Товарный бренд · логотипы, названия продуктов</option>
                          <option value="service">Бренд услуг · названия сервисов</option>
                          <option value="retail">Торговая сеть · магазины, рестораны</option>
                          <option value="personal">Персональный бренд · блогеры, эксперты</option>
                        </>
                      )}
                      {form.ip_type === 'trade_name' && (
                        <>
                          <option value="company">Наименование организации · ООО, АО, ИП</option>
                          <option value="holding">Наименование холдинга · группа компаний</option>
                          <option value="foreign">Иностранное наименование · транслитерация</option>
                        </>
                      )}
                      {form.ip_type === 'commercial_designation' && (
                        <>
                          <option value="shop">Обозначение магазина · вывески, индивидуализация торговой точки</option>
                          <option value="restaurant">Обозначение заведения · кафе, рестораны без регистрации ТЗ</option>
                          <option value="service_point">Обозначение точки услуг · салоны, мастерские</option>
                        </>
                      )}
                      {form.ip_type === 'geographical_indication' && (
                        <>
                          <option value="geo_product">Географическое указание · Тульский пряник, Гжель</option>
                          <option value="appellation">Наименование места происхождения товара (НМПТ) · Шампанское, Коньяк</option>
                        </>
                      )}
                      {form.ip_type === 'know_how' && (
                        <>
                          <option value="tech">Технические секреты · технологии производства, рецептуры</option>
                          <option value="business">Бизнес-секреты · методики управления, клиентская база</option>
                          <option value="data">Конфиденциальные данные · аналитика, исследования</option>
                        </>
                      )}
                      <option value="other">Другое</option>
                    </select>
                  </div>
                </div>

                {form.subtype && (
                  <div className="bg-green-50/30 p-6 rounded-2xl border border-green-100/50">
                    <h4 className="text-xs font-black text-green-600 uppercase tracking-widest mb-6">Специфические метрики ({form.subtype})</h4>
                    <div className="grid md:grid-cols-2 gap-x-10 gap-y-2">
                      {form.ip_type === 'literary_work' && (
                        <>
                          <Slider
                            label="Объем аудитории / Охват"
                            min={1} max={10}
                            value={form.subtype_metrics.audience || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, audience: v } }))}
                            tooltip="Количество потенциальных или реальных потребителей контента (подписчики, читатели, студенты)."
                          />
                          <Slider
                            label="Уникальность контента"
                            min={1} max={10}
                            value={form.subtype_metrics.uniqueness || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, uniqueness: v } }))}
                            tooltip="Насколько сложно воссоздать подобный контент без нарушения авторских прав. Эксклюзивность методики."
                          />
                          <Slider
                            label="Стоимость перепроизводства"
                            min={1} max={10}
                            value={form.subtype_metrics.production || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, production: v } }))}
                            tooltip="Сколько ресурсов (времени, денег) потребуется конкуренту, чтобы создать аналог с нуля."
                          />
                        </>
                      )}
                      {form.ip_type === 'software' && (
                        <>
                          <Slider
                            label="Сложность архитектуры / Кода"
                            min={1} max={10}
                            value={form.subtype_metrics.complexity || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, complexity: v } }))}
                            tooltip="Использование уникальных алгоритмов, AI, сложных интеграций или инновационной архитектуры."
                          />
                          <Slider
                            label="Масштабируемость"
                            min={1} max={10}
                            value={form.subtype_metrics.scalability || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, scalability: v } }))}
                            tooltip="Насколько легко система может обслуживать в 100 раз больше клиентов без полной переработки кода."
                          />
                          <Slider
                            label="Зрелость стека (отсутствие долга)"
                            min={1} max={10}
                            value={form.subtype_metrics.stack || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, stack: v } }))}
                            tooltip="Использование современных технологий и чистота кода, снижающая затраты на поддержку (Tech Debt)."
                          />
                        </>
                      )}
                      {form.ip_type === 'invention' && (
                        <>
                          <Slider
                            label="Наукоемкость (R&D глубина)"
                            min={1} max={10}
                            value={form.subtype_metrics.science || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, science: v } }))}
                            tooltip="Уровень инженерных или научных изысканий, стоявших за созданием технологии."
                          />
                          <Slider
                            label="Защита от обхода (Work-around)"
                            min={1} max={10}
                            value={form.subtype_metrics.bypass || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, bypass: v } }))}
                            tooltip="Насколько сложно конкурентам создать аналогичный продукт, не нарушая формулу вашего патента."
                          />
                          <Slider
                            label="Сложность реализации"
                            min={1} max={10}
                            value={form.subtype_metrics.implementation || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, implementation: v } }))}
                            tooltip="Требуются ли специальные производственные мощности или редкие компетенции для воплощения в жизнь."
                          />
                        </>
                      )}
                      {form.ip_type === 'trademark' && (
                        <>
                          <Slider
                            label="Узнаваемость бренда"
                            min={1} max={10}
                            value={form.subtype_metrics.awareness || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, awareness: v } }))}
                            tooltip="Процент целевой аудитории, который идентифицирует ваш бренд без подсказок."
                          />
                          <Slider
                            label="Лояльность аудитории (LTV)"
                            min={1} max={10}
                            value={form.subtype_metrics.loyalty || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, loyalty: v } }))}
                            tooltip="Готовность клиентов возвращаться к вашему бренду и рекомендовать его другим (Retention Rate)."
                          />
                          <Slider
                            label="География присутствия"
                            min={1} max={10}
                            value={form.subtype_metrics.geo || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, geo: v } }))}
                            tooltip="Распространенность бренда: от одного города до международного признания."
                          />
                        </>
                      )}
                      {form.ip_type === 'commercial_designation' && (
                        <>
                          <Slider
                            label="Фактическая узнаваемость"
                            min={1} max={10}
                            value={form.subtype_metrics.recognition || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, recognition: v } }))}
                            tooltip="Насколько потребители идентифицируют ваше заведение по обозначению (вывеска, оформление). Важно для незарегистрированных обозначений."
                          />
                          <Slider
                            label="Срок фактического использования"
                            min={1} max={10}
                            value={form.subtype_metrics.usage_duration || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, usage_duration: v } }))}
                            tooltip="Как долго обозначение используется в коммерческой деятельности. Длительное использование усиливает правовую защиту."
                          />
                          <Slider
                            label="Различительная способность"
                            min={1} max={10}
                            value={form.subtype_metrics.distinctiveness || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, distinctiveness: v } }))}
                            tooltip="Насколько уникально и оригинально обозначение. Описательные названия (например, 'Продукты') имеют слабую защиту."
                          />
                        </>
                      )}
                      {form.ip_type === 'know_how' && (
                        <>
                          <Slider
                            label="Степень конфиденциальности"
                            min={1} max={10}
                            value={form.subtype_metrics.confidentiality || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, confidentiality: v } }))}
                            tooltip="Насколько строго соблюдается режим коммерческой тайны (NDA с сотрудниками, ограничение доступа, маркировка документов)."
                          />
                          <Slider
                            label="Сложность воспроизведения"
                            min={1} max={10}
                            value={form.subtype_metrics.reproducibility || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, reproducibility: v } }))}
                            tooltip="Насколько сложно конкурентам воспроизвести технологию или методику, даже зная о ее существовании."
                          />
                          <Slider
                            label="Коммерческая ценность секрета"
                            min={1} max={10}
                            value={form.subtype_metrics.commercial_value || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, commercial_value: v } }))}
                            tooltip="Дает ли секрет конкурентное преимущество? Приводит ли к экономии затрат или увеличению прибыли?"
                          />
                        </>
                      )}
                      {form.ip_type === 'trade_name' && (
                        <>
                          <Slider
                            label="Срок устойчивого использования"
                            min={1} max={10}
                            value={form.subtype_metrics.usage_history || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, usage_history: v } }))}
                            tooltip="Длительность использования фирменного наименования. Длительное использование укрепляет деловую репутацию."
                          />
                          <Slider
                            label="Деловая репутация"
                            min={1} max={10}
                            value={form.subtype_metrics.reputation || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, reputation: v } }))}
                            tooltip="Узнаваемость и положительная репутация компании на рынке, связанная с фирменным наименованием."
                          />
                          <Slider
                            label="Правовая охрана"
                            min={1} max={10}
                            value={form.subtype_metrics.legal_protection || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, legal_protection: v } }))}
                            tooltip="Наличие регистрации в ЕГРЮЛ, отсутствие нарушений прав третьих лиц, охрана от недобросовестной конкуренции."
                          />
                        </>
                      )}
                      {form.ip_type === 'geographical_indication' && (
                        <>
                          <Slider
                            label="Уровень известности происхождения"
                            min={1} max={10}
                            value={form.subtype_metrics.origin_fame || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, origin_fame: v } }))}
                            tooltip="Насколько широко известно географическое происхождение товара (региональное, национальное, международное признание)."
                          />
                          <Slider
                            label="Объем производства"
                            min={1} max={10}
                            value={form.subtype_metrics.production_volume || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, production_volume: v } }))}
                            tooltip="Масштаб производства товара с географическим указанием. Влияет на коммерческую ценность обозначения."
                          />
                          <Slider
                            label="Уникальность свойств товара"
                            min={1} max={10}
                            value={form.subtype_metrics.uniqueness || 5}
                            onChange={v => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, uniqueness: v } }))}
                            tooltip="Особые качества товара, обусловленные географическими факторами (климат, почва, традиции производства)."
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 grid md:grid-cols-3 gap-6">
                {/* Годовой доход - для коммерческих объектов */}
                {!['performance', 'phonogram', 'broadcast'].includes(form.ip_type) && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {['literary_work', 'database'].includes(form.ip_type) ? 'Доход от продаж/лицензий (₽)' :
                        form.ip_type === 'software' ? 'Годовая выручка (₽)' :
                          ['trademark', 'trade_name', 'commercial_designation'].includes(form.ip_type) ? 'Доход от использования бренда (₽)' :
                            'Годовой доход (₽)'}
                      <Tooltip text={
                        ['literary_work', 'database'].includes(form.ip_type) ? 'Доход от продажи книг, курсов, лицензий или подписки на контент за год.' :
                          form.ip_type === 'software' ? 'Выручка от подписок, продаж лицензий или услуг за год (ARR/MRR).' :
                            ['trademark', 'trade_name'].includes(form.ip_type) ? 'Доход, который приносит бизнес под этим брендом/названием.' :
                              'Сколько денег этот актив приносит за год.'
                      } />
                    </label>
                    <input type="number" value={form.annual_revenue} onChange={e => bind("annual_revenue", Number(e.target.value))} className="w-full border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm" placeholder="0" />
                  </div>
                )}

                {/* Инвестиции/Затраты - релевантно почти для всех */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {['literary_work', 'database'].includes(form.ip_type) ? 'Затраты на создание (₽)' :
                      form.ip_type === 'software' ? 'Инвестиции в разработку (₽)' :
                        ['invention', 'utility_model', 'industrial_design'].includes(form.ip_type) ? 'Затраты на R&D и патентование (₽)' :
                          ['trademark', 'trade_name'].includes(form.ip_type) ? 'Затраты на создание и регистрацию (₽)' :
                            'Инвестиции (R&D) (₽)'}
                    <Tooltip text={
                      ['literary_work', 'database'].includes(form.ip_type) ? 'Затраты на написание, дизайн, редактуру, маркетинг.' :
                        form.ip_type === 'software' ? 'Зарплаты разработчиков, инфраструктура, тестирование.' :
                          ['invention', 'utility_model'].includes(form.ip_type) ? 'Научные исследования, прототипирование, патентные пошлины.' :
                            ['trademark', 'trade_name'].includes(form.ip_type) ? 'Разработка логотипа, айдентики, пошлины за регистрацию.' :
                              'Все затраты на создание и защиту актива.'
                    } />
                  </label>
                  <input type="number" value={form.cost_rd} onChange={e => bind("cost_rd", Number(e.target.value))} className="w-full border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm" placeholder="0" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Цель оценки
                    <Tooltip text="Рыночная — для продажи. Инвестиции — для привлечения капитала. Бухгалтерия — для баланса компании." />
                  </label>
                  <select className="w-full border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm" value={form.valuation_purpose} onChange={e => bind("valuation_purpose", e.target.value)}>
                    <option value="market">Рыночная</option>
                    <option value="liquidation">Ликвидационная</option>
                    <option value="investment">Инвестиции</option>
                    <option value="accounting">Бухгалтерия</option>
                  </select>
                </div>

                {/* Отрасль - для коммерческих объектов */}
                {!['performance', 'phonogram', 'broadcast', 'plant_variety'].includes(form.ip_type) && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {['literary_work', 'database'].includes(form.ip_type) ? 'Сфера применения' : 'Отрасль бизнеса'}
                      <Tooltip text="Влияет на мультипликаторы оценки. IT оценивается выше производства." />
                    </label>
                    <select className="w-full border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm" value={form.industry} onChange={e => bind("industry", e.target.value)}>
                      <option value="it">IT / ПО</option>
                      <option value="retail">Ритейл / Торговля</option>
                      <option value="manufacturing">Производство</option>
                      <option value="services">Услуги / Консалтинг</option>
                      <option value="finance">Финансы / Финтех</option>
                      <option value="healthcare">Медицина / HealthTech</option>
                      {['literary_work', 'database'].includes(form.ip_type) && <option value="education">Образование</option>}
                      {['literary_work', 'database'].includes(form.ip_type) && <option value="media">Медиа / Развлечения</option>}
                      <option value="other">Другое</option>
                    </select>
                  </div>
                )}

                {/* Рынок сбыта */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {['literary_work', 'database'].includes(form.ip_type) ? 'География аудитории' :
                      ['performance', 'phonogram', 'broadcast'].includes(form.ip_type) ? 'География распространения' :
                        'Рынок сбыта'}
                    <Tooltip text="Где работает/распространяется ваш актив. Глобальный охват увеличивает стоимость." />
                  </label>
                  <select className="w-full border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm" value={form.market_reach} onChange={e => bind("market_reach", e.target.value)}>
                    <option value="local">Локальный (Город/Регион)</option>
                    <option value="national">Национальный (РФ)</option>
                    <option value="global">Мировой (Global)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-50">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.040L3 20c0 5.523 4.477 10 10 10s10-4.477 10-10l-.382-14.016z" /></svg>
                Профессиональные факторы
              </h3>

              <div className="grid md:grid-cols-2 gap-10">
                <div>
                  <Slider
                    label={
                      ['literary_work', 'software', 'database'].includes(form.ip_type) ? 'Срок охраны авторских прав (лет)' :
                        ['invention', 'utility_model'].includes(form.ip_type) ? 'Срок действия патента (лет)' :
                          ['trademark', 'trade_name'].includes(form.ip_type) ? 'Срок регистрации (лет)' :
                            'Оставшийся срок действия (лет)'
                    }
                    value={form.remaining_years} min={1} max={
                      ['literary_work', 'software', 'database', 'performance', 'phonogram', 'broadcast'].includes(form.ip_type) ? 70 : 20
                    }
                    onChange={(v: any) => bind("remaining_years", v)}
                    tooltip={
                      ['literary_work', 'software', 'database'].includes(form.ip_type) ? 'Авторское право действует 70 лет после смерти автора.' :
                        ['invention', 'utility_model'].includes(form.ip_type) ? 'Патент действует 20 лет с даты подачи заявки.' :
                          ['trademark', 'trade_name'].includes(form.ip_type) ? 'Товарный знак регистрируется на 10 лет с возможностью продления.' :
                            'Сколько лет актив будет приносить доход или действовать до истечения.'
                    }
                  />

                  {/* Сила бренда - для брендов и коммерческих активов */}
                  {!['performance', 'phonogram', 'broadcast', 'plant_variety', 'topology'].includes(form.ip_type) && (
                    <Slider
                      label={
                        ['trademark', 'trade_name', 'commercial_designation'].includes(form.ip_type) ? 'Сила бренда' :
                          ['literary_work', 'database'].includes(form.ip_type) ? 'Известность и репутация' :
                            form.ip_type === 'software' ? 'Позиция на рынке' :
                              ['invention', 'utility_model'].includes(form.ip_type) ? 'Коммерческий потенциал' :
                                'Сила бренда'
                      }
                      value={form.brand_strength} min={1} max={10}
                      onChange={(v: any) => bind("brand_strength", v)}
                      tooltip={
                        ['trademark', 'trade_name'].includes(form.ip_type) ? '1-3: Новый бренд. 4-6: Есть постоянные клиенты. 7-10: Лидер рынка, массовое признание.' :
                          ['literary_work', 'database'].includes(form.ip_type) ? '1-3: Малоизвестен. 4-6: Есть аудитория и отзывы. 7-10: Бестселлер, широкая известность.' :
                            form.ip_type === 'software' ? '1-3: Запуск. 4-6: Устойчивая клиентская база. 7-10: Рыночный лидер.' :
                              ['invention', 'utility_model'].includes(form.ip_type) ? 'Насколько изобретение востребовано рынком и приносит деньги.' :
                                'Узнаваемость и ценность актива на рынке.'
                      }
                    />
                  )}

                  {/* Роялти - для лицензируемых активов */}
                  {!['performance', 'phonogram', 'broadcast', 'plant_variety'].includes(form.ip_type) && (
                    <Slider
                      label={
                        ['literary_work', 'database'].includes(form.ip_type) ? 'Авторские отчисления (%)' :
                          form.ip_type === 'software' ? 'Ставка лицензирования (%)' :
                            'Ставка роялти (%)'
                      }
                      value={form.royalty_rate} min={0} max={20} step={0.5}
                      onChange={(v: any) => bind("royalty_rate", v)} suffix="%"
                      tooltip={
                        ['literary_work', 'database'].includes(form.ip_type) ? 'Обычно 5-15% от цены книги или 10-25% от лицензионных доходов издательства.' :
                          form.ip_type === 'software' ? 'Комиссия за использование вашего ПО. SaaS: 10-30%, Enterprise: 3-15%.' :
                            ['invention', 'utility_model'].includes(form.ip_type) ? 'Сколько платят за лицензию на технологию. Обычно 3-10% от выручки.' :
                              'Сколько другие готовы платить за использование актива. Обычно 3-10%.'
                      }
                    />
                  )}

                  <Slider
                    label={
                      ['literary_work', 'database'].includes(form.ip_type) ? 'Уникальность контента' :
                        form.ip_type === 'software' ? 'Технологическая уникальность' :
                          ['invention', 'utility_model'].includes(form.ip_type) ? 'Патентная защита' :
                            ['trademark', 'trade_name'].includes(form.ip_type) ? 'Различительная способность' :
                              'Широта защиты'
                    }
                    value={form.scope_protection} min={1} max={10}
                    onChange={(v: any) => bind("scope_protection", v)}
                    tooltip={
                      ['literary_work', 'database'].includes(form.ip_type) ? 'Насколько уникален ваш контент? Сложно ли создать аналог?' :
                        form.ip_type === 'software' ? 'Сложность копирования функционала. Есть ли уникальные алгоритмы?' :
                          ['invention', 'utility_model'].includes(form.ip_type) ? 'Насколько широко защищена технология? Сложно ли обойти патент?' :
                            ['trademark', 'trade_name'].includes(form.ip_type) ? 'Насколько оригинален бренд? Легко ли спутать с конкурентами?' :
                              'Насколько сложно конкурентам скопировать ваш актив.'
                    }
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700 mb-4 items-center">
                    Юридическая надежность
                    <Tooltip text="Официальные подтверждения того, что ваш актив — настоящий, защищен государством и его нельзя просто так отобрать." />
                  </label>
                  {[
                    { k: "examination", l: "Пройдена экспертиза по существу", t: "Патент проверен Роспатентом на новизну (не просто формальность)." },
                    { k: "defense", l: "Есть опыт защиты в судах", t: "Активы, прошедшие через суды и устоявшие, стоят в 2-3 раза дороже." },
                    { k: "maintenance", l: "Оплачены пошлины / акт. статус", t: "Подтверждает, что правообладатель следит за активом и он действителен." },
                    { k: "international", l: "Международная регистрация", t: "Возможность масштабировать бизнес на другие страны (Мадридская система, РСТ)." }
                  ].map(x => (
                    <label key={x.k} className="group flex items-center gap-3 p-3 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-green-50 hover:border-green-100 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.legal_robustness.includes(x.k)}
                        onChange={() => toggleRobustness(x.k)}
                        className="w-5 h-5 rounded text-green-500 focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700 flex-1">{x.l}</span>
                      <Tooltip text={x.t} />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results / Finalize */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-8 rounded-3xl text-white shadow-xl shadow-green-200 relative overflow-hidden">
              {/* Animated transparent fox integration */}
              <div className="relative z-10">
                <div className="bg-white/10 p-4 rounded-full w-24 h-24 mb-4 flex items-center justify-center backdrop-blur-sm shadow-inner relative group">
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20"></div>
                  <img src="/fox.png" alt="Fox" className="w-20 h-20 drop-shadow-2xl rounded-full animate-bounce-slow transition-transform group-hover:scale-110" style={{ mixBlendMode: 'multiply', filter: 'contrast(1.2)' }} />
                </div>
                <h3 className="text-xl font-bold mb-2">Лисёнок-Помощник 🦊</h3>
                <p className="text-green-50 text-sm leading-relaxed mb-6">
                  Я переведу ваши параметры на язык денег и подготовлю отчет, который поймет любой банк или инвестор.
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-white text-green-600 font-black py-4 rounded-2xl hover:bg-green-50 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Анализирую..." : "Сформировать отчет"}
                </button>
                {error && <div className="mt-4 text-xs bg-red-800/40 p-3 rounded-xl border border-white/10 text-white font-medium">{error}</div>}
              </div>
              {/* Background decorations */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {res && (
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-in zoom-in-95 duration-300">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Итоговая оценка</p>
                <p className="text-3xl font-black text-green-600 mb-4">
                  <FormattedPrice value={res.final_value} currency={res.currency} />
                </p>
                <div className="space-y-2 border-t pt-4">
                  <button
                    onClick={() => handleOpenFile(`${API_URL}/api/valuation/report/${res.pdf_url.split("/").pop()}`, "Заключение_об_оценке.pdf")}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white text-green-700 text-sm font-black hover:bg-green-50 transition-all shadow-md active:scale-95 w-full"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Скачать полное заключение (PDF)
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed AI Analysis Block */}
        {res && (
          <div className="grid md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Методология и факторы
              </h4>
              <p className="text-sm text-gray-600 italic mb-6 leading-relaxed bg-gray-50 p-4 rounded-2xl">
                "{res.multiples_used.methodology}"
              </p>
              <ul className="space-y-3">
                {res.multiples_used.ai_bullets.map((b, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="text-green-500 font-bold">•</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Стратегия капитализации
              </h4>
              <div className="space-y-4">
                {res.multiples_used.strategic_recommendations.map((r, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-green-50/50 border border-green-100">
                    <span className="text-2xl">{r.icon}</span>
                    <span className="text-sm font-medium text-green-900">{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
      <style jsx>{`
        .animate-in { animation: var(--tw-duration, 500ms) ease-out; }
        .fade-in { from { opacity: 0; } to { opacity: 1; } }
        .slide-in-from-bottom-8 { from { transform: translateY(2rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .zoom-in-95 { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </DashboardLayout >
  );
}
