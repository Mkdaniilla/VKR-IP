import { Counterparty } from "@/types/counterparty";
import { authFetch } from "../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Получение списка контрагентов ---
export async function getCounterparties(): Promise<Counterparty[]> {
  const res = await authFetch(`${API_URL}/counterparties`);
  if (!res.ok) throw new Error("Ошибка при загрузке контрагентов");
  return await res.json();
}

// --- Создание нового контрагента ---
export async function createCounterparty(
  payload: Omit<Counterparty, "id" | "owner_id">
): Promise<Counterparty> {
  const res = await authFetch(`${API_URL}/counterparties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ошибка при создании контрагента: ${errText}`);
  }
  return await res.json();
}

// --- Обновление контрагента ---
export async function updateCounterparty(
  id: number,
  payload: Partial<Omit<Counterparty, "id" | "owner_id">>
): Promise<Counterparty> {
  const res = await authFetch(`${API_URL}/counterparties/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ошибка при обновлении контрагента: ${errText}`);
  }
  return await res.json();
}

// --- Удаление контрагента ---
export async function deleteCounterparty(id: number): Promise<void> {
  const res = await authFetch(`${API_URL}/counterparties/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ошибка при удалении контрагента: ${errText}`);
  }
}

