import { authFetch } from "./api";

export type IPKind = {
  code: string;
  category: string; // patent | copyright | individualization | other
  title: string;
  term?: string | null;
  registry?: string | null;
  notes?: string | null;
};
export type IPKindsGrouped = { category: string; items: IPKind[] };

export async function fetchIPKinds(): Promise<IPKindsGrouped[]> {
  const res = await authFetch("/ip/kinds");
  if (!res.ok) throw new Error("Не удалось загрузить справочник видов ИС");
  return res.json();
}
