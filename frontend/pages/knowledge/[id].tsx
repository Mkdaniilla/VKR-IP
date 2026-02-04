import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";
import { getKBArticle, updateKBArticle, deleteKBArticle, KBArticle } from "../../lib/api";

export default function ArticlePage() {
  const router = useRouter();
  const { id } = router.query;

  const [article, setArticle] = useState<KBArticle | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getKBArticle(Number(id));
        setArticle(data);
        setTitle(data.title);
        setContent(data.content);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    if (!article) return;
    try {
      const updated = await updateKBArticle(article.id, { title, content });
      setArticle(updated);
      setEditMode(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    if (!confirm("Удалить эту статью?")) return;
    try {
      await deleteKBArticle(article.id);
      router.push("/knowledge");
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    </DashboardLayout>
  );

  if (!article) return (
    <DashboardLayout>
      <div className="p-6 text-red-600 bg-red-50 rounded-xl border border-red-100">
        Статья не найдена или у вас нет прав доступа.
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-8 relative z-10">
          <div className="flex-grow min-w-0">
            <Link href="/knowledge" className="inline-flex items-center gap-2 text-[10px] font-black text-white/30 hover:text-emerald-400 uppercase tracking-[0.3em] mb-6 transition-colors group">
              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
              </span>
              Вернуться в базу
            </Link>

            {editMode ? (
              <input
                type="text"
                className="text-4xl md:text-5xl font-black text-white bg-transparent border-b-2 border-emerald-500/50 w-full focus:outline-none focus:border-emerald-500 py-1 transition-all uppercase tracking-tight"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            ) : (
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase tracking-tight drop-shadow-xl">
                {article.title}
              </h1>
            )}

            <div className="flex items-center gap-4 mt-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-xl border border-emerald-400/20">
                {article.category?.title}
              </span>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                ID: {article.id}
              </span>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  className="glass-button-primary !px-8 !py-3 !text-[10px]"
                >
                  Зафиксировать
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setTitle(article.title);
                    setContent(article.content);
                  }}
                  className="bg-white/5 border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest px-8 py-3 rounded-2xl hover:bg-white/10 hover:text-white transition"
                >
                  Отмена
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="bg-white/5 border border-emerald-500/30 text-emerald-400 font-black text-[10px] uppercase tracking-widest px-8 py-3 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500 transition shadow-[0_0_20px_rgba(16,185,129,0.1)]"
              >
                Редактировать
              </button>
            )}
            <button
              onClick={handleDelete}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition shadow-lg group"
              title="Удалить статью"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        <div className="glass-card rounded-[3rem] border-white/5 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

          {editMode ? (
            <textarea
              className="w-full h-full min-h-[600px] p-10 bg-black/20 border-none focus:ring-0 text-white/80 font-mono text-base leading-relaxed placeholder:text-white/10"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Напишите здесь содержание статьи в формате Markdown..."
            />
          ) : (
            <div className="p-10 md:p-16 prose prose-invert prose-emerald max-w-none whitespace-pre-wrap text-white/90 leading-relaxed font-sans text-xl">
              {article.content}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
