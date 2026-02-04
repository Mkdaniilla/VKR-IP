"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import FormattedPrice from "../../components/FormattedPrice";
import CustomSelect from "../../components/CustomSelect";
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

const Tooltip = ({ text }: { text: string }) => {
  const [show, setShow] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = React.useCallback(() => {
    if (triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipElement = tooltipRef.current;

      let tw = 260;
      let th = 80;

      if (tooltipElement) {
        tw = tooltipElement.offsetWidth;
        th = tooltipElement.offsetHeight;
      }

      let left = triggerRect.left + (triggerRect.width / 2) - (tw / 2);
      let top = triggerRect.top - th - 12;

      if (top < 10) {
        top = triggerRect.bottom + 12;
      }

      const padding = 12;
      if (left < padding) {
        left = padding;
      } else if (left + tw > window.innerWidth - padding) {
        left = window.innerWidth - tw - padding;
      }

      setPosition({ top, left });
    }
  }, []);

  React.useEffect(() => {
    if (show) {
      updatePosition();
      const timer = setTimeout(updatePosition, 16);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [show, updatePosition]);

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className="fixed z-[999999] pointer-events-none animate-in fade-in zoom-in-95 duration-300 ease-out"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: 'max-content',
        maxWidth: '260px'
      }}
    >
      <div className="relative bg-slate-900/98 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-4 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_30px_rgba(34,211,238,0.15)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-50"></div>
        <p className="relative z-10 text-[11px] font-bold text-slate-100 leading-relaxed whitespace-normal text-center">
          {text}
        </p>
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-cyan-500/30 rotate-45"
        style={{
          top: position.top > (triggerRef.current?.getBoundingClientRect().top || 0) ? '-6px' : 'auto',
          bottom: position.top < (triggerRef.current?.getBoundingClientRect().top || 0) ? '-6px' : 'auto',
          display: position.top === 0 ? 'none' : 'block'
        }}
      />
    </div>
  );

  return (
    <div
      ref={triggerRef}
      className="group relative inline-flex items-center ml-auto cursor-help flex-shrink-0"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className="bg-white/5 text-white/30 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black group-hover:bg-cyan-500 group-hover:text-white transition-all border border-white/10 flex-shrink-0 hover:scale-125 hover:rotate-12 shadow-sm group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]">
        ?
      </div>
      {show && mounted && typeof document !== 'undefined' &&
        require('react-dom').createPortal(tooltipContent, document.body)
      }
    </div>
  );
};

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

  const Slider = ({ label, value, min, max, step = 1, onChange, suffix = "", tooltip }: any) => (
    <div className="mb-6 group/slider">
      <div className="flex justify-between mb-2 items-center gap-2">
        <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.1em] flex items-center gap-2 flex-1 leading-none group-hover/slider:text-white/60 transition-colors">
          <span className="truncate">{label}</span>
          {tooltip && <Tooltip text={tooltip} />}
        </label>
        <span className="text-[11px] font-black text-cyan-400 bg-cyan-400/10 px-2.5 py-0.5 rounded-lg border border-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.05)] whitespace-nowrap flex-shrink-0 min-w-[32px] text-center">
          {value}{suffix}
        </span>
      </div>
      <div className="relative h-2 flex items-center">
        <div className="absolute inset-0 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all duration-300"
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          />
        </div>
        <input
          title={label}
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer z-10 accent-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-cyan-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.5)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
        />
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in zoom-in duration-700 mb-20">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-6">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-6">
              <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-400 to-blue-500 tracking-tighter uppercase">
                Капитализация 2.0
              </h1>
            </div>
            <p className="text-white/40 mt-3 font-bold uppercase tracking-[0.3em] text-[10px]">Оценка ИС на базе ИИ и патентной экспертизы</p>
          </div>
          <div className="glass-card p-6 rounded-[2rem] border-white/5 text-center md:text-right min-w-[280px] shadow-2xl relative overflow-visible group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-[10px] uppercase tracking-widest font-black text-white/20 mb-2 relative z-10">Прогноз стоимости (Live)</p>
            <p className="text-4xl font-black text-white relative z-10">
              <FormattedPrice value={calculateLiveBaseline} currency={form.currency} />
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">

          {/* Left: Settings */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-12 rounded-[2.5rem] border-white/5 relative overflow-visible min-h-[600px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>

              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-4 relative z-10">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                Параметры актива
              </h3>

              <div className="grid md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-3">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 leading-none">
                    Объект из реестра
                    <Tooltip text="Выберите ваш патент или ТЗ из списка, чтобы привязать расчет к конкретному активу." />
                  </label>
                  <CustomSelect
                    value={form.ip_object_id}
                    onChange={v => {
                      const id = v ? Number(v) : null;
                      const obj = ipObjects.find(x => x.id === id);
                      setForm(p => ({ ...p, ip_object_id: id, ip_type: obj ? obj.type : p.ip_type }));
                    }}
                    placeholder="-- Создать новый --"
                    options={ipObjects.map(obj => ({ value: obj.id, label: obj.title }))}
                  />
                  {ipObjectsError && (
                    <p className="text-[10px] text-rose-400 font-bold mt-2">{ipObjectsError}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 leading-none">
                    Тип объекта
                    <Tooltip text="Выберите юридическую категорию актива согласно классификации ГК РФ." />
                  </label>
                  <CustomSelect
                    disabled={!!form.ip_object_id}
                    value={form.ip_type}
                    onChange={v => setForm(p => ({ ...p, ip_type: v, subtype: "", subtype_metrics: {} }))}
                    options={[
                      {
                        label: "📚 Результаты творчества",
                        options: [
                          { value: "literary_work", label: "Произведения" },
                          { value: "software", label: "Программы для ЭВМ" },
                          { value: "database", label: "Базы данных" },
                        ]
                      },
                      {
                        label: "🏭 Промышленная собственность",
                        options: [
                          { value: "invention", label: "Изобретения" },
                          { value: "utility_model", label: "Модели" },
                          { value: "industrial_design", label: "Дизайн" },
                        ]
                      },
                      {
                        label: "🏷️ Бренды",
                        options: [
                          { value: "trademark", label: "Товарные знаки" },
                          { value: "trade_name", label: "Фирменные наименования" },
                        ]
                      },
                      {
                        label: "🔐 Ноу-хау",
                        options: [
                          { value: "know_how", label: "Секреты производства" },
                        ]
                      }
                    ]}
                  />
                </div>
              </div>

              {/* Subtype and Specific Metrics */}
              <div className="mt-10 border-t border-white/5 pt-10">
                <div className="grid md:grid-cols-2 gap-8 mb-10">
                  <div className="space-y-3">
                    <label className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 leading-none">
                      Специализация
                      <Tooltip text="Выберите узкую специализацию вашего актива. Это позволит системе применить специфические метрики." />
                    </label>
                    <CustomSelect
                      value={form.subtype}
                      onChange={v => setForm(p => ({ ...p, subtype: v, subtype_metrics: {} }))}
                      placeholder="-- Подкатегория --"
                      options={[
                        ...(form.ip_type === 'literary_work' ? [
                          { value: "book", label: "Книги и статьи" },
                          { value: "course", label: "Образовательные курсы" },
                          { value: "content", label: "Медиа-контент" },
                          { value: "music", label: "Музыка" },
                          { value: "film", label: "Фильмы и видео" },
                        ] : []),
                        ...(form.ip_type === 'software' ? [
                          { value: "saas", label: "SaaS / Web" },
                          { value: "mobile", label: "Mobile Apps" },
                          { value: "enterprise", label: "Enterprise Software" },
                          { value: "ai", label: "AI / Algorithms" },
                          { value: "game", label: "Games" },
                        ] : []),
                        ...(form.ip_type === 'invention' ? [
                          { value: "pharma", label: "Фармацевтика" },
                          { value: "electronics", label: "Электроника" },
                          { value: "mech", label: "Машиностроение" },
                        ] : []),
                        ...(form.ip_type === 'utility_model' ? [
                          { value: "instrum", label: "Инструменты и приспособления" },
                          { value: "device", label: "Устройства и механизмы" },
                          { value: "component", label: "Детали и компоненты" },
                        ] : []),
                        ...(form.ip_type === 'trademark' ? [
                          { value: "product", label: "Товарный бренд" },
                          { value: "service", label: "Бренд услуг" },
                          { value: "personal", label: "Персональный бренд" },
                        ] : []),
                        ...(form.ip_type === 'database' ? [
                          { value: "users", label: "Клиентские базы" },
                          { value: "financial", label: "Финансовые данные" },
                          { value: "science", label: "Научные данные" },
                          { value: "marketing", label: "Маркетинговая аналитика" },
                        ] : []),
                        ...(form.ip_type === 'industrial_design' ? [
                          { value: "exterior", label: "Промышленный дизайн" },
                          { value: "interior", label: "Интерьерные решения" },
                          { value: "package", label: "Упаковка и этикетка" },
                        ] : []),
                        ...(form.ip_type === 'trade_name' ? [
                          { value: "holding", label: "Холдинговые структуры" },
                          { value: "retail_chain", label: "Торговые сети" },
                          { value: "service_corp", label: "Сервисные корпорации" },
                        ] : []),
                        ...(form.ip_type === 'know_how' ? [
                          { value: "tech_process", label: "Технологический процесс" },
                          { value: "client_base", label: "Клиентская база" },
                          { value: "marketing_strategy", label: "Стратегия развития" },
                        ] : []),
                        { value: "other", label: "Другое" }
                      ]}
                    />
                  </div>
                </div>

                {form.subtype && (
                  <div className="bg-cyan-400/5 p-6 rounded-[2rem] border border-cyan-400/20 relative overflow-visible">
                    <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-3">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                      Интеллектуальные метрики ({form.subtype})
                    </h4>
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 relative z-10">
                      {/* Books & Articles */}
                      {form.subtype === 'book' && (
                        <>
                          <Slider
                            label="Тираж / Продажи"
                            value={form.subtype_metrics.circulation || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, circulation: v } }))}
                            tooltip="Объем продаж: 1 = менее 1000 экз., 10 = более 100 000 экз."
                          />
                          <Slider
                            label="Лит. ценность"
                            value={form.subtype_metrics.literary_value || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, literary_value: v } }))}
                            tooltip="Признание критиков, награды, цитируемость"
                          />
                          <Slider
                            label="Адаптация"
                            value={form.subtype_metrics.adaptation_potential || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, adaptation_potential: v } }))}
                            tooltip="Возможность экранизации, перевода, производных работ"
                          />
                        </>
                      )}

                      {/* Educational Courses */}
                      {form.subtype === 'course' && (
                        <>
                          <Slider
                            label="Студенты"
                            value={form.subtype_metrics.students || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, students: v } }))}
                            tooltip="1 = менее 100, 10 = более 10 000 студентов"
                          />
                          <Slider
                            label="Рейтинг курса"
                            value={form.subtype_metrics.rating || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, rating: v } }))}
                            tooltip="Средняя оценка и отзывы пользователей"
                          />
                          <Slider
                            label="Актуальность"
                            value={form.subtype_metrics.content_freshness || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, content_freshness: v } }))}
                            tooltip="Насколько материал соответствует текущим трендам"
                          />
                        </>
                      )}

                      {/* Media Content */}
                      {form.subtype === 'content' && (
                        <>
                          <Slider
                            label="Охват"
                            value={form.subtype_metrics.audience_reach || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, audience_reach: v } }))}
                            tooltip="Размер и вовлеченность целевой аудитории"
                          />
                          <Slider
                            label="Вирусность"
                            value={form.subtype_metrics.viral_potential || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, viral_potential: v } }))}
                            tooltip="Способность контента к органическому распространению"
                          />
                          <Slider
                            label="Монетизация"
                            value={form.subtype_metrics.monetization || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, monetization: v } }))}
                            tooltip="Эффективность текущих каналов монетизации"
                          />
                        </>
                      )}

                      {/* Music */}
                      {form.subtype === 'music' && (
                        <>
                          <Slider
                            label="Стриминг"
                            value={form.subtype_metrics.streams || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, streams: v } }))}
                            tooltip="Количество прослушиваний на платформах"
                          />
                          <Slider
                            label="Потенциал"
                            value={form.subtype_metrics.commercial_use || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, commercial_use: v } }))}
                            tooltip="Использование в рекламе, кино, играх"
                          />
                          <Slider
                            label="Узнаваемость"
                            value={form.subtype_metrics.recognition || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, recognition: v } }))}
                            tooltip="Популярность исполнителя и произведения"
                          />
                        </>
                      )}

                      {/* Films & Video */}
                      {form.subtype === 'film' && (
                        <>
                          <Slider
                            label="Сборы"
                            value={form.subtype_metrics.box_office || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, box_office: v } }))}
                            tooltip="Коммерческий успех в прокате"
                          />
                          <Slider
                            label="Критики"
                            value={form.subtype_metrics.critical_acclaim || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, critical_acclaim: v } }))}
                            tooltip="Оценки критиков, награды, фестивали"
                          />
                          <Slider
                            label="Лицензии"
                            value={form.subtype_metrics.licensing || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, licensing: v } }))}
                            tooltip="Возможность продажи прав на показ, ремейки"
                          />
                        </>
                      )}

                      {/* SaaS / Web */}
                      {form.subtype === 'saas' && (
                        <>
                          <Slider
                            label="MRR / ARR"
                            value={form.subtype_metrics.mrr || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, mrr: v } }))}
                            tooltip="Месячный/годовой регулярный доход"
                          />
                          <Slider
                            label="Churn Rate"
                            value={form.subtype_metrics.churn || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, churn: v } }))}
                            tooltip="Удержание клиентов (10 = низкий отток)"
                          />
                          <Slider
                            label="Масштаб-ть"
                            value={form.subtype_metrics.scalability || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, scalability: v } }))}
                            tooltip="Способность обслуживать рост без пропорционального увеличения затрат"
                          />
                          <Slider
                            label="Техдолг"
                            value={form.subtype_metrics.tech_debt || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, tech_debt: v } }))}
                            tooltip="Качество кода и архитектуры (10 = отличное)"
                          />
                        </>
                      )}

                      {/* Mobile Apps */}
                      {form.subtype === 'mobile' && (
                        <>
                          <Slider
                            label="Загрузки"
                            value={form.subtype_metrics.downloads || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, downloads: v } }))}
                            tooltip="Общее количество установок"
                          />
                          <Slider
                            label="DAU / MAU"
                            value={form.subtype_metrics.dau_mau || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, dau_mau: v } }))}
                            tooltip="Активность пользователей (Daily/Monthly)"
                          />
                          <Slider
                            label="Рейтинг"
                            value={form.subtype_metrics.store_rating || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, store_rating: v } }))}
                            tooltip="Средняя оценка в App Store / Google Play"
                          />
                          <Slider
                            label="Монетизация"
                            value={form.subtype_metrics.monetization || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, monetization: v } }))}
                            tooltip="Эффективность модели монетизации"
                          />
                        </>
                      )}

                      {/* Enterprise Software */}
                      {form.subtype === 'enterprise' && (
                        <>
                          <Slider
                            label="Клиенты"
                            value={form.subtype_metrics.clients || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, clients: v } }))}
                            tooltip="Количество корпоративных клиентов"
                          />
                          <Slider
                            label="Чек"
                            value={form.subtype_metrics.avg_deal || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, avg_deal: v } }))}
                            tooltip="Размер среднего контракта"
                          />
                          <Slider
                            label="Интеграции"
                            value={form.subtype_metrics.integrations || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, integrations: v } }))}
                            tooltip="Количество и качество интеграций с другими системами"
                          />
                          <Slider
                            label="Vendor Lock-in"
                            value={form.subtype_metrics.lock_in || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, lock_in: v } }))}
                            tooltip="Сложность миграции клиентов на конкурентов"
                          />
                        </>
                      )}

                      {/* AI / Algorithms */}
                      {form.subtype === 'ai' && (
                        <>
                          <Slider
                            label="Точность"
                            value={form.subtype_metrics.accuracy || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, accuracy: v } }))}
                            tooltip="Качество предсказаний / результатов"
                          />
                          <Slider
                            label="Уникальность"
                            value={form.subtype_metrics.uniqueness || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, uniqueness: v } }))}
                            tooltip="Инновационность и патентоспособность"
                          />
                          <Slider
                            label="Данные"
                            value={form.subtype_metrics.data_volume || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, data_volume: v } }))}
                            tooltip="Размер и качество обучающего датасета"
                          />
                          <Slider
                            label="Применимость"
                            value={form.subtype_metrics.applicability || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, applicability: v } }))}
                            tooltip="Широта возможных применений"
                          />
                        </>
                      )}

                      {/* Games */}
                      {form.subtype === 'game' && (
                        <>
                          <Slider
                            label="Игроки"
                            value={form.subtype_metrics.players || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, players: v } }))}
                            tooltip="Количество активных игроков"
                          />
                          <Slider
                            label="Retention"
                            value={form.subtype_metrics.retention || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, retention: v } }))}
                            tooltip="Удержание игроков (Day 1, 7, 30)"
                          />
                          <Slider
                            label="ARPU"
                            value={form.subtype_metrics.arpu || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, arpu: v } }))}
                            tooltip="Средний доход на пользователя"
                          />
                          <Slider
                            label="IP потенциал"
                            value={form.subtype_metrics.ip_potential || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, ip_potential: v } }))}
                            tooltip="Возможность франшизы, мерча, адаптаций"
                          />
                        </>
                      )}

                      {/* Pharma */}
                      {form.subtype === 'pharma' && (
                        <>
                          <Slider
                            label="Стадия"
                            value={form.subtype_metrics.development_stage || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, development_stage: v } }))}
                            tooltip="1 = идея, 5 = клинические испытания, 10 = одобрено"
                          />
                          <Slider
                            label="Рынок"
                            value={form.subtype_metrics.market_size || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, market_size: v } }))}
                            tooltip="Потенциальный объем целевого рынка"
                          />
                          <Slider
                            label="Эффективность"
                            value={form.subtype_metrics.efficacy || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, efficacy: v } }))}
                            tooltip="Клиническая эффективность препарата"
                          />
                          <Slider
                            label="Защита"
                            value={form.subtype_metrics.patent_strength || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, patent_strength: v } }))}
                            tooltip="Надежность патентного портфеля"
                          />
                        </>
                      )}

                      {/* Electronics */}
                      {form.subtype === 'electronics' && (
                        <>
                          <Slider
                            label="Инновации"
                            value={form.subtype_metrics.innovation || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, innovation: v } }))}
                            tooltip="Степень технологического прорыва"
                          />
                          <Slider
                            label="Готовность произв."
                            value={form.subtype_metrics.manufacturability || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, manufacturability: v } }))}
                            tooltip="Готовность к массовому производству"
                          />
                          <Slider
                            label="Конкурентность"
                            value={form.subtype_metrics.competitive_edge || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, competitive_edge: v } }))}
                            tooltip="Превосходство над аналогами"
                          />
                        </>
                      )}

                      {/* Databases */}
                      {form.ip_type === 'database' && (
                        <>
                          <Slider
                            label="Уникальность"
                            value={form.subtype_metrics.data_uniqueness || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, data_uniqueness: v } }))}
                            tooltip="Наличие данных, которые невозможно получить из открытых источников"
                          />
                          <Slider
                            label="Объем данных"
                            value={form.subtype_metrics.data_volume || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, data_volume: v } }))}
                            tooltip="Количество записей и полнота информации"
                          />
                          <Slider
                            label="Полезность"
                            value={form.subtype_metrics.data_utility || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, data_utility: v } }))}
                            tooltip="Экономический эффект от использования данных"
                          />
                          <Slider
                            label="Актуальность"
                            value={form.subtype_metrics.data_freshness || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, data_freshness: v } }))}
                            tooltip="Частота обновления и достоверность текущих данных"
                          />
                        </>
                      )}

                      {/* Utility Models */}
                      {form.ip_type === 'utility_model' && (
                        <>
                          <Slider
                            label="Новизна"
                            value={form.subtype_metrics.novelty_level || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, novelty_level: v } }))}
                            tooltip="Степень отличия решения от известных аналогов"
                          />
                          <Slider
                            label="Применимость"
                            value={form.subtype_metrics.practical_use || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, practical_use: v } }))}
                            tooltip="Простота внедрения в реальное производство"
                          />
                          <Slider
                            label="Защищенность"
                            value={form.subtype_metrics.bypass_difficulty || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, bypass_difficulty: v } }))}
                            tooltip="Насколько сложно конкурентам обойти данный патент"
                          />
                        </>
                      )}

                      {/* Industrial Design */}
                      {form.ip_type === 'industrial_design' && (
                        <>
                          <Slider
                            label="Эстетика"
                            value={form.subtype_metrics.aesthetic_appeal || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, aesthetic_appeal: v } }))}
                            tooltip="Визуальное превосходство и современность дизайна"
                          />
                          <Slider
                            label="Узнаваемость"
                            value={form.subtype_metrics.distinctiveness || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, distinctiveness: v } }))}
                            tooltip="Насколько легко потребитель идентифицирует продукт по форме"
                          />
                          <Slider
                            label="Эргономика"
                            value={form.subtype_metrics.ergonomics || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, ergonomics: v } }))}
                            tooltip="Удобство использования и функциональность дизайна"
                          />
                        </>
                      )}

                      {/* Trade Name */}
                      {form.ip_type === 'trade_name' && (
                        <>
                          <Slider
                            label="Репутация"
                            value={form.subtype_metrics.reputation || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, reputation: v } }))}
                            tooltip="Уровень доверия к наименованию со стороны рынка"
                          />
                          <Slider
                            label="Устойчивость"
                            value={form.subtype_metrics.market_stability || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, market_stability: v } }))}
                            tooltip="Стабильность компании и срок присутствия на рынке"
                          />
                          <Slider
                            label="Стоимость связей"
                            value={form.subtype_metrics.network_value || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, network_value: v } }))}
                            tooltip="Ценность наработанных связей и партнерств под этим именем"
                          />
                        </>
                      )}

                      {/* Know-how */}
                      {form.ip_type === 'know_how' && (
                        <>
                          <Slider
                            label="Ценность"
                            value={form.subtype_metrics.economic_value || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, economic_value: v } }))}
                            tooltip="Экономическое преимущество перед конкурентами, не владеющими секретом"
                          />
                          <Slider
                            label="Секретность"
                            value={form.subtype_metrics.secrecy_level || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, secrecy_level: v } }))}
                            tooltip="Надежность режима коммерческой тайны и сложность обратного инжиниринга"
                          />
                          <Slider
                            label="Срок пользы"
                            value={form.subtype_metrics.useful_life || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, useful_life: v } }))}
                            tooltip="Как долго секрет будет сохранять свою актуальность"
                          />
                        </>
                      )}

                      {/* Mechanical Engineering */}
                      {form.subtype === 'mech' && (
                        <>
                          <Slider
                            label="Сложность"
                            value={form.subtype_metrics.complexity || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, complexity: v } }))}
                            tooltip="Сложность воспроизведения конкурентами"
                          />
                          <Slider
                            label="Применимость"
                            value={form.subtype_metrics.applicability || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, applicability: v } }))}
                            tooltip="Широта возможных применений"
                          />
                          <Slider
                            label="Экономия"
                            value={form.subtype_metrics.resource_saving || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, resource_saving: v } }))}
                            tooltip="Снижение затрат при использовании"
                          />
                        </>
                      )}

                      {/* Product Brand */}
                      {form.subtype === 'product' && (
                        <>
                          <Slider
                            label="Узнав-ть"
                            value={form.subtype_metrics.brand_awareness || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, brand_awareness: v } }))}
                            tooltip="Спонтанное знание бренда целевой аудиторией"
                          />
                          <Slider
                            label="Лояльность клиентов"
                            value={form.subtype_metrics.customer_loyalty || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, customer_loyalty: v } }))}
                            tooltip="NPS и повторные покупки"
                          />
                          <Slider
                            label="Премиальность"
                            value={form.subtype_metrics.premium || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, premium: v } }))}
                            tooltip="Способность устанавливать цены выше рынка"
                          />
                        </>
                      )}

                      {/* Service Brand */}
                      {form.subtype === 'service' && (
                        <>
                          <Slider
                            label="Репутация"
                            value={form.subtype_metrics.reputation || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, reputation: v } }))}
                            tooltip="Отзывы и рейтинги на платформах"
                          />
                          <Slider
                            label="Качество"
                            value={form.subtype_metrics.service_quality || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, service_quality: v } }))}
                            tooltip="Стабильность и уровень обслуживания"
                          />
                          <Slider
                            label="Дифференц."
                            value={form.subtype_metrics.differentiation || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, differentiation: v } }))}
                            tooltip="Уникальность предложения на рынке"
                          />
                        </>
                      )}

                      {/* Personal Brand */}
                      {form.subtype === 'personal' && (
                        <>
                          <Slider
                            label="Аудитория"
                            value={form.subtype_metrics.audience || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, audience: v } }))}
                            tooltip="Размер и вовлеченность подписчиков"
                          />
                          <Slider
                            label="Влияние"
                            value={form.subtype_metrics.influence || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, influence: v } }))}
                            tooltip="Способность влиять на решения аудитории"
                          />
                          <Slider
                            label="Потенциал"
                            value={form.subtype_metrics.commercial_potential || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, commercial_potential: v } }))}
                            tooltip="Монетизация через рекламу, продукты, услуги"
                          />
                        </>
                      )}

                      {/* Other / Generic */}
                      {form.subtype === 'other' && (
                        <>
                          <Slider
                            label="Уникальность"
                            value={form.subtype_metrics.uniqueness || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, uniqueness: v } }))}
                            tooltip="Степень инновационности и отличия от аналогов"
                          />
                          <Slider
                            label="Потенциал"
                            value={form.subtype_metrics.commercial_potential || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, commercial_potential: v } }))}
                            tooltip="Возможность монетизации и рыночный спрос"
                          />
                          <Slider
                            label="Защищенность"
                            value={form.subtype_metrics.protection || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, protection: v } }))}
                            tooltip="Сложность копирования и юридическая защита"
                          />
                          <Slider
                            label="Примен-ть"
                            value={form.subtype_metrics.market_fit || 5}
                            min={1} max={10}
                            onChange={(v: number) => setForm(p => ({ ...p, subtype_metrics: { ...p.subtype_metrics, market_fit: v } }))}
                            tooltip="Соответствие потребностям рынка"
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 grid md:grid-cols-3 gap-8">
                {/* Годовой доход - для коммерческих объектов */}
                {!['performance', 'phonogram', 'broadcast'].includes(form.ip_type) && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 leading-none">
                      {['literary_work', 'database'].includes(form.ip_type) ? 'Доход от продаж (₽)' :
                        form.ip_type === 'software' ? 'Годовая выручка (₽)' :
                          ['trademark', 'trade_name', 'commercial_designation'].includes(form.ip_type) ? 'Доход от бренда (₽)' :
                            'Годовой доход (₽)'}
                      <Tooltip text="Укажите среднегодовую выручку за последние 1-3 года." />
                    </label>
                    <input
                      type="number"
                      value={form.annual_revenue}
                      onChange={e => bind("annual_revenue", Number(e.target.value))}
                      className="glass-input font-bold text-sm h-[58px] w-full"
                      placeholder="0"
                    />
                  </div>
                )}

                {/* Инвестиции/Затраты */}
                <div className="space-y-3">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 leading-none">
                    {['literary_work', 'database'].includes(form.ip_type) ? 'Затраты на создание (₽)' :
                      form.ip_type === 'software' ? 'Инвестиции в R&D (₽)' :
                        ['invention', 'utility_model', 'industrial_design'].includes(form.ip_type) ? 'Затраты на патентование (₽)' :
                          ['trademark', 'trade_name'].includes(form.ip_type) ? 'Затраты на регистрацию (₽)' :
                            'Всего инвестиций (₽)'}
                    <Tooltip text="Полная себестоимость создания актива." />
                  </label>
                  <input
                    type="number"
                    value={form.cost_rd}
                    onChange={e => bind("cost_rd", Number(e.target.value))}
                    className="glass-input font-bold text-sm h-[58px] w-full"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 leading-none">
                    Цель оценки
                    <Tooltip text="Рыночная — для продажи. Инвестиции — для привлечения капитала." />
                  </label>
                  <CustomSelect
                    value={form.valuation_purpose}
                    onChange={v => bind("valuation_purpose", v)}
                    options={[
                      { value: "market", label: "Рыночная" },
                      { value: "liquidation", label: "Ликвидационная" },
                      { value: "investment", label: "Инвестиции" },
                      { value: "accounting", label: "Бухгалтерия" },
                    ]}
                  />
                </div>

                {/* Отрасль - для коммерческих объектов */}
                {!['performance', 'phonogram', 'broadcast', 'plant_variety'].includes(form.ip_type) && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 leading-none">
                      {['literary_work', 'database'].includes(form.ip_type) ? 'Сфера применения' : 'Отрасль бизнеса'}
                      <Tooltip text="Влияет на мультипликаторы оценки. IT оценивается выше производства." />
                    </label>
                    <CustomSelect
                      value={form.industry}
                      onChange={v => bind("industry", v)}
                      options={[
                        { value: "it", label: "IT / ПО" },
                        { value: "retail", label: "Ритейл / Торговля" },
                        { value: "manufacturing", label: "Производство" },
                        { value: "services", label: "Услуги / Консалтинг" },
                        { value: "finance", label: "Финансы / Финтех" },
                        { value: "healthcare", label: "Медицина / HealthTech" },
                        ...((['literary_work', 'database'].includes(form.ip_type)) ? [
                          { value: "education", label: "Образование" },
                          { value: "media", label: "Медиа / Развлечения" }
                        ] : []),
                        { value: "other", label: "Другое" },
                      ]}
                    />
                  </div>
                )}

                {/* Рынок сбыта */}
                <div className="space-y-3">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 leading-none">
                    Рынок сбыта
                    <Tooltip text="Где работает ваш актив. Глобальный охват увеличивает стоимость." />
                  </label>
                  <CustomSelect
                    value={form.market_reach}
                    onChange={v => bind("market_reach", v)}
                    options={[
                      { value: "local", label: "Локальный (Город)" },
                      { value: "national", label: "Национальный (РФ)" },
                      { value: "global", label: "Мировой (Global)" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Separator / Spacing */}
            <div className="h-12" />

            <div className="glass-card p-10 rounded-[2.5rem] border-white/5 relative overflow-visible">
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -ml-20 -mt-20 pointer-events-none"></div>

              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-4 relative z-10">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                Профессиональные факторы
              </h3>

              <div className="grid md:grid-cols-2 gap-x-12 relative z-10">
                <div>
                  <Slider
                    label={
                      ['literary_work', 'software', 'database'].includes(form.ip_type) ? 'Срок охраны (лет)' :
                        ['invention', 'utility_model'].includes(form.ip_type) ? 'Срок жизни' :
                          'Оставшийся срок (лет)'
                    }
                    value={form.remaining_years} min={1} max={
                      ['literary_work', 'software', 'database', 'performance', 'phonogram', 'broadcast'].includes(form.ip_type) ? 70 : 20
                    }
                    onChange={(v: any) => bind("remaining_years", v)}
                    tooltip="Сколько лет актив будет приносить доход."
                  />

                  {/* Сила бренда */}
                  {!['performance', 'phonogram', 'broadcast', 'plant_variety', 'topology'].includes(form.ip_type) && (
                    <Slider
                      label={
                        ['trademark', 'trade_name', 'commercial_designation'].includes(form.ip_type) ? 'Сила бренда' :
                          form.ip_type === 'software' ? 'Узнаваемость на рынке' :
                            'Известность актива'
                      }
                      value={form.brand_strength} min={1} max={10}
                      onChange={(v: any) => bind("brand_strength", v)}
                      tooltip="Узнаваемость и доверие клиентов."
                    />
                  )}

                  {/* Роялти */}
                  {!['performance', 'phonogram', 'broadcast', 'plant_variety'].includes(form.ip_type) && (
                    <Slider
                      label="Ставка роялти (%)"
                      value={form.royalty_rate} min={0} max={20} step={0.5}
                      onChange={(v: any) => bind("royalty_rate", v)} suffix="%"
                      tooltip="Среднерыночная ставка за использование подобного актива."
                    />
                  )}

                  <Slider
                    label="Защита ИС"
                    value={form.scope_protection} min={1} max={10}
                    onChange={(v: any) => bind("scope_protection", v)}
                    tooltip="Насколько сложно конкурентам обойти ваши права юридически."
                  />
                </div>
                <div className="space-y-6">
                  <label className="flex items-center gap-1 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
                    Юридическая надежность
                    <Tooltip text="Факторы, подтверждающие стабильность патентной защиты и снижающие риски для инвесторов." />
                  </label>
                  {[
                    { k: "examination", l: "Экспертиза", t: "Патент проверен на мировую новизну и изобретательский уровень." },
                    { k: "defense", l: "Суд. практика", t: "Наличие успешных кейсов защиты прав в судах." },
                    { k: "maintenance", l: "Активный статус", t: "Все пошлины уплачены, правовая охрана действительна." },
                    { k: "international", l: "Глоб. охрана", t: "Регистрация по международным системам (PCT, Мадрид)." }
                  ].map(x => (
                    <label key={x.k} className="group flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={form.legal_robustness.includes(x.k)}
                          onChange={() => toggleRobustness(x.k)}
                          className="w-6 h-6 rounded-xl border-white/10 bg-black/40 text-cyan-500 focus:ring-cyan-500 transition-all hover:border-cyan-500/50 appearance-none border checked:bg-cyan-500"
                        />
                        {form.legal_robustness.includes(x.k) && (
                          <svg className="w-4 h-4 text-white absolute left-1 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-[11px] font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">{x.l}</span>
                      </div>
                      <Tooltip text={x.t} />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results / Finalize */}
          <div className="space-y-8">
            <div className="glass-card p-10 rounded-[2.5rem] border-white/5 relative overflow-visible shadow-2xl group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none group-hover:bg-cyan-500/20 transition-all"></div>

              <div className="relative z-10 flex flex-col items-center md:items-start">
                <div className="rounded-3xl w-24 h-24 mb-6 flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden group">
                  <img src="/matryoshka_icon.png" alt="Matryoshka AI" className="w-full h-full object-cover animate-float" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Матрешка AI</h3>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8 text-center md:text-left">
                  Я проанализирую параметры и сформирую отчет по международным стандартам оценки.
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="glass-button-primary w-full py-5 text-[10px] font-black uppercase tracking-[0.2em]"
                >
                  {loading ? "Анализирую..." : "Запустить расчет"}
                </button>
                {error && <div className="mt-6 text-[10px] bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 text-rose-400 font-bold uppercase tracking-widest">{error}</div>}
              </div>
            </div>

            {res && (
              <div className="glass-card p-8 rounded-[2.5rem] border border-cyan-500/30 bg-cyan-500/5 animate-in zoom-in-95 duration-700 relative overflow-visible group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-[10px] uppercase font-black text-white/30 tracking-[0.2em] mb-2 relative z-10">Рыночная оценка</p>
                <p className="text-4xl font-black text-white mb-6 relative z-10 tracking-tighter">
                  <FormattedPrice value={res.final_value} currency={res.currency} />
                </p>
                <div className="pt-6 border-t border-white/10 relative z-10">
                  <button
                    onClick={() => handleOpenFile(`${API_URL}/api/valuation/report/${res.pdf_url.split("/").pop()}`, "Заключение_об_оценке.pdf")}
                    className="w-full py-4 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 hover:text-white transition-colors"
                  >
                    Открыть полный PDF →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed AI Analysis Block */}
        {res && (
          <div className="grid md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-500 relative z-10">
            <div className="glass-card p-10 rounded-[2.5rem] border-white/5 hover:border-white/10 transition-all shadow-2xl backdrop-blur-3xl">
              <h4 className="font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                Методология и факторы
              </h4>
              <p className="text-sm text-white/50 italic mb-8 leading-relaxed bg-white/5 p-6 rounded-[1.5rem] border border-white/5 font-medium">
                "{res.multiples_used.methodology}"
              </p>
              <ul className="space-y-4">
                {res.multiples_used.ai_bullets.map((b, i) => (
                  <li key={i} className="flex gap-4 text-sm text-white/70">
                    <span className="text-cyan-400 font-black">•</span>
                    <span className="font-medium">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-10 rounded-[2.5rem] border-white/5 hover:border-white/10 transition-all shadow-2xl backdrop-blur-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[60px] -mr-20 -mt-20"></div>
              <h4 className="font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                Стратегия капитализации
              </h4>
              <div className="space-y-4 relative z-10">
                {res.multiples_used.strategic_recommendations.map((r, i) => (
                  <div key={i} className="flex items-center gap-6 p-6 rounded-[2rem] bg-white/5 border border-white/5 group/rec hover:bg-white/10 transition-all">
                    <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover/rec:scale-110 transition-transform">{r.icon}</span>
                    <span className="text-sm font-black text-white/80 uppercase tracking-tight leading-snug">{r.text}</span>
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
