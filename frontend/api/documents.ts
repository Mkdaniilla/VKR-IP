import { authFetch, getApiUrl } from "../lib/api";

const API_URL = getApiUrl();

// Генерация документа
export async function generateDocument(template: string, ipId: number, counterpartyId: number): Promise<Blob> {
  const res = await authFetch(
    `${API_URL}/documents/generate/${template}/${ipId}?counterparty_id=${counterpartyId}`
  );
  if (!res.ok) throw new Error("Ошибка при генерации документа");
  return await res.blob();
}
