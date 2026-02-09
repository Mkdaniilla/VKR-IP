import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../components/DashboardLayout";
import {
  getToken,
  clearToken,
  getIPObjects,
  createIPObject,
  deleteIPObject,
  updateIPObjectStatus,
  getApiUrl,
  IPType,
  IP_TYPES_RU,
  getDocuments,
  uploadDocument,
  deleteDocument,
  generateDocument,
  getCounterparties,
  assessIPObject,
  getProtectedFileUrl,
} from "../lib/api";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import SectionTitle from "../components/ui/SectionTitle";
import FormattedPrice from "../components/FormattedPrice";

type Document = {
  id: number;
  filename: string;
  filepath: string;
  uploaded_at: string;
};

type IPObject = {
  id: number;
  title: string;
  type: IPType;
  status: string;
  number?: string | null;
  registration_date?: string | null;
  estimated_value?: number | null;
  report_path?: string | null;
  documents: Document[];
};

type Counterparty = {
  id: number;
  name: string;
};

const STATUS_RU: Record<string, string> = {
  draft: "Черновик",
  filed: "Подано",
  registered: "Зарегистрировано",
  expired: "Истёк срок",
};

const API_URL = getApiUrl();

export default function IPObjectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<IPObject[]>([]);
  const [filter, setFilter] = useState("");

  // Create form
  const [title, setTitle] = useState("");
  const [type, setType] = useState<IPType>("literary_work");
  const [subtype, setSubtype] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  // Docs
  const [uploadingIpId, setUploadingIpId] = useState<number | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

  // Generate doc
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [templateChoice, setTemplateChoice] = useState<Record<number, string>>({});
  const [counterpartyChoice, setCounterpartyChoice] = useState<Record<number, number>>({});
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);

  // Analysis result
  const [analyzingDocId, setAnalyzingDocId] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [lastAnalyzedDocId, setLastAnalyzedDocId] = useState<number | null>(null);


  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    (async () => {
      try {
        const data = await getIPObjects();
        setItems(data);

        const cps = await getCounterparties();
        setCounterparties(cps);
      } catch (e: any) {
        if (e?.message === "Unauthorized" || e?.message === "Invalid token") {
          clearToken();
          router.push("/login");
        } else {
          setErr(e?.message || "Ошибка загрузки");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setCreating(true);
    try {
      const newObj = await createIPObject({ title, type });
      setItems((prev) => [newObj, ...prev]);
      setTitle("");
      setSubtype("");
    } catch (e: any) {
      setErr(e?.message || "Ошибка создания объекта");
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Удалить объект?")) return;
    try {
      await deleteIPObject(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      alert(e?.message || "Ошибка удаления");
    }
  }

  async function onStatusChange(id: number, status: string) {
    try {
      const updated = await updateIPObjectStatus(id, status);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: updated.status } : i))
      );
    } catch (e: any) {
      alert(e?.message || "Ошибка обновления статуса");
    }
  }

  async function loadDocs(ipId: number) {
    try {
      const data = await getIPObjects();
      setItems(data);
    } catch (e: any) {
      console.error(e);
    }
  }

  async function onFileUpload(ipId: number, file: File | null) {
    if (!file) return;
    try {
      setUploadingIpId(ipId);
      await uploadDocument(ipId, file);
      const updatedData = await getIPObjects();
      setItems(updatedData);
    } catch (e: any) {
      alert(e?.message || "Ошибка загрузки файла");
    } finally {
      setUploadingIpId(null);
    }
  }

  async function onDeleteDoc(ipId: number, docId: number) {
    if (!confirm("Удалить документ?")) return;
    try {
      setDeletingDocId(docId);
      await deleteDocument(docId);
      const updatedData = await getIPObjects();
      setItems(updatedData);
    } catch (e: any) {
      alert(e?.message || "Ошибка удаления документа");
    } finally {
      setDeletingDocId(null);
    }
  }

  async function onGenerateDoc(ipId: number) {
    try {
      setGeneratingId(ipId);

      const template = templateChoice[ipId] || "pretension";
      const counterpartyId = counterpartyChoice[ipId];
      if (!counterpartyId) {
        alert("Выберите контрагента!");
        return;
      }

      console.log(`Generating document with template: ${template}, ipId: ${ipId}, cpId: ${counterpartyId}`);

      const blob = await generateDocument(template, ipId, counterpartyId);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // 🔄 Автоматически обновляем список документов после генерации
      const updatedData = await getIPObjects();
      setItems(updatedData);
    } catch (e: any) {
      alert(e?.message || "Ошибка генерации документа. Проверьте консоль.");
      console.error(e);
    } finally {
      setGeneratingId(null);
    }
  }

  const handleAssessmentSuccess = (updatedObj: IPObject) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedObj.id ? updatedObj : item))
    );
  };

  const onAnalyzeDoc = async (docId: number) => {
    setAnalyzingDocId(docId);
    try {
      const { analyzeDocument } = await import("../lib/api");
      const res = await analyzeDocument(docId);
      setAnalysisResult(res);
      setLastAnalyzedDocId(docId); // Save for viewer link
      setShowAnalysisModal(true);
    } catch (e: any) {
      alert(e.message || "Ошибка при анализе");
    } finally {
      setAnalyzingDocId(null);
    }
  };

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
        a.download = filename || "document";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e: any) {
      alert(e?.message || "Не удалось открыть файл. Проверьте соединение с сервером.");
    }
  };

  const filtered = items.filter((i) => !filter || i.status === filter);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Subtype options based on type
  const getSubtypeOptions = (ipType: IPType) => {
    const subtypes: Record<IPType, { value: string; label: string }[]> = {
      literary_work: [
        { value: "book", label: "Книги и статьи" },
        { value: "course", label: "Образовательные курсы" },
        { value: "content", label: "Медиа-контент" },
        { value: "music", label: "Музыкальные произведения" },
        { value: "art", label: "Произведения искусства" },
        { value: "film", label: "Аудиовизуальные произведения" },
      ],
      software: [
        { value: "saas", label: "SaaS решение" },
        { value: "mobile", label: "Мобильное приложение" },
        { value: "enterprise", label: "Корпоративный софт" },
        { value: "ai", label: "AI и алгоритмы" },
        { value: "game", label: "Игры" },
      ],
      database: [
        { value: "structured", label: "Структурированные БД" },
        { value: "analytics", label: "Аналитические БД" },
      ],
      invention: [
        { value: "invention", label: "Изобретение" },
        { value: "pharma", label: "Фармацевтика" },
        { value: "electronics", label: "Электроника" },
      ],
      trademark: [
        { value: "product", label: "Товарный бренд" },
        { value: "service", label: "Бренд услуг" },
        { value: "retail", label: "Торговая сеть" },
        { value: "personal", label: "Персональный бренд" },
      ],
      trade_name: [
        { value: "company", label: "Наименование организации" },
        { value: "holding", label: "Наименование холдинга" },
        { value: "foreign", label: "Иностранное наименование" },
      ],
      commercial_designation: [
        { value: "shop", label: "Обозначение магазина" },
        { value: "restaurant", label: "Обозначение заведения" },
        { value: "service_point", label: "Обозначение точки услуг" },
      ],
      geographical_indication: [
        { value: "geo_product", label: "Географическое указание" },
        { value: "appellation", label: "НМПТ" },
      ],
      know_how: [
        { value: "tech", label: "Технические секреты" },
        { value: "business", label: "Бизнес-секреты" },
        { value: "data", label: "Конфиденциальные данные" },
      ],
      other: [{ value: "other", label: "Другое" }],
      performance: [{ value: "performance", label: "Исполнения" }],
      phonogram: [{ value: "phonogram", label: "Фонограммы" }],
      broadcast: [{ value: "broadcast", label: "Радио/ТВ" }],
      utility_model: [{ value: "utility_model", label: "Полезная модель" }],
      industrial_design: [{ value: "industrial_design", label: "Дизайн" }],
      plant_variety: [{ value: "plant_variety", label: "Селекция" }],
      topology: [{ value: "topology", label: "Топология" }],
    };

    return subtypes[ipType] || [];
  };

  return (
    <DashboardLayout>


      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Modern Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-400 to-blue-500 mb-4 uppercase tracking-tighter">
            Мои IP-активы
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Управление портфелем интеллектуальной собственности</p>
        </div>

        {/* Filter Bar */}
        <div className="mb-8 p-6 glass-card rounded-[2rem] flex flex-col md:flex-row items-center gap-6 border-white/5">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            <label className="text-xs font-black text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">
              Фильтр по статусу
            </label>
          </div>
          <select
            title="Фильтр по статусу"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 glass-input w-full md:w-auto font-bold appearance-none cursor-pointer"
          >
            <option value="">Все статусы</option>
            {Object.entries(STATUS_RU).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Creation Form - Modern Card */}
        <div className="mb-10 p-10 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>

          <h2 className="text-xl font-black mb-8 text-white uppercase tracking-tighter flex items-center gap-4 relative z-10">
            <span className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-lg">
              +
            </span>
            Добавить актив
          </h2>

          <form onSubmit={onCreate} className="grid md:grid-cols-12 gap-6 relative z-10">
            <div className="md:col-span-5">
              <input
                className="glass-input w-full font-bold"
                placeholder="Название объекта..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="md:col-span-4">
              <select
                className="glass-input w-full font-bold appearance-none cursor-pointer"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as IPType);
                  setSubtype("");
                }}
              >
                <optgroup label="Результаты творчества">
                  <option value="literary_work text-white">{IP_TYPES_RU.literary_work}</option>
                  <option value="software">{IP_TYPES_RU.software}</option>
                  <option value="database">{IP_TYPES_RU.database}</option>
                  <option value="performance">{IP_TYPES_RU.performance}</option>
                  <option value="phonogram">{IP_TYPES_RU.phonogram}</option>
                  <option value="broadcast">{IP_TYPES_RU.broadcast}</option>
                </optgroup>
                <optgroup label="Промышленная собственность">
                  <option value="invention">{IP_TYPES_RU.invention}</option>
                  <option value="utility_model">{IP_TYPES_RU.utility_model}</option>
                  <option value="industrial_design">{IP_TYPES_RU.industrial_design}</option>
                  <option value="plant_variety">{IP_TYPES_RU.plant_variety}</option>
                  <option value="topology">{IP_TYPES_RU.topology}</option>
                </optgroup>
                <optgroup label="Бренды">
                  <option value="trademark">{IP_TYPES_RU.trademark}</option>
                  <option value="trade_name">{IP_TYPES_RU.trade_name}</option>
                  <option value="commercial_designation">{IP_TYPES_RU.commercial_designation}</option>
                  <option value="geographical_indication">{IP_TYPES_RU.geographical_indication}</option>
                </optgroup>
                <optgroup label="Ноу-хау">
                  <option value="know_how">{IP_TYPES_RU.know_how}</option>
                </optgroup>
                <option value="other">{IP_TYPES_RU.other}</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={creating}
                className="glass-button-primary w-full h-full text-xs"
              >
                {creating ? "Создаем..." : "Создать актив"}
              </button>
            </div>
          </form>
          {err && (
            <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold flex items-center gap-3">
              <span className="text-lg">⚠️</span> {err}
            </div>
          )}
        </div>

        {/* Objects Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg">
              Нет объектов для выбранного фильтра
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filtered.map((it) => (
              <div
                key={it.id}
                className="group glass-card rounded-[2rem] overflow-hidden transition-all duration-500 border-white/5 hover:border-white/10"
              >
                {/* Header Section */}
                <div className="bg-white/5 p-8 border-b border-white/5 relative">
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full uppercase tracking-widest border border-cyan-400/20">
                          ID: {it.id}
                        </span>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${it.status === 'registered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          it.status === 'filed' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                            it.status === 'draft' ? 'bg-white/5 text-white/40 border-white/10' :
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                          {STATUS_RU[it.status]}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">
                        {it.title}
                      </h3>
                      <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">
                        {IP_TYPES_RU[it.type]}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row gap-3">
                      <button
                        onClick={() => router.push({ pathname: '/valuation', query: { objectId: it.id } })}
                        className="glass-button-primary py-2 text-[10px]"
                      >
                        ⚡ Оценка
                      </button>
                      <button
                        onClick={() => onDelete(it.id)}
                        className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-8">
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {it.number && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Регистрационный №</span>
                        <span className="text-sm text-white font-bold">{it.number}</span>
                      </div>
                    )}
                    {it.registration_date && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Дата регистрации</span>
                        <span className="text-sm text-white font-bold">
                          {new Date(it.registration_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {it.estimated_value && (
                    <div className="mb-8 p-6 bg-cyan-400/5 rounded-[1.5rem] border border-cyan-400/20 relative overflow-hidden group/price">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/price:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.82v-1.91c-1.54-.13-3.04-.76-4.03-1.74l1.39-1.39c.67.66 1.76 1.25 2.64 1.25.9 0 1.57-.44 1.57-1.12 0-.69-.53-1-1.83-1.31-2.18-.53-3.66-1.55-3.66-3.4 0-1.78 1.4-2.91 3.12-3.19V5h2.82v1.94c1.23.16 2.37.66 3.14 1.4l-1.39 1.39c-.5-.46-1.28-.8-1.76-.8-1 0-1.59.51-1.59 1.09 0 .61.56.91 1.9 1.24 2.18.53 3.59 1.53 3.59 3.5 0 1.72-1.26 2.91-2.9 3.32z" /></svg>
                      </div>
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">
                          Рыночная стоимость
                        </span>
                        <span className="text-3xl font-black text-white">
                          <FormattedPrice value={it.estimated_value} />
                        </span>
                      </div>
                    </div>
                  )}

                  {it.report_path && (
                    <button
                      onClick={() => handleOpenFile(`${API_URL}/api/valuation/report/${it.report_path?.split("/").pop()}`, "Отчет_об_оценке.pdf")}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 text-cyan-400 rounded-2xl border border-white/5 hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all mb-8 shadow-xl"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Полный отчет (PDF)
                    </button>
                  )}

                  {/* Status Change */}
                  <div className="mb-8">
                    <label className="block text-[10px] font-black text-white/40 mb-3 uppercase tracking-[0.2em]">
                      Управление статусом:
                    </label>
                    <select
                      value={it.status}
                      onChange={(e) => onStatusChange(it.id, e.target.value)}
                      className="w-full glass-input font-bold appearance-none cursor-pointer"
                    >
                      {Object.entries(STATUS_RU).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Documents Section */}
                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                        Документация
                      </h4>
                      <button
                        onClick={() => loadDocs(it.id)}
                        className="text-[10px] font-black text-white/30 hover:text-cyan-400 transition-colors uppercase tracking-widest"
                      >
                        Обновить
                      </button>
                    </div>

                    <div className="space-y-3 mb-8">
                      {it.documents.length === 0 && (
                        <p className="text-xs text-white/20 italic p-4 text-center">Документация пуста...</p>
                      )}
                      {it.documents.map((doc) => {
                        const fileUrl = `${API_URL}/documents/auth-view/${doc.id}`;

                        return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group/doc"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <button
                                onClick={() => handleOpenFile(fileUrl, doc.filename)}
                                className="text-sm text-white/80 hover:text-cyan-400 font-bold truncate block w-full text-left transition-colors"
                              >
                                {doc.filename}
                              </button>
                              <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-2">
                                {new Date(doc.uploaded_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => onAnalyzeDoc(doc.id)}
                                disabled={analyzingDocId === doc.id}
                                className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                                title="Аудит рисков"
                              >
                                {analyzingDocId === doc.id ? "⌛" : "🔍 Аудит"}
                              </button>
                              <button
                                onClick={() => onDeleteDoc(it.id, doc.id)}
                                disabled={deletingDocId === doc.id}
                                className="text-white/20 hover:text-rose-500 text-sm p-1 leading-none transition-colors"
                              >
                                {deletingDocId === doc.id ? "..." : "×"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Upload */}
                    <div className="mb-10">
                      <label className="cursor-pointer inline-flex items-center justify-center gap-3 w-full p-4 bg-white/5 border border-dashed border-white/20 rounded-2xl hover:border-cyan-400/50 hover:bg-white/10 text-[10px] font-black text-white/40 hover:text-white uppercase tracking-[0.2em] transition-all group">
                        <span className="text-xl group-hover:scale-125 transition-transform">📤</span>
                        {uploadingIpId === it.id ? "Загрузка файла..." : "Загрузить новый документ"}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            onFileUpload(it.id, e.target.files?.[0] || null)
                          }
                          disabled={uploadingIpId === it.id}
                        />
                      </label>
                    </div>

                    {/* Generate Doc */}
                    <div className="pt-8 border-t border-white/10">
                      <h5 className="text-[10px] font-black text-cyan-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1 h-1 bg-cyan-400 rounded-full"></span>
                        Генерация юридических документов
                      </h5>
                      <div className="grid md:grid-cols-12 gap-4">
                        <div className="md:col-span-4">
                          <select
                            title="Выберите юридический шаблон"
                            value={templateChoice[it.id] || "pretension"}
                            onChange={(e) =>
                              setTemplateChoice((p) => ({
                                ...p,
                                [it.id]: e.target.value,
                              }))
                            }
                            className="w-full glass-input text-xs font-bold appearance-none cursor-pointer"
                          >
                            <option value="pretension">Досудебная претензия</option>
                            <option value="nda">Соглашение NDA</option>
                            <option value="assignment">Договор отчуждения</option>
                            <option value="license">Лицензионный договор</option>
                            <option value="isk">Исковое заявление</option>
                            <option value="franchise">Договор франчайзинга</option>
                            <option value="pledge">Договор залога прав</option>
                            <option value="notice">Уведомление о нарушении</option>
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <select
                            value={counterpartyChoice[it.id] || ""}
                            onChange={(e) =>
                              setCounterpartyChoice((p) => ({
                                ...p,
                                [it.id]: parseInt(e.target.value),
                              }))
                            }
                            className="w-full glass-input text-xs font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Выберите сторону</option>
                            {counterparties.map((cp) => (
                              <option key={cp.id} value={cp.id}>
                                {cp.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <button
                            onClick={() => onGenerateDoc(it.id)}
                            disabled={generatingId === it.id}
                            className="glass-button-primary w-full py-2.5 text-[9px] h-full shadow-lg"
                          >
                            {generatingId === it.id ? "Генерация..." : "Сгенерировать"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Modal */}
      {showAnalysisModal && analysisResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card rounded-[2.5rem] w-full max-w-2xl overflow-hidden border-white/10 animate-in fade-in zoom-in duration-500">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Юридический аудит</h2>
                <p className="text-cyan-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Анализ рисков Smart AI</p>
              </div>
              <button onClick={() => setShowAnalysisModal(false)} className="text-white/30 hover:text-white text-4xl transition-colors">×</button>
            </div>

            <div className="p-10 max-h-[60vh] overflow-y-auto space-y-10 custom-scrollbar">
              {/* Summary */}
              <div className="p-6 bg-white/5 rounded-2xl border-l-4 border-cyan-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg className="w-12 h-12 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                </div>
                <h3 className="font-black text-white text-[10px] uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  Резюме
                </h3>
                <p className="text-white/70 text-sm leading-relaxed relative z-10 font-medium italic">"{analysisResult?.summary}"</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Risks */}
                <div className="space-y-6">
                  <h3 className="font-black text-rose-500 uppercase tracking-[0.2em] text-[10px] flex items-center gap-3">
                    <span className="w-4 h-px bg-rose-500"></span>
                    Критические риски
                  </h3>
                  <div className="space-y-3">
                    {analysisResult?.risks?.map((risk: any, i: number) => {
                      const title = typeof risk === 'object' ? (risk.title || risk.text || JSON.stringify(risk)) : risk;
                      const desc = typeof risk === 'object' ? risk.description : null;

                      return (
                        <div key={i} className="p-4 bg-rose-500/10 rounded-2xl text-rose-300 text-xs font-bold border border-rose-500/20">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                            <div className="flex-1">
                              <div className="font-black text-white mb-1">{String(title)}</div>
                              {desc && <div className="text-[10px] opacity-70 mt-1">{String(desc)}</div>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-6">
                  <h3 className="font-black text-emerald-500 uppercase tracking-[0.2em] text-[10px] flex items-center gap-3">
                    <span className="w-4 h-px bg-emerald-500"></span>
                    Рекомендации
                  </h3>
                  <div className="space-y-3">
                    {(analysisResult?.recommendations || analysisResult?.improvements)?.map((rec: any, i: number) => {
                      const icon = (typeof rec === 'object' ? rec.icon : null) || '💡';
                      const text = typeof rec === 'object' ? (rec.text || rec.title || JSON.stringify(rec)) : rec;

                      return (
                        <div key={i} className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-300 text-xs font-bold border border-emerald-500/20 flex gap-4 transition-all hover:bg-emerald-500/20">
                          <span className="flex-shrink-0 text-2xl">{String(icon)}</span>
                          <div className="flex-1">{String(text)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 bg-white/5 border-t border-white/5 flex justify-between items-center">
              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  if (lastAnalyzedDocId) {
                    router.push(`/document-viewer/${lastAnalyzedDocId}`);
                  }
                }}
                className="glass-button-secondary flex items-center gap-2"
                disabled={!lastAnalyzedDocId}
              >
                <span>📄</span>
                Открыть с подсветкой
              </button>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="glass-button-primary"
              >
                Ознакомлен
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
