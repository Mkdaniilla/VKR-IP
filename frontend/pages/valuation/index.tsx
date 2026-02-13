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
  IPType,
  ValuationPayload,
  getProtectedFileUrl,
  getApiUrl,
} from "../../lib/api";

import AssetHealthRadar from "../../components/AssetHealthRadar";
import WaterfallChart from "../../components/WaterfallChart";
import { AlertTriangle, Zap, Download, ChevronRight } from "lucide-react";

const API_URL = getApiUrl();

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
        ip_type: type ? (String(type) as IPType) : p.ip_type,
        ip_object_id: objectId ? Number(objectId) : p.ip_object_id,
      }));
    }

    async function fetchObjects() {
      try {
        const data = await getIPObjects();
        setIpObjects(data);
        setIpObjectsError(null);
      } catch (e) {
        setIpObjectsError("Ошибка при загрузке объектов");
      }
    }
    fetchObjects();
  }, [router.query]); // Depend on query to handle subsequent navigation or initial load

  // Базовый онлайн-расчет (лайв-коэффициент) в режиме реального времени
  const calculateLiveBaseline = useMemo(() => {
    // Профессиональная модель DCF для превью
    // Стоимость = Сумма (Выгода / (1 + r)^t)
    const riskPremium = 0.15; // базовая премия за риск ИС
    const discountRate = 0.12 + riskPremium;
    const annualBenefit = (form.annual_revenue * (form.royalty_rate / 100));

    let npv = 0;
    for (let t = 1; t <= form.remaining_years; t++) {
      npv += annualBenefit / Math.pow(1 + discountRate, t);
    }

    const costBasis = form.cost_rd * 1.4; // Затратный подход с учетом прибыли

    // Синтез: если есть выручка - DCF доминирует (85%)
    let base = form.annual_revenue > 0 ? (npv * 0.85 + costBasis * 0.15) : costBasis;

    // Специфические метрики подтипов (1-10)
    const metricsImpact = Object.values(form.subtype_metrics).reduce((sum: number, val: number) => sum + (Number(val) - 5), 0);
    const multiplier = 1 + (metricsImpact * 0.05);

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
    if (form.remaining_years <= 0) { setError("Срок прогноза должен быть больше 0"); return; }
    if (form.annual_revenue === 0 && form.cost_rd === 0) {
      setError("Для профессиональной оценки необходимы финансовые показатели (доход или инвестиции).");
      return;
    }

    setLoading(true);
    setRes(null);
    setError(null);

    try {
      const token = getToken();
      const r = await fetch("/api/valuation/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Ошибка сервера");
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
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">

        {/* Header: Professional Look */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 pt-10">
          <div className="text-center md:text-left space-y-4">
            <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-400 to-blue-500 tracking-tighter uppercase leading-[0.9]">
              Valuation Suite <span className="text-white/20">2.0</span>
            </h1>
            <p className="text-white/40 font-black uppercase tracking-[0.4em] text-[11px] max-w-lg">
              Профессиональный анализ НМА по стандартам экспертной оценки <span className="text-cyan-500/60">(DCF & Relief from Royalty)</span>
            </p>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 text-center md:text-right min-w-[320px] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-50"></div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 mb-2 relative z-10">Прогноз NPV (Live Preview)</p>
            <p className="text-5xl font-black text-white relative z-10 tracking-tighter">
              <FormattedPrice value={calculateLiveBaseline} currency={form.currency} />
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-10">

            {/* 1. Industry & Assets */}
            <div className="glass-card p-12 rounded-[3rem] border-white/5 relative overflow-hidden bg-slate-900/10">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-4">
                <span className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse"></span>
                Идентификация актива
              </h3>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="md:col-span-2 space-y-4 pb-6 border-b border-white/5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    Связанный объект из портфеля <Tooltip text="Выберите объект, чтобы загрузить его базовые данные." />
                  </label>
                  <CustomSelect
                    value={form.ip_object_id || ""}
                    onChange={v => bind("ip_object_id", v ? Number(v) : null)}
                    options={[
                      { label: "✨ Новый актив (без привязки)", value: "" },
                      ...ipObjects.map(obj => ({
                        label: `${obj.title} (${obj.type})`,
                        value: obj.id.toString()
                      }))
                    ]}
                  />
                  {ipObjectsError && <p className="text-[9px] text-rose-400 font-bold uppercase tracking-tighter">{ipObjectsError}</p>}
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    Тип объекта <Tooltip text="Юридическая категория актива согласно ГК РФ." />
                  </label>
                  <CustomSelect
                    value={form.ip_type}
                    onChange={v => bind("ip_type", v)}
                    options={[
                      { label: "📚 Авторское право", value: "literary_work" },
                      { label: "💻 Софт / Алгоритмы", value: "software" },
                      { label: "🛡️ Товарные знаки", value: "trademark" },
                      { label: "⚙️ Изобретения (Патент)", value: "invention" },
                      { label: "🔐 Ноу-хау", value: "know_how" },
                    ]}
                  />
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    Отраслевой бенчмарк <Tooltip text="Влияет на среднюю ставку роялти и темпы роста." />
                  </label>
                  <CustomSelect
                    value={form.industry}
                    onChange={v => bind("industry", v)}
                    options={[
                      { value: "it", label: "IT / Технологии" },
                      { value: "pharma", label: "Фармацевтика / Химия" },
                      { value: "manufacturing", label: "Производство" },
                      { value: "media", label: "Медиа / Контент" },
                      { value: "services", label: "Профуслуги" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* 2. Financial & Market (The Core) */}
            <div className="glass-card p-12 rounded-[3rem] border-white/5 space-y-12">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                Финансовая модель (DCF Input)
              </h3>

              <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
                <Slider
                  label="Годовая выручка (Attributed)"
                  value={form.annual_revenue}
                  min={0} max={100000000} step={100000}
                  onChange={(v: number) => bind("annual_revenue", v)}
                  suffix=" ₽"
                  tooltip="Часть выручки компании, которую приносит именно этот актив."
                />
                <Slider
                  label="Ставка роялти (Relief rate)"
                  value={form.royalty_rate}
                  min={0} max={25} step={0.5}
                  onChange={(v: number) => bind("royalty_rate", v)}
                  suffix="%"
                  tooltip="Сколько бы вы платили за аренду такого актива, если бы он вам не принадлежал."
                />
                <Slider
                  label="Срок прогноза (Horizon)"
                  value={form.remaining_years}
                  min={1} max={20}
                  onChange={(v: number) => bind("remaining_years", v)}
                  suffix=" л."
                  tooltip="Горизонт планирования денежных потоков."
                />
                <Slider
                  label="Инвестиции (Cost base)"
                  value={form.cost_rd}
                  min={0} max={50000000} step={100000}
                  onChange={(v: number) => bind("cost_rd", v)}
                  suffix=" ₽"
                  tooltip="Все затраты на создание и регистрацию актива."
                />
              </div>

              {/* Legal Checklist */}
              <div className="pt-10 border-t border-white/5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-8 block">Юридический Due Diligence (Ликвидность)</label>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { id: "defense", label: "Судебная броня", d: "Наличие практики защиты в судах" },
                    { id: "examination", label: "Гос. экспертиза", d: "Провадирована чистота объекта" },
                    { id: "maintenance", label: "Active Status", d: "Поддержание прав в силе" },
                    { id: "international", label: "Global Scope", d: "Заявки PCT / WIPO / Madrid" }
                  ].map(x => (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => toggleRobustness(x.id)}
                      className={`flex flex-col p-6 rounded-[2rem] border transition-all duration-300 text-left ${form.legal_robustness.includes(x.id)
                        ? "bg-blue-500/10 border-blue-500/50 shadow-lg"
                        : "bg-white/5 border-white/5 hover:border-white/10"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${form.legal_robustness.includes(x.id) ? "text-blue-400" : "text-white/40"}`}>{x.label}</span>
                        <div className={`w-2 h-2 rounded-full ${form.legal_robustness.includes(x.id) ? "bg-blue-400 animate-pulse" : "bg-white/10"}`}></div>
                      </div>
                      <p className="text-[10px] text-white/20 font-bold leading-tight">{x.d}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results / Finalize */}
          <div className="space-y-8">
            <div className="glass-card p-10 rounded-[2.5rem] border-white/5 relative overflow-visible shadow-2xl group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none group-hover:bg-cyan-500/20 transition-all"></div>

              <div className="relative z-10 flex flex-col items-center md:items-start text-left">
                <div className="flex items-center gap-4 mb-6">
                  <div className="rounded-2xl w-16 h-16 flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden bg-[#0f172a]">
                    <img src="/matryoshka_icon.png" alt="Matryoshka AI" className="w-full h-full object-cover animate-float" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Матрешка AI</h3>
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-black text-cyan-400 uppercase tracking-widest">
                      <Zap className="w-2 h-2 fill-current" />
                      Powered Analysis
                    </div>
                  </div>
                </div>

                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">
                  Я проанализирую параметры и сформирую отчет по международным стандартам оценки IVSC.
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="glass-button-primary w-full py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Анализирую данные...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
                      Запустить расчет
                    </>
                  )}
                </button>
                {error && (
                  <div className="mt-6 text-[10px] bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 text-rose-400 font-bold uppercase tracking-widest flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            </div>

            {res && (
              <div className="glass-card p-8 rounded-[2.5rem] border border-cyan-500/30 bg-cyan-500/5 animate-in zoom-in-95 duration-700 relative overflow-visible group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <p className="text-4xl font-black text-white tracking-tighter">
                    <FormattedPrice value={res.final_value} currency={res.currency} />
                  </p>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">RADR (Risk)</span>
                    <span className="text-sm font-black text-rose-400">{res.risk_discount.toFixed(1)}%</span>
                  </div>
                </div>
                <WaterfallChart
                  baseline={res.baseline_value}
                  adjustment={res.ai_adjustment}
                  final={res.final_value}
                  currency={res.currency}
                />
                <div className="pt-6 border-t border-white/10 relative z-10 mt-6">
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
              <AssetHealthRadar metrics={form.subtype_metrics} />
              <p className="text-sm text-white/50 italic my-8 leading-relaxed bg-white/5 p-6 rounded-[1.5rem] border border-white/5 font-medium">
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
