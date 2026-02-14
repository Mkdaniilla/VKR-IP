export function getApiUrl() {
  if (typeof window === 'undefined') {
    // Server-side (during build/SSR): use full production URL
    return "https://mdmip.ru/api";
  }
  // Client-side: use relative path to stay on same origin/protocol
  return "/api";
}

const API_URL = getApiUrl();


// ===== Токен =====
export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
  }
}

export function logout() {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

// ===== AUTH =====
export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось зарегистрироваться");
    throw new Error(msg);
  }
  return await res.json();
}

export async function login(email: string, password: string) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const msg = await safeErr(res, "Неверный логин или пароль");
    throw new Error(msg);
  }

  const data = (await res.json()) as { access_token: string; token_type: string };
  setToken(data.access_token);
  return data;
}

export async function getMe() {
  const res = await authFetch(`${API_URL}/auth/me`);
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось получить профиль");
    throw new Error(msg);
  }
  return await res.json();
}

// ===== IP Objects =====
export type IPType =
  | "literary_work" | "software" | "database" | "performance" | "phonogram" | "broadcast"  // Результаты творческой деятельности
  | "invention" | "utility_model" | "industrial_design" | "plant_variety" | "topology"     // Промышленная собственность
  | "trademark" | "trade_name" | "commercial_designation" | "geographical_indication"      // Средства индивидуализации
  | "know_how"                                                                              // Нетрадиционные объекты
  | "other";

export const IP_TYPES_RU: Record<string, string> = {
  // Результаты творческой деятельности
  literary_work: "Произведения науки, литературы и искусства",
  software: "Программы для ЭВМ",
  database: "Базы данных",
  performance: "Исполнения",
  phonogram: "Фонограммы",
  broadcast: "Сообщения радио- и телепередач",

  // Объекты промышленной собственности
  invention: "Изобретения",
  utility_model: "Полезные модели",
  industrial_design: "Промышленные образцы",
  plant_variety: "Селекционные достижения",
  topology: "Топологии интегральных микросхем",

  // Средства индивидуализации
  trademark: "Товарные знаки и знаки обслуживания",
  trade_name: "Фирменные наименования",
  commercial_designation: "Коммерческие обозначения",
  geographical_indication: "Географические указания и НМПТ",

  // Нетрадиционные объекты
  know_how: "Секреты производства (ноу-хау)",

  other: "Другое",
};

// --- (1) НОВЫЙ ТИП: IPObject (скопирован из ip-objects.tsx) ---
export type IPObject = {
  id: number;
  title: string;
  type: IPType;
  owner_id: number;
  status: string;
  number?: string | null;
  registration_date?: string | null;
  estimated_value?: number | null;
  report_path?: string | null;
  documents: Document[];
};

// --- (2) НОВЫЙ ТИП: AssessmentPayload (скопирован из ip-objects.tsx) ---
export type ValuationPayload = {
  ip_object_id: number | null;
  ip_type: IPType;
  jurisdictions: string[];
  brand_strength: number;
  annual_revenue: number;
  royalty_rate: number;
  cost_rd: number;
  remaining_years: number;
  market_reach: string;
  industry: string;
  currency: string;
  legal_robustness: string[];
  scope_protection: number;
  valuation_purpose: string;
  subtype: string;
  subtype_metrics: Record<string, number>;
  interview_responses: any[];
};

export interface Kind {
  id?: number;
  code: string;
  category: string;
  title: string;
  name: string; // для совместимости с KindSelect
  term?: string;
  registry?: string;
  notes?: string;
}

export interface KindGroup {
  id: number;
  name: string; // для совместимости с KindSelect
  category: string;
  kinds: Kind[]; // для совместимости с KindSelect
}

export async function getKinds(): Promise<KindGroup[]> {
  const res = await authFetch("/ip/kinds");
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось загрузить справочник видов");
    throw new Error(msg);
  }
  const data = await res.json();
  // Маппим данные под ожидания UI (KindSelect.tsx)
  return data.map((group: any, idx: number) => ({
    id: idx,
    name: group.category,
    category: group.category,
    kinds: group.items.map((item: any, iidx: number) => ({
      ...item,
      id: iidx,
      name: item.title
    }))
  }));
}


export async function getIPObjects(status?: string) {
  const params = status ? `?status=${status}` : "";
  const res = await authFetch(`/ip_objects${params}`);
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось загрузить IP-объекты");
    throw new Error(msg);
  }
  return await res.json();
}

