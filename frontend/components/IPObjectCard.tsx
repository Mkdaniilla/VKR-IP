import React, { useState, useEffect } from "react";
import { uploadDocument, deleteDocument, generateDocument, getApiUrl } from "../lib/api";
import { getCounterparties } from "../api/counterparties";
import { Counterparty } from "../types/counterparty";
import { IPObject } from "../types/ip_objects";

interface Props {
  ip: IPObject;
}

export default function IPObjectCard({ ip }: Props) {
  const [loading, setLoading] = useState(false);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [selectedCounterparty, setSelectedCounterparty] = useState<number | null>(null);
  const [template, setTemplate] = useState("pretension");

  // Загружаем список контрагентов
  useEffect(() => {
    getCounterparties().then(setCounterparties);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    await uploadDocument(ip.id, file);
    window.location.reload();
  };

  const handleGenerate = async () => {
    if (!selectedCounterparty) {
      alert("Выберите контрагента!");
      return;
    }
    try {
      setLoading(true);
      const blob = await generateDocument(template, ip.id, selectedCounterparty);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${template}_${ip.id}.docx`;
      link.click();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded p-3 mb-4">
      <h3 className="font-bold">{ip.title}</h3>
      <p>Тип: {ip.type}</p>
      <p>Статус: {ip.status}</p>
      <p>Рег. номер: {ip.reg_number || "—"}</p>
      <p>Дата регистрации: {ip.registration_date || "—"}</p>
      <p>Владелец: {ip.owner_name || "—"}</p>

      {/* Загрузка документов */}
      <div className="mt-2">
        <input type="file" onChange={handleUpload} />
        <ul>
          {ip.documents?.map((doc: any) => (
            <li key={doc.id}>
              <a href={`${getApiUrl().replace('/api', '')}/uploads/${doc.filepath}`} target="_blank" rel="noreferrer">
                {doc.filename}
              </a>
              <button
                className="text-red-500 ml-2"
                onClick={() => deleteDocument(doc.id).then(() => window.location.reload())}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Генерация документов */}
      <div className="mt-4 space-y-2">
        {/* выбор шаблона */}
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="border rounded p-1 w-full"
        >
          <option value="pretension">Претензия</option>
          <option value="isk">Иск</option>
          <option value="dogovor">Договор</option>
        </select>

        {/* выбор контрагента */}
        <select
          value={selectedCounterparty || ""}
          onChange={(e) => setSelectedCounterparty(Number(e.target.value))}
          className="border rounded p-1 w-full"
        >
          <option value="">-- Выберите контрагента --</option>
          {counterparties.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-blue-500 text-white px-3 py-1 rounded w-full"
        >
          {loading ? "Генерация..." : "Сгенерировать документ"}
        </button>
      </div>
    </div>
  );
}

