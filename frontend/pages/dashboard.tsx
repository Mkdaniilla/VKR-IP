import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import CustomSelect from "@/components/CustomSelect";
import {
  getIPObjects,
  getCounterparties,
  generateDocument,
  getUpcomingDeadlines,
  Deadline
} from "@/lib/api";
import FormattedPrice from "@/components/FormattedPrice";
import PortfolioChart from "@/components/PortfolioChart";
import ValueBarChart from "@/components/ValueBarChart";
import { IPType, IP_TYPES_RU } from "@/lib/api";
import {
  Gem,
  Handshake,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Code2,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  Plus,
  FileEdit,
  Scale,
  Lock,
  Download,
  Search
} from "lucide-react";

type IPObject = {
  id: number;
  title: string;
  type: IPType;
  status: string;
  estimated_value?: number | null;
  registration_date?: string | null;
};

type Counterparty = {
  id: number;
  name: string;
  contact_person?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalValue: 0,
    assetsCount: 0,
    activeLicensees: 0,
  });
  const [recentAssets, setRecentAssets] = useState<IPObject[]>([]);
  const [partnerList, setPartnerList] = useState<Counterparty[]>([]);
  const [allAssets, setAllAssets] = useState<IPObject[]>([]);
  const [allCounterparties, setAllCounterparties] = useState<Counterparty[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);

  // Document generation modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("pretension");
  const [selectedIPId, setSelectedIPId] = useState<number | null>(null);
  const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<number | null>(null);
  const [generatingDoc, setGeneratingDoc] = useState(false);

  // Local state for widgets
  const [valRevenue, setValRevenue] = useState(5000000); // 5M default
  const [valBrand, setValBrand] = useState(5);
  const [valType, setValType] = useState<IPType>("software");
  const [estimatedWidgetValue, setEstimatedWidgetValue] = useState(12500000);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Multipliers aligned with backend/industry (approx)
    const BASE_MULTIPLES: Record<string, number> = {
      trademark: 1.75,
      software: 3.5,
      patent: 2.75,
      copyright: 1.4,
      design: 1.3
    };

    const mult = BASE_MULTIPLES[valType || 'software'] || 1.75;
    const brandFactor = 0.6 + (valBrand * 0.08); // 5/10 -> 1.0 factor
    setEstimatedWidgetValue(valRevenue * mult * brandFactor);
  }, [valRevenue, valBrand, valType]);

  async function loadData() {
    try {
      const [assets, partners, deadlines] = await Promise.all([
        getIPObjects(),
        getCounterparties(),
        getUpcomingDeadlines(90), // Fetch for next 3 months
      ]);

      // Store full lists
      setAllAssets(assets);
      setAllCounterparties(partners);

      // Calculate stats
      const totalVal = assets.reduce((sum: number, item: any) => sum + (item.estimated_value || 0), 0);

      setStats({
        totalValue: totalVal,
        assetsCount: assets.length,
        activeLicensees: partners.length, // rough proxy
      });

      setRecentAssets(assets.slice(0, 5));
      setPartnerList(partners.slice(0, 5));
      setUpcomingDeadlines(deadlines);
    } catch (e) {
      console.error("Dashboard load error", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateDocument() {
    if (!selectedIPId || !selectedCounterpartyId) {
      alert("Пожалуйста, выберите IP-объект и контрагента");
      return;
    }

    try {
      setGeneratingDoc(true);
      const blob = await generateDocument(selectedTemplate, selectedIPId, selectedCounterpartyId);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTemplate}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setShowDocModal(false);
      setSelectedIPId(null);
      setSelectedCounterpartyId(null);
      setSelectedTemplate("pretension");
    } catch (e: any) {
      alert(e?.message || "Ошибка генерации документа");
    } finally {
      setGeneratingDoc(false);
    }
  }

  const foxChatMock = [
    { role: 'ai', text: 'Привет! Я проанализировал ваш портфель. У вас 3 заявки на регистрации требуют внимания.' },
    { role: 'user', text: 'Подготовь отчет по ним.' },
  ];

  if (loading) return <DashboardLayout><div className="p-10 text-center">Загрузка дашборда...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in zoom-in duration-1000">

        {/* HEADER & PORTFOLIO STATUS */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <div className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                    Статус портфеля
                  </h1>
                  <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">Интеллектуальный мониторинг активов 2.0</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Общая стоимость</p>
                    <div className="text-4xl font-mono font-bold text-white">
                      <FormattedPrice value={stats.totalValue} />
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center border border-white/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Stats Widgets Grid */}
              <div className="grid md:grid-cols-3 gap-6 mt-10">
                {[
                  { label: "Всего активов", value: stats.assetsCount, color: "from-cyan-500 to-blue-600", icon: Gem, data: [30, 45, 35, 60, 55, 70] },
                  { label: "Контрагенты", value: stats.activeLicensees, color: "from-emerald-500 to-teal-600", icon: Handshake, data: [20, 30, 25, 40, 35, 50] },
                  { label: "Средняя ценность", value: Math.round(stats.totalValue / (stats.assetsCount || 1)), isPrice: true, color: "from-violet-500 to-purple-600", icon: Zap, data: [40, 50, 45, 65, 60, 80] }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded-3xl p-6 border border-white/5 hover:bg-white/10 transition group/stat relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <stat.icon className={`w-6 h-6 text-white/40 group-hover/stat:text-white transition-colors`} />
                      <div className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                        <span>▲</span> 12%
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {stat.isPrice ? <FormattedPrice value={stat.value} currency="₽" /> : stat.value}
                    </div>

                    {/* Tiny Area Chart (SVG) */}
                    <div className="mt-4 h-12 w-full">
                      <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={stat.color.split(' ')[0].replace('from-', '')} stopOpacity="0.4" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d={`M0,40 ${stat.data.map((d, idx) => `L${(idx * 100) / (stat.data.length - 1)},${40 - d}`).join(' ')} L100,40 Z`}
                          fill={`url(#grad-${i})`}
                        />
                        <path
                          d={stat.data.map((d, idx) => `${idx === 0 ? 'M' : 'L'}${(idx * 100) / (stat.data.length - 1)},${40 - d}`).join(' ')}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-white/20"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Top Column */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* Risk Dynamics Mini-Widget */}
            <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between border-white/5 relative overflow-hidden flex-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>

              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Риски и сроки</h3>
                <Link href="/deadlines" className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>

              <div className="space-y-6 relative z-10">
                {upcomingDeadlines.length > 0 ? (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 group cursor-pointer hover:bg-rose-500/20 transition">
                    <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse">
                      <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-rose-400 uppercase tracking-tight">Критическая дата</div>
                      <div className="text-[11px] text-white/80 font-bold">{new Date(upcomingDeadlines[0].due_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 transition">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-tight">Все в порядке</div>
                      <div className="text-[11px] text-white/80 font-bold">Срочных дел нет</div>
                    </div>
                  </div>
                )}

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black text-white">94%</div>
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-0.5">Портфель Health</div>
                  </div>
                  <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[94%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION - TWO COLUMNS */}
        <div className="grid grid-cols-12 gap-10">

          {/* Main List Section */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            {/* Recent Assets List */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-4">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                  Оперативный реестр
                </h3>
                <Link href="/ip-objects" className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-xl border border-white/5 hover:bg-cyan-400/20 transition uppercase tracking-widest">Перейти в реестр</Link>
              </div>

              <div className="grid md:grid-cols-1 gap-4">
                {recentAssets.map((asset) => {
                  const Icon = asset.type === 'software' ? Code2 : asset.type === 'trademark' ? ShieldCheck : FileText;
                  return (
                    <div key={asset.id} className="glass-card hover:bg-white/10 transition-all p-5 rounded-3xl flex items-center gap-6 group border-white/5 cursor-pointer">
                      <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center bg-gradient-to-br ${asset.type === 'software' ? 'from-emerald-500 to-teal-600 shadow-[0_0_20px_rgba(16,185,129,0.2)]' :
                        asset.type === 'trademark' ? 'from-blue-500 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.2)]' :
                          'from-purple-500 to-pink-600 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                        } border border-white/10 text-white`}>
                        <Icon className="w-7 h-7" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{asset.title}</div>
                        <div className="text-xs font-bold text-white/40 uppercase tracking-widest mt-0.5">{IP_TYPES_RU[asset.type]}</div>
                      </div>
                      <div className="hidden md:block text-right">
                        <div className="text-sm font-bold font-mono text-white"><FormattedPrice value={asset.estimated_value || 0} /></div>
                        <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">Оценочная стоимость</div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${asset.status === 'registered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                        {asset.status === 'registered' ? 'Активен' : asset.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2-Column Operations Row */}
            <div className="grid grid-cols-12 gap-8 items-stretch">
              {/* Column 1: Counterparties */}
              <div className="col-span-12 xl:col-span-8 space-y-6">
                <div className="flex justify-between items-center px-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    Контрагенты
                  </h3>
                  <Link href="/counterparties" className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20 hover:bg-emerald-400/20 transition uppercase tracking-widest">Все партнеры</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {partnerList.slice(0, 4).map((p, i) => (
                    <div key={p.id} className="glass-card hover:bg-white/10 transition-all p-6 rounded-[2rem] border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-[20px] -mr-12 -mt-12 transition group-hover:bg-cyan-500/10"></div>
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-[1.25rem] flex-shrink-0 flex items-center justify-center text-white font-black text-lg bg-gradient-to-br ${['from-cyan-500 to-blue-600', 'from-purple-500 to-pink-600', 'from-orange-500 to-rose-600', 'from-emerald-500 to-teal-600'][i % 4]
                          } shadow-lg border border-white/20 transition-transform group-hover:scale-105 duration-500`}>
                          {p.name.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-sm font-bold text-white mb-0.5 uppercase tracking-tight group-hover:text-cyan-400 transition-colors truncate">{p.name}</div>
                          <div className="text-[9px] font-bold text-white/30 truncate uppercase tracking-widest">{p.contact_person || "Контрагент"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {partnerList.length === 0 && (
                    <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl text-[10px] text-white/20 font-bold uppercase col-span-full">Список пуст</div>
                  )}
                </div>
              </div>

              {/* Column 2: Document Management */}
              <div className="col-span-12 xl:col-span-4">
                <div className="glass-card rounded-[2.5rem] p-8 border-white/5 relative overflow-hidden group h-full flex flex-col justify-between">
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-[40px] -mr-16 -mb-16"></div>

                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.8)]"></span>
                      Документооборот
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { id: 'dogovor', label: 'Договор', icon: FileEdit },
                      { id: 'pretension', label: 'Претензия', icon: AlertTriangle }
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => { setSelectedTemplate(item.id); setShowDocModal(true); }}
                        className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3 group/btn"
                      >
                        <item.icon className="w-6 h-6 text-white/20 group-hover/btn:text-white transition-all transform group-hover/btn:scale-110" />
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowDocModal(true)}
                    className="w-full glass-button-primary !py-4 shadow-[0_20px_40px_rgba(34,211,238,0.25)] flex items-center justify-center gap-3"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Создать документ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Sidebar Widgets (Restoring necessary content) */}
          <div className="col-span-12 lg:col-span-4 space-y-10">
            {/* Capitalization Widget Refined */}
            <div className="glass-card rounded-[2.5rem] p-8 border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                  Капитализация
                </h3>
              </div>

              {/* Enhanced Interactive Chart */}
              <div className="relative flex justify-center mb-10 pt-4">
                {(() => {
                  const breakdown = allAssets.reduce((acc: Record<string, number>, a) => {
                    const t = String(a.type);
                    acc[t] = (acc[t] || 0) + (a.estimated_value || 0);
                    return acc;
                  }, {});

                  const colors: Record<string, string> = {
                    software: '#10b981',
                    trademark: '#3b82f6',
                    patent: '#f59e0b',
                    copyright: '#8b5cf6',
                    design: '#ec4899',
                    invention: '#f59e0b',
                    literary_work: '#8b5cf6'
                  };

                  const chartData = Object.keys(breakdown).map(type => ({
                    name: IP_TYPES_RU[type as IPType] || type,
                    value: breakdown[type],
                    color: colors[type] || '#cbd5e1'
                  })).filter(d => d.value > 0);

                  if (chartData.length === 0) {
                    return (
                      <div className="h-40 flex items-center justify-center text-white/20 text-[10px] font-black uppercase tracking-widest">
                        Нет данных
                      </div>
                    );
                  }

                  return (
                    <div className="relative w-full h-48">
                      <PortfolioChart data={chartData} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none pb-[20px]">
                        <div className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">ИТОГО</div>
                        <div className="text-xl font-black font-mono text-white leading-none mt-1">
                          <FormattedPrice value={stats.totalValue} currency="" />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-3">
                {(() => {
                  const breakdown = allAssets.reduce((acc: Record<string, number>, a) => {
                    const t = String(a.type);
                    acc[t] = (acc[t] || 0) + (a.estimated_value || 0);
                    return acc;
                  }, {});
                  const types = Object.keys(breakdown).sort((a, b) => (breakdown[b] || 0) - (breakdown[a] || 0)).slice(0, 3);
                  const typeColors: Record<string, string> = {
                    software: 'bg-emerald-500',
                    trademark: 'bg-blue-500',
                    patent: 'bg-amber-500',
                    copyright: 'bg-purple-500'
                  };

                  return types.map(type => (
                    <div key={type} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group-hover/stat:bg-white/10 transition">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeColors[type] || 'bg-slate-300'}`}></div>
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-tighter truncate">
                          {IP_TYPES_RU[type as IPType] || type}
                        </span>
                      </div>
                      <div className="text-xs font-bold font-mono text-white flex-shrink-0"><FormattedPrice value={breakdown[type]} currency="₽" /></div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Generation Modal */}
      {showDocModal && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setShowDocModal(false)}
        >
          <div
            className="glass-card rounded-[2rem] p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-bold text-white flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                  <FileEdit className="w-7 h-7 text-orange-400" />
                </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 tracking-tight">Генератор</span>
              </h2>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-white/30 hover:text-white text-4xl transition-colors leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-8">
              {/* Template Selection */}
              <div>
                <label className="block text-[10px] font-black text-white/40 mb-4 uppercase tracking-[0.2em]">Тип документа</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: 'pretension', label: 'Претензия', icon: AlertTriangle },
                    { value: 'isk', label: 'Иск', icon: Scale },
                    { value: 'dogovor', label: 'Договор', icon: FileEdit },
                    { value: 'nda', label: 'NDA', icon: Lock }
                  ].map(template => (
                    <button
                      key={template.label}
                      onClick={() => setSelectedTemplate(template.value)}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${selectedTemplate === template.value
                        ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                        : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'
                        }`}
                    >
                      <template.icon className={`w-8 h-8 ${selectedTemplate === template.value ? 'text-orange-400' : 'text-white/20'}`} />
                      <div className={`text-[9px] font-bold uppercase tracking-widest ${selectedTemplate === template.value ? 'text-orange-400' : 'text-white/40'}`}>
                        {template.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selection Grids */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-white/40 mb-1 uppercase tracking-[0.2em]">Объект ИС</label>
                  <CustomSelect
                    value={selectedIPId}
                    onChange={v => setSelectedIPId(v ? Number(v) : null)}
                    placeholder="Выберите объект..."
                    options={allAssets.map(asset => ({ value: asset.id, label: asset.title }))}
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-white/40 mb-1 uppercase tracking-[0.2em]">Контрагент</label>
                  <CustomSelect
                    value={selectedCounterpartyId}
                    onChange={v => setSelectedCounterpartyId(v ? Number(v) : null)}
                    placeholder="Выберите сторону..."
                    options={allCounterparties.map(cp => ({ value: cp.id, label: cp.name }))}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setShowDocModal(false)}
                  className="flex-1 px-8 py-4 rounded-2xl border border-white/10 text-white/60 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                >
                  Отмена
                </button>
                <button
                  onClick={handleGenerateDocument}
                  disabled={generatingDoc || !selectedIPId || !selectedCounterpartyId}
                  className="flex-1 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {generatingDoc ? (
                    <>
                      <Download className="animate-spin h-4 w-4" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Скачать DOCX
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
