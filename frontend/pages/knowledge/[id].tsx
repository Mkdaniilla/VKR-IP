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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4 border-b border-gray-100 pb-6">
          <div className="flex-grow">
            <Link href="/knowledge" className="text-sm text-gray-500 hover:text-green-600 mb-2 inline-flex items-center transition-colors font-medium">
              ← Назад в базу знаний
            </Link>
            {editMode ? (
              <input
                type="text"
                className="text-3xl md:text-4xl font-extrabold text-gray-900 border-b-2 border-green-500 w-full focus:outline-none py-1 bg-transparent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            ) : (
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                {article.title}
              </h1>
            )}
            <div className="flex items-center gap-3 mt-4">
              <span className="text-[10px] uppercase tracking-widest font-black px-2 py-1 bg-green-100 text-green-700 rounded-md">
                {article.category?.title}
              </span>
              <span className="text-xs text-gray-400">ID: {article.id}</span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 shadow-sm shadow-green-200 transition font-bold"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setTitle(article.title);
                    setContent(article.content);
                  }}
                  className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl hover:bg-gray-200 transition font-bold"
                >
                  Отмена
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="bg-white border border-green-600 text-green-600 px-6 py-2.5 rounded-xl hover:bg-green-50 transition font-bold"
              >
                Редактировать
              </button>
            )}
            <button
              onClick={handleDelete}
              className="bg-white border border-red-200 text-red-500 px-4 py-2.5 rounded-xl hover:bg-red-50 transition font-bold"
              title="Удалить статью"
            >
              ✕
            </button>
          </div>
        </div>

        <Card className="min-h-[600px] overflow-hidden !p-0">
          {editMode ? (
            <textarea
              className="w-full h-full min-h-[600px] p-8 border-none focus:ring-0 text-gray-700 font-mono text-sm leading-relaxed bg-gray-50/30"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Введите содержание статьи..."
            />
          ) : (
            <div className="p-8 prose prose-green max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed font-sans text-lg">
              {article.content}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
