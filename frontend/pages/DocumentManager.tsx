"use client";

import { useState, useEffect } from "react";
import { uploadDocument, getDocuments, deleteDocument } from "../lib/api";
import {
  FileText,
  UploadCloud,
  ExternalLink,
  Trash2,
  ShieldCheck,
  Loader2,
  File
} from "lucide-react";

interface Document {
  id: number;
  filename: string;
  filepath: string;
  uploaded_at: string;
}

export default function DocumentManager({ ipId }: { ipId: number }) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocs();
  }, [ipId]);

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
      setUploading(true);
      await uploadDocument(ipId, e.target.files[0]);
      await loadDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить документ?")) return;
    try {
      await deleteDocument(id);
      setDocs(docs.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="glass-card p-8 rounded-[2rem] border-white/5 relative overflow-hidden bg-white/[0.01]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
          Архив документов
        </h2>
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{docs.length} файлов</span>
      </div>

      {/* Upload Zone */}
      <div className="relative mb-8 group">
        <input
          type="file"
          onChange={handleUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          disabled={uploading}
          title="Выбрать файл"
          aria-label="Загрузить документ"
        />
        <div className={`p-8 border-2 border-dashed rounded-[1.5rem] transition-all duration-300 flex flex-col items-center justify-center gap-4 ${uploading ? "bg-cyan-500/5 border-cyan-500/30" : "bg-white/5 border-white/10 group-hover:bg-white/10 group-hover:border-white/20"
          }`}>
          {uploading ? (
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          ) : (
            <UploadCloud className="w-10 h-10 text-white/20 group-hover:text-cyan-400 transition-colors" />
          )}
          <div className="text-center">
            <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-2">
              {uploading ? "Синхронизация..." : "Загрузить документ"}
            </p>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">PDF, DOCX или Изображения</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Загрузка репозитория...</span>
        </div>
      )}

      {docs.length === 0 && !loading && (
        <div className="py-20 text-center bg-black/20 rounded-[1.5rem] border border-white/5">
          <FileText className="w-12 h-12 text-white/5 mx-auto mb-4" />
          <p className="text-white/20 text-xs font-black uppercase tracking-widest">Документация отсутствует</p>
        </div>
      )}

      <div className="space-y-3 relative z-10 text-left">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="flex justify-between items-center bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <File className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white uppercase tracking-tight truncate group-hover:text-cyan-400 transition-colors">
                  {doc.filename}
                </p>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">
                  {new Date(doc.uploaded_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={doc.filepath.startsWith('http') ? doc.filepath : `/${doc.filepath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/20 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all"
                title="Просмотр"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => handleDelete(doc.id)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