export async function createIPObject(payload: { title: string; type: IPType }) {
  const res = await authFetch(`${API_URL}/ip_objects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось создать IP-объект");
    throw new Error(msg);
  }
  return await res.json();
}

export async function deleteIPObject(id: number) {
  const res = await authFetch(`${API_URL}/ip_objects/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось удалить IP-объект");
    throw new Error(msg);
  }
  return true;
}

export async function updateIPObjectStatus(id: number, newStatus: string) {
  const res = await authFetch(`${API_URL}/ip_objects/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_status: newStatus }),
  });
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось обновить статус");
    throw new Error(msg);
  }
  return await res.json();
}

// --- (3) НОВАЯ ФУНКЦИЯ: assessIPObject ---
/**
 * Отправляет данные для оценки существующего IP-объекта.
 * @param ipObjectId ID объекта для оценки
 * @param payload Данные из модального окна
 * @returns Обновленный IPObject
 */
export async function assessIPObject(
  ipObjectId: number,
  payload: ValuationPayload
): Promise<IPObject> {
  const token = getToken();
  if (!token) {
    throw new Error("Нет авторизации");
  }

  // Используем новый API-маршрут, который мы создали
  const r = await fetch(
    `${API_URL}/valuation/ip-object/${ipObjectId}/assess`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!r.ok) {
    const errData = await r.json();
    throw new Error(errData.detail || `Ошибка ${r.status}`);
  }

  const result = await r.json();

  // Бэкенд (valuation.py) возвращает ValuationOut, который содержит ip_object
  if (result.ip_object) {
    return result.ip_object as IPObject;
  }

  throw new Error("Бэкенд не вернул обновленный IP-объект");
}
// --- КОНЕЦ (3) ---


// ===== Documents =====
export async function getDocuments(ip_id: number) {
  const res = await authFetch(`/documents/?ip_id=${ip_id}`);
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось загрузить документы");
    throw new Error(msg);
  }
  return await res.json();
}

export async function uploadDocument(ip_id: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/documents/?ip_id=${ip_id}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось загрузить документ");
    throw new Error(msg);
  }
  return await res.json();
}

export async function deleteDocument(doc_id: number) {
  const res = await authFetch(`${API_URL}/documents/${doc_id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось удалить документ");
    throw new Error(msg);
  }
  return true;
}


// ===== Generate Document =====
export async function generateDocument(
  template: string,
  ip_id: number,
  counterpartyId: number
) {
  const res = await authFetch(
    `/documents/generate/${template}/${ip_id}?counterparty_id=${counterpartyId}`
  );
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось сгенерировать документ");
    throw new Error(msg);
  }
  const blob = await res.blob();
  return blob;
}

// ===== Deadlines =====
export type Deadline = {
  id: number;
  ip_id: number;
  due_date: string;
  kind: string;
  note?: string | null;
  notified: boolean;
};

export async function getDeadlines() {
  const res = await authFetch("/deadlines");
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось загрузить дедлайны");
    throw new Error(msg);
  }
  return await res.json();
}

export async function createDeadline(payload: {
  ip_id: number;
  due_date: string;
  kind: string;
  note?: string;
}) {
  const res = await authFetch("/deadlines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось создать дедлайн");
    throw new Error(msg);
  }
  return await res.json();
}

export async function deleteDeadline(id: number) {
  const res = await authFetch(`/deadlines/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось удалить дедлайн");
    throw new Error(msg);
  }
  return true;
}

export async function updateDeadline(
  id: number,
  payload: { due_date?: string; kind?: string; note?: string; notified?: boolean }
) {
  const res = await authFetch(`/deadlines/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось обновить дедлайн");
    throw new Error(msg);
  }
  return await res.json();
}

export async function getUpcomingDeadlines(days: number = 30) {
  const res = await authFetch(`/deadlines/upcoming/${days}`);
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось загрузить ближайшие дедлайны");
    throw new Error(msg);
  }
  return await res.json();
}

// ===== Helpers =====
async function safeErr(res: Response, fallback: string) {
  try {
    const t = await res.text();
    if (!t) return `${fallback} (HTTP ${res.status})`;
    try {
      const j = JSON.parse(t);
      if (j?.detail) return `${fallback}: ${j.detail}`;
    } catch {
      /* ignore */
    }
    return `${fallback}: ${t}`;
  } catch {
    return `${fallback} (HTTP ${res.status})`;
  }
}

