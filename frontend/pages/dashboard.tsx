import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import { getIPObjects, getCounterparties, generateDocument, getUpcomingDeadlines, Deadline } from "@/lib/api";
import FormattedPrice from "@/components/FormattedPrice";
import { IPType, IP_TYPES_RU } from "@/lib/api";

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
      <div className="grid grid-cols-12 gap-6 pb-10">

        {/* TOP ROW: Portfolio Summary */}
        <div className="col-span-12 bg-gradient-to-r from-emerald-800 to-emerald-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
            <div>
              <p className="text-emerald-200 font-medium mb-1 uppercase tracking-wider text-sm">Общая стоимость портфеля</p>
              <h1 className="text-4xl md:text-5xl font-bold">
                <FormattedPrice value={stats.totalValue} />
              </h1>
              <div className="mt-4 flex items-center gap-2 text-emerald-100 bg-white/10 w-fit px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                <span className="text-sm">↗ +12.5% за последний квартал</span>
              </div>
            </div>
            <div className="flex gap-8 text-center bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <div>
                <div className="text-2xl font-bold">{stats.assetsCount}</div>
                <div className="text-xs text-emerald-300 uppercase tracking-wide">Активов</div>
              </div>
              <div className="w-px bg-white/20"></div>
              <div>
                <div className="text-2xl font-bold">{stats.activeLicensees}</div>
                <div className="text-xs text-emerald-300 uppercase tracking-wide">Партнеров</div>
              </div>
            </div>
          </div>
          {/* Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20 pointer-events-none"></div>
        </div>


        {/* MIDDLE ROW */}

        {/* Left: Registry List */}
        <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Реестр активов
            </h3>
            <Link href="/ip-objects" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded transition">Все</Link>
          </div>
          <div className="space-y-4 flex-1">
            {recentAssets.length === 0 && <p className="text-slate-400 text-sm">Нет активов</p>}
            {recentAssets.map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-white hover:shadow-md transition cursor-pointer border border-slate-100">
                <div>
                  <div className="font-semibold text-slate-700 text-sm truncate max-w-[150px]">{asset.title}</div>
                  <div className="text-xs text-slate-400">{IP_TYPES_RU[asset.type]}</div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${asset.status === 'registered' ? 'bg-green-100 text-green-700 border-green-200' :
                  asset.status === 'filed' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                  {asset.status === 'registered' ? 'Active' : asset.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Counterparties */}
        <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Контрагенты
            </h3>
            <Link href="/counterparties" className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded transition">Все</Link>
          </div>
          <div className="space-y-4 flex-1">
            {partnerList.length === 0 && <p className="text-slate-400 text-sm">Нет контрагентов</p>}
            {partnerList.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${['from-purple-400 to-purple-600', 'from-blue-400 to-blue-600', 'from-pink-400 to-pink-600'][i % 3]
                  }`}>
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-700 truncate">{p.name}</div>
                  <div className="text-xs text-slate-400 truncate">{p.contact_person || 'Email: ???'}</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500" title="Active Contract"></div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN STACK */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-6">

          {/* Visual Portfolio Valuation Breakdown Widget */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col min-h-[400px] relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Капитализация портфеля
              </h3>
              <Link href="/valuation" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider transition">Анализ</Link>
            </div>

            {/* Chart Area */}
            <div className="relative flex-1 flex flex-col items-center justify-center py-4">
              {(() => {
                const breakdown = allAssets.reduce((acc: Record<string, number>, a) => {
                  acc[a.type] = (acc[a.type] || 0) + (a.estimated_value || 0);
                  return acc;
                }, {});

                const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
                const types = Object.keys(breakdown).sort((a, b) => breakdown[b] - breakdown[a]);
                const colors: Record<string, string> = {
                  software: '#10b981', // emerald-500
                  trademark: '#3b82f6', // blue-500
                  patent: '#f59e0b', // amber-500
                  copyright: '#8b5cf6', // violet-500
                  design: '#ec4899' // pink-500
                };

                let cumulativePercent = 0;

                return (
                  <div className="relative w-full aspect-square max-w-[200px] flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                      {types.map((type, i) => {
                        const val = (breakdown[type] / total) * 100;
                        const dashArray = `${val} ${100 - val}`;
                        const offset = 100 - cumulativePercent;
                        cumulativePercent += val;

                        return (
                          <circle
                            key={type}
                            cx="18" cy="18" r="15.9"
                            fill="transparent"
                            stroke={colors[type] || '#cbd5e1'}
                            strokeWidth="3.8"
                            strokeDasharray={dashArray}
                            strokeDashoffset={offset}
                            className="transition-all duration-1000 ease-out hover:stroke-black cursor-help"
                          />
                        );
                      })}
                    </svg>

                    {/* Inner Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Всего</div>
                      <div className="text-lg font-black text-slate-800 leading-none mt-1">
                        <FormattedPrice value={stats.totalValue} currency="" />
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold mt-0.5">RUB</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Legend Grid */}
            <div className="mt-6 space-y-2">
              {(() => {
                const breakdown = allAssets.reduce((acc: Record<string, number>, a) => {
                  acc[a.type] = (acc[a.type] || 0) + (a.estimated_value || 0);
                  return acc;
                }, {});
                const types = Object.keys(breakdown).sort((a, b) => breakdown[b] - breakdown[a]).slice(0, 3);
                const colors: Record<string, string> = {
                  software: 'bg-emerald-500',
                  trademark: 'bg-blue-500',
                  patent: 'bg-amber-500',
                  copyright: 'bg-purple-500',
                  design: 'bg-pink-500'
                };

                return types.map(type => (
                  <div key={type} className="flex items-center justify-between group/item">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors[type] || 'bg-slate-300'}`}></div>
                      <span className="text-[11px] font-bold text-slate-600 truncate max-w-[120px]">
                        {IP_TYPES_RU[type as IPType] || type}
                      </span>
                    </div>
                    <div className="text-[11px] font-black text-slate-800">
                      <FormattedPrice value={breakdown[type]} currency="₽" className="text-slate-800" />
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Subtle interactive hint */}
            <div className="mt-6 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-medium">Эффективность активов</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  +12.4%
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </span>
              </div>
            </div>
          </div>

          {/* Smart Docs Widget */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition">
              <svg className="w-24 h-24 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
            </div>
            <h3 className="font-bold text-slate-800 mb-4 text-sm relative z-10">📄 Генератор документов</h3>
            <div className="flex gap-4 mb-6 relative z-10">
              {[
                { id: 'pretension', label: 'NDA', icon: '📜' },
                { id: 'dogovor', label: 'Лицензия', icon: '📜' },
                { id: 'dogovor', label: 'Договор', icon: '📜' }
              ].map(doc => (
                <button
                  key={doc.label}
                  onClick={() => {
                    setSelectedTemplate(doc.id);
                    setShowDocModal(true);
                  }}
                  className="flex-1 py-3 px-2 rounded-xl bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold hover:bg-orange-100 transition flex flex-col items-center gap-1"
                >
                  <span className="text-lg">{doc.icon}</span> {doc.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowDocModal(true)}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 active:scale-95 transition relative z-10 text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Создать документ
            </button>
          </div>

          {/* Visual Deadlines Chart Widget */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col min-h-[350px]">
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Умная динамика рисков
              </h3>
              <div className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">90 дней</div>
            </div>

            {/* The Chart (CSS/SVG Based) */}
            <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2 h-32 relative z-10">
              {(() => {
                const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
                const now = new Date();
                const currentMonth = now.getMonth();

                const overdue = upcomingDeadlines.filter(dl => new Date(dl.due_date) < now);

                // Prepare 6 months of data
                const chartData = Array.from({ length: 6 }).map((_, i) => {
                  const m = (currentMonth + i) % 12;
                  const monthDeadlines = upcomingDeadlines.filter(dl => {
                    const d = new Date(dl.due_date);
                    return d.getMonth() === m && d >= now;
                  });

                  // Include overdue in the first month's visual logic if they exist
                  const count = monthDeadlines.length + (i === 0 ? overdue.length : 0);
                  const titles = monthDeadlines.slice(0, 2).map(dl => {
                    const obj = allAssets.find(a => a.id === dl.ip_id);
                    return obj ? obj.title : dl.kind;
                  });
                  if (i === 0 && overdue.length > 0) titles.unshift(`ПРОСРОЧЕНО (${overdue.length})`);

                  return { month: months[m], count, info: titles.join(', ') };
                });

                const maxCount = Math.max(...chartData.map(d => d.count), 1);

                return chartData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex items-end justify-center group-hover:cursor-pointer">
                      {/* Active Indicator Pulse */}
                      {((i === 0 && overdue.length > 0) || (data.count > 0 && i === 0)) && (
                        <div className={`absolute -top-4 w-2 h-2 rounded-full animate-ping ${overdue.length > 0 ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                      )}

                      {/* Bar Background */}
                      <div
                        className="w-full bg-slate-50 rounded-t-lg transition-all duration-700 ease-out border-x border-t border-transparent"
                        style={{ height: '100px' }}
                      ></div>

                      {/* Actual Data Bar */}
                      <div
                        className={`absolute w-full rounded-t-lg transition-all duration-1000 ease-out shadow-lg ${i === 0 && overdue.length > 0 ? 'bg-gradient-to-t from-red-500 to-red-600' :
                          i === 0 ? 'bg-gradient-to-t from-orange-400 to-orange-500' : 'bg-gradient-to-t from-emerald-400 to-emerald-500'
                          }`}
                        style={{
                          height: `${(data.count / (maxCount + 1)) * 100}%`,
                          minHeight: data.count > 0 ? '8px' : '0px'
                        }}
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition shadow-xl pointer-events-none whitespace-nowrap z-50">
                          {data.count} {data.count === 1 ? 'задача' : 'задачи'}: {data.info || 'нет событий'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${i === 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                      {data.month}
                    </span>
                  </div>
                ));
              })()}

              {/* Horizontal Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-slate-100">
                <div className="w-full border-t border-slate-50"></div>
                <div className="w-full border-t border-slate-50"></div>
                <div className="w-full border-t border-slate-50"></div>
              </div>
            </div>

            {/* Summary / Insights */}
            <div className="mt-8 space-y-3 relative z-10">
              {(() => {
                const now = new Date();
                const overdue = upcomingDeadlines.filter(dl => new Date(dl.due_date) < now);
                const urgent = upcomingDeadlines.filter(dl => {
                  const d = new Date(dl.due_date);
                  const diff = d.getTime() - now.getTime();
                  return diff > 0 && diff < 14 * 24 * 60 * 60 * 1000; // 14 days
                });

                const totalCritical = overdue.length + urgent.length;

                if (totalCritical > 0) {
                  return (
                    <div className="p-3 bg-red-50 rounded-2xl flex items-center justify-between border border-red-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg">⚠️</div>
                        <div>
                          <div className="text-[10px] text-red-400 font-bold uppercase tracking-wide leading-none mb-1">
                            {overdue.length > 0 ? 'Есть просроченные' : 'Критически близко'}
                          </div>
                          <div className="text-xs font-bold text-slate-800">
                            {overdue.length > 0 ? `${overdue.length} задач просрочено` : `${urgent.length} задач до 14 дней`}
                          </div>
                        </div>
                      </div>
                      <div className="text-red-500 font-bold text-xs animate-pulse">!</div>
                    </div>
                  );
                }

                // If no urgent, show nearest
                const sorted = [...upcomingDeadlines].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
                const next = sorted[0];

                if (next) {
                  const dateStr = new Date(next.due_date).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
                  return (
                    <div className="p-3 bg-emerald-50/50 rounded-2xl flex items-center justify-between border border-emerald-100/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg">✅</div>
                        <div>
                          <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide leading-none mb-1">Безрисковый период</div>
                          <div className="text-xs font-bold text-slate-800">До {dateStr}</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg">🎉</div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide leading-none mb-1">Все задачи закрыты</div>
                        <div className="text-xs font-bold text-slate-800">Активных дедлайнов нет</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Second insight row - maybe show type of tasks */}
              {upcomingDeadlines.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg">📊</div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide leading-none mb-1">Всего событий на 90 дней</div>
                      <div className="text-xs font-bold text-slate-800">{upcomingDeadlines.length} задачи по активам</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/deadlines')}
              className="mt-6 w-full py-3 bg-emerald-900 text-white text-[11px] font-bold rounded-xl text-center hover:bg-black transition shadow-xl active:scale-95 flex items-center justify-center gap-2 group"
            >
              Управлять рисками
              <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>

        </div>
      </div>

      {/* Document Generation Modal */}
      {showDocModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowDocModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                </span>
                Генератор документов
              </h2>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-slate-400 hover:text-slate-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Тип документа</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'pretension', label: 'Претензия', icon: '⚠️' },
                    { value: 'isk', label: 'Иск', icon: '⚖️' },
                    { value: 'dogovor', label: 'Договор', icon: '📝' },
                    { value: 'dogovor', label: 'NDA', icon: '🔒' }
                  ].map(template => (
                    <button
                      key={template.label}
                      onClick={() => setSelectedTemplate(template.value)}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${selectedTemplate === template.value
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
                        }`}
                    >
                      <div className="text-xl">{template.icon}</div>
                      <div className={`text-[10px] font-bold uppercase tracking-wide ${selectedTemplate === template.value ? 'text-orange-700' : 'text-slate-500'}`}>
                        {template.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* IP Object Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Объект интеллектуальной собственности</label>
                <select
                  value={selectedIPId || ''}
                  onChange={(e) => setSelectedIPId(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-sm"
                >
                  <option value="">Выберите объект...</option>
                  {allAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.title} ({IP_TYPES_RU[asset.type] || asset.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Counterparty Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Контрагент (Вторая сторона)</label>
                <select
                  value={selectedCounterpartyId || ''}
                  onChange={(e) => setSelectedCounterpartyId(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-sm"
                >
                  <option value="">Выберите контрагента...</option>
                  {allCounterparties.map(cp => (
                    <option key={cp.id} value={cp.id}>
                      {cp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDocModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={handleGenerateDocument}
                  disabled={generatingDoc || !selectedIPId || !selectedCounterpartyId}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-200 active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                  {generatingDoc ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Генерация...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Сгенерировать и скачать DOCX
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
