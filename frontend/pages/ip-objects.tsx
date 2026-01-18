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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        <div className="mb-10">
          <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Мои IP-объекты (v2.1)
          </h1>
          <p className="text-gray-600">Управляйте вашим портфелем интеллектуальной собственности</p>
        </div>

        {/* Filter Bar */}
        <div className="mb-8 flex items-center gap-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
          <label className="text-sm font-bold text-green-800 uppercase tracking-wider">
            Фильтр:
          </label>
          <select
            title="Фильтр по статусу"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-green-200 rounded-xl bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
        <div className="mb-10 p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
              +
            </span>
            Добавить новый объект
          </h2>
          <form onSubmit={onCreate} className="grid md:grid-cols-3 gap-4">
            <input
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="Название объекта"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <select
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              value={type}
              onChange={(e) => {
                setType(e.target.value as IPType);
                setSubtype("");
              }}
            >
              <optgroup label="Результаты творческой деятельности">
                <option value="literary_work">{IP_TYPES_RU.literary_work}</option>
                <option value="software">{IP_TYPES_RU.software}</option>
                <option value="database">{IP_TYPES_RU.database}</option>
                <option value="performance">{IP_TYPES_RU.performance}</option>
                <option value="phonogram">{IP_TYPES_RU.phonogram}</option>
                <option value="broadcast">{IP_TYPES_RU.broadcast}</option>
              </optgroup>
              <optgroup label="Объекты промышленной собственности">
                <option value="invention">{IP_TYPES_RU.invention}</option>
                <option value="utility_model">{IP_TYPES_RU.utility_model}</option>
                <option value="industrial_design">{IP_TYPES_RU.industrial_design}</option>
                <option value="plant_variety">{IP_TYPES_RU.plant_variety}</option>
                <option value="topology">{IP_TYPES_RU.topology}</option>
              </optgroup>
              <optgroup label="Средства индивидуализации">
                <option value="trademark">{IP_TYPES_RU.trademark}</option>
                <option value="trade_name">{IP_TYPES_RU.trade_name}</option>
                <option value="commercial_designation">{IP_TYPES_RU.commercial_designation}</option>
                <option value="geographical_indication">{IP_TYPES_RU.geographical_indication}</option>
              </optgroup>
              <optgroup label="Нетрадиционные объекты">
                <option value="know_how">{IP_TYPES_RU.know_how}</option>
              </optgroup>
              <option value="other">{IP_TYPES_RU.other}</option>
            </select>

            <Button
              type="submit"
              disabled={creating}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {creating ? "Добавляем..." : "✨ Добавить"}
            </Button>
          </form>
          {err && <p className="text-red-600 text-sm mt-4 bg-red-50 p-3 rounded-xl">{err}</p>}
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
                className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl border-2 border-gray-100 hover:border-green-200 overflow-hidden transition-all duration-300"
              >
                {/* Header Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b-2 border-green-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                          ID: {it.id}
                        </span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${it.status === 'registered' ? 'bg-green-100 text-green-700' :
                          it.status === 'filed' ? 'bg-emerald-100 text-emerald-700' :
                            it.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                              'bg-red-100 text-red-700'
                          }`}>
                          {STATUS_RU[it.status]}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{it.title}</h3>
                      <p className="text-sm text-gray-600">
                        {IP_TYPES_RU[it.type]}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push({ pathname: '/valuation', query: { objectId: it.id } })}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        🔥 Оценить
                      </button>
                      <button
                        onClick={() => onDelete(it.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold shadow-md hover:shadow-lg transition-all"
                      >
                        🗑 Удалить
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {it.number && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 font-medium">Номер:</span>
                        <span className="text-gray-900 font-bold">{it.number}</span>
                      </div>
                    )}
                    {it.registration_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 font-medium">Регистрация:</span>
                        <span className="text-gray-900 font-bold">
                          {new Date(it.registration_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {it.estimated_value && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-green-700 uppercase tracking-wider">
                          💰 Оценочная стоимость
                        </span>
                        <span className="text-2xl font-black text-green-600">
                          <FormattedPrice value={it.estimated_value} />
                        </span>
                      </div>
                    </div>
                  )}

                  {it.report_path && (
                    <button
                      onClick={() => handleOpenFile(`${API_URL}/api/valuation/report/${it.report_path?.split("/").pop()}`, "Отчет_об_оценке.pdf")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 font-bold transition-all mb-6"
                    >
                      📄 Отчет об оценке
                    </button>
                  )}

                  {/* Status Change */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                      Изменить статус:
                    </label>
                    <select
                      value={it.status}
                      onChange={(e) => onStatusChange(it.id, e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      {Object.entries(STATUS_RU).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Documents Section */}
                  <div className="p-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900">📎 Документы</h4>
                      <button
                        onClick={() => loadDocs(it.id)}
                        className="text-sm text-green-600 hover:text-green-700 font-bold"
                      >
                        Обновить
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      {it.documents.length === 0 ? (
                        <p className="text-sm text-gray-500">Документов нет</p>
                      ) : (
                        it.documents.map((doc) => {
                          const fileUrl = `${API_URL}/documents/auth-view/${doc.id}`;

                          return (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200"
                            >
                              <div>
                                <button
                                  onClick={() => handleOpenFile(fileUrl, doc.filename)}
                                  className="text-sm text-blue-600 hover:underline font-medium text-left"
                                >
                                  {doc.filename}
                                </button>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(doc.uploaded_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onAnalyzeDoc(doc.id)}
                                  disabled={analyzingDocId === doc.id}
                                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-bold transition-all"
                                  title="Аудит рисков"
                                >
                                  {analyzingDocId === doc.id ? "⌛" : "🔍 Аудит"}
                                </button>
                                <button
                                  onClick={() => onDeleteDoc(it.id, doc.id)}
                                  disabled={deletingDocId === doc.id}
                                  className="text-red-600 hover:text-red-700 text-sm font-bold"
                                >
                                  {deletingDocId === doc.id ? "..." : "✕"}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Upload */}
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-all">
                        {uploadingIpId === it.id ? "Загружаем..." : "📤 Добавить документ"}
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
                    <div className="mt-6 pt-6 border-t-2 border-gray-200">
                      <h5 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                        ⚙️ Генерация документов
                      </h5>
                      <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3">
                        <select
                          title="Выберите юридический шаблон"
                          value={templateChoice[it.id] || "pretension"}
                          onChange={(e) =>
                            setTemplateChoice((p) => ({
                              ...p,
                              [it.id]: e.target.value,
                            }))
                          }
                          className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500"
                        >
                          <option value="pretension">⚖️ Досудебная претензия</option>
                          <option value="nda">🔒 Соглашение NDA</option>
                          <option value="assignment">💰 Договор отчуждения (продажа)</option>
                          <option value="license">📄 Лицензионный договор</option>
                          <option value="isk">🏛 Исковое заявление</option>
                          <option value="franchise">🏪 Договор франчайзинга</option>
                          <option value="pledge">🔐 Договор залога прав</option>
                          <option value="notice">📢 Уведомление о нарушении</option>
                        </select>
                        <select
                          value={counterpartyChoice[it.id] || ""}
                          onChange={(e) =>
                            setCounterpartyChoice((p) => ({
                              ...p,
                              [it.id]: parseInt(e.target.value),
                            }))
                          }
                          className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Выберите контрагента</option>
                          {counterparties.map((cp) => (
                            <option key={cp.id} value={cp.id}>
                              {cp.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => onGenerateDoc(it.id)}
                          disabled={generatingId === it.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-sm transition-all whitespace-nowrap"
                        >
                          {generatingId === it.id ? "⏳" : "📝 Сгенерировать"}
                        </button>
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
      {showAnalysisModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-2xl font-black text-slate-900">🔍 Юридический аудит ИИ</h2>
                <p className="text-indigo-600 font-bold text-sm">Профессиональный анализ рисков и рекомендаций</p>
              </div>
              <button onClick={() => setShowAnalysisModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
              {/* Summary */}
              <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-indigo-500">
                <h3 className="font-black text-slate-900 mb-2 flex items-center gap-2">
                  <span>📝 Резюме</span>
                </h3>
                <p className="text-slate-600 leading-relaxed">{analysisResult?.summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Risks */}
                <div className="space-y-4">
                  <h3 className="font-black text-red-600 uppercase tracking-wider text-sm flex items-center gap-2">
                    <span>⚠️ Критические риски</span>
                  </h3>
                  <div className="space-y-2">
                    {analysisResult?.risks?.map((r: string, i: number) => (
                      <div key={i} className="p-4 bg-red-50 rounded-xl text-red-800 text-sm font-medium border border-red-100 flex gap-3">
                        <span className="flex-shrink-0 w-5 h-5 bg-red-200 text-red-700 rounded-full flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-4">
                  <h3 className="font-black text-green-600 uppercase tracking-wider text-sm flex items-center gap-2">
                    <span>💡 Рекомендации</span>
                  </h3>
                  <div className="space-y-2">
                    {analysisResult?.improvements?.map((imp: string, i: number) => (
                      <div key={i} className="p-4 bg-green-50 rounded-xl text-green-800 text-sm font-medium border border-green-100 flex gap-3">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-200 text-green-700 rounded-full flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        {imp}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