// ===== Knowledge Base =====
export interface KBArticle {
  id: number;
  title: string;
  content: string;
  category_id: number;
  category?: { id: number; title: string };
}

export interface KBCategory {
  id: number;
  title: string;
}

export async function getKBCategories(): Promise<KBCategory[]> {
  const res = await authFetch("/knowledge/categories");
  if (!res.ok) throw new Error("Не удалось загрузить категории");
  return await res.json();
}

export async function createKBCategory(title: string): Promise<KBCategory> {
  const res = await authFetch("/knowledge/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Не удалось создать категорию");
  return await res.json();
}

export async function deleteKBCategory(id: number) {
  const res = await authFetch(`/knowledge/categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Не удалось удалить категорию");
  return true;
}

export async function getKBArticles(
  categoryId?: number,
  q?: string
): Promise<KBArticle[]> {
  let url = "/knowledge/articles";
  const params = new URLSearchParams();
  if (categoryId) params.append("category_id", categoryId.toString());
  if (q) params.append("q", q);
  if (params.toString()) url += "?" + params.toString();

  const res = await authFetch(url);
  if (!res.ok) throw new Error("Не удалось загрузить статьи");
  return await res.json();
}

export async function getKBArticle(id: number): Promise<KBArticle> {
  const res = await authFetch(`/knowledge/articles/${id}`);
  if (!res.ok) throw new Error("Статья не найдена");
  return await res.json();
}

export async function createKBArticle(payload: {
  title: string;
  content: string;
  category_id: number;
}): Promise<KBArticle> {
  const res = await authFetch("/knowledge/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Не удалось создать статью");
  return await res.json();
}

export async function updateKBArticle(
  id: number,
  payload: Partial<KBArticle>
): Promise<KBArticle> {
  const res = await authFetch(`/knowledge/articles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Не удалось обновить статью");
  return await res.json();
}

export async function deleteKBArticle(id: number) {
  const res = await authFetch(`/knowledge/articles/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Не удалось удалить статью");
  return true;
}

export async function getKBTemplate(): Promise<string> {
  const res = await authFetch("/knowledge/template");
  if (!res.ok) throw new Error("Не удалось загрузить шаблон");
  const data = await res.json();
  return data.template;
}

export async function askAI(question: string): Promise<{ answer: string; sources: { id: number; title: string }[] }> {
  const res = await authFetch("/knowledge/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Ошибка ИИ-агента");
  }
  return await res.json();
}


// ===== Обновлённая версия authFetch =====
export async function authFetch(
  endpoint: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  try {
    const res = await fetch(url, { ...init, headers });
    if (!res.ok) console.error(`[API] Ошибка ${res.status}: ${url}`);
    return res;
  } catch (err) {
    console.error(`[API] Не удалось подключиться: ${url}`, err);
    throw new Error("Ошибка соединения с сервером API");
  }
}

// ===== Контрагенты =====
export async function getCounterparties() {
  const res = await authFetch("/counterparties");
  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось загрузить контрагентов");
    throw new Error(msg);
  }
  return await res.json();
}

// ===== Видео =====
export async function getProtectedVideo(filename: string): Promise<string> {
  const token = getToken();
  if (!token) throw new Error("Нет токена — авторизуйтесь");

  const res = await fetch(`${API_URL}/videos/${filename}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const msg = await safeErr(res, "Не удалось загрузить видео");
    throw new Error(msg);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Получает защищенный файл (PDF, DOCX и т.д.) через API с авторизацией
 * и возвращает временную ссылку для открытия/скачивания.
 */
export async function getProtectedFileUrl(url: string): Promise<string> {
  const token = getToken();
  if (!token) throw new Error("Нет токена — авторизуйтесь");

  console.log(`[API] Fetching protected file: ${url}`);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const msg = await safeErr(res, "Не удалось загрузить файл");
      console.error(`[API] File fetch failed: ${res.status}`, msg);
      throw new Error(msg);
    }

    const blob = await res.blob();
    console.log(`[API] File received, size: ${blob.size}, type: ${blob.type}`);
    return URL.createObjectURL(blob);
  } catch (err: any) {
    console.error(`[API] Network error fetching file: ${url}`, err);
    throw err;
  }
}
