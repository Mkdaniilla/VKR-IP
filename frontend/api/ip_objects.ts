import { IPObject } from "@/types/ip_objects";
import { authFetch } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Получить список объектов
export async function getIPObjects(status?: string): Promise<IPObject[]> {
  const params = status ? `?status=${status}` : "";
  const res = await authFetch(`${API_URL}/ip_objects${params}`);
  if (!res.ok) throw new Error("Ошибка при загрузке объектов");
  return await res.json();
}

// Создать объект
export async function createIPObject(payload: Partial<IPObject>): Promise<IPObject> {
  const res = await authFetch(`${API_URL}/ip_objects/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Ошибка при создании объекта");
  return await res.json();
}

// Обновить объект
export async function updateIPObject(id: number, payload: Partial<IPObject>): Promise<IPObject> {
  const res = await authFetch(`${API_URL}/ip_objects/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Ошибка при обновлении объекта");
  return await res.json();
}
