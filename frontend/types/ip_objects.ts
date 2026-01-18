export type IPType = "trademark" | "patent" | "copyright" | "other";
export type IPStatus = "draft" | "filed" | "registered" | "expired";

export interface IPObject {
  id: number;
  title: string;
  type: IPType;
  status: IPStatus;
  reg_number?: string | null;          // ✅ регистрационный номер
  registration_date?: string | null;   // дата регистрации
  owner_name?: string | null;          // владелец
  owner_id: number;
  documents?: any[];                   // ✅ список документов
}

