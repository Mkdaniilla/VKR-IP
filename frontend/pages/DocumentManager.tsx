"use client";

import { useState, useEffect } from "react";
import { uploadDocument, getDocuments, deleteDocument } from "../lib/api";

interface Document {
  id: number;
  filename: string;
  filepath: string;
  uploaded_at: string;
}

export default function DocumentManager({ ipId }: { ipId: number }) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    try {
      setLoading(true);
      const data = await getDocuments(ipId);
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    try {
      setLoading(true);
      await uploadDocument(ipId, e.target.files[0]);
      await loadDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteDocument(id);
      setDocs(docs.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-4 border rounded-xl bg-white shadow-md">
      <h2 className="text-lg font-semibold mb-3">📂 Документы</h2>

      <input type="file" onChange={handleUpload} className="mb-4" />

      {loading && <p className="text-gray-500">Загрузка...</p>}

      {docs.length === 0 && !loading && (
        <p className="text-gray-500">Документов пока нет</p>
      )}

      <ul className="space-y-2">
        {docs.map((doc) => (
          <li
            key={doc.id}
            className="flex justify-between items-center border p-2 rounded"
          >
            <span>{doc.filename}</span>
            <div className="space-x-2">
              <a
                href={`/${doc.filepath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Открыть
              </a>
              <button
                onClick={() => handleDelete(doc.id)}
                className="text-red-600 hover:underline"
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
