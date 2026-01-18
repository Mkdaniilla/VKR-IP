import { authFetch } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Генерация документа
export async function generateDocument(template: string, ipId: number, counterpartyId: number): Promise<Blob> {
  const res = await authFetch(
    `${API_URL}/documents/generate/${template}/${ipId}?counterparty_id=${counterpartyId}`
  );
  if (!res.ok) throw new Error("Ошибка при генерации документа");
  return await res.blob();
}
