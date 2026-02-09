import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";
import {
  getKBCategories,
  getKBArticles,
  createKBCategory,
  deleteKBCategory,
  getKBTemplate,
  createKBArticle,
  KBCategory,
  KBArticle
} from "../../lib/api";

export default function KnowledgePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCatTitle, setNewCatTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, arts] = await Promise.all([
        getKBCategories(),
        getKBArticles(selectedCategory || undefined, searchQuery || undefined)
      ]);
      setCategories(cats);
      setArticles(arts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, searchQuery]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;
    try {
      await createKBCategory(newCatTitle);
      setNewCatTitle("");
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Удалить категорию и все её статьи?")) return;
    try {
      await deleteKBCategory(id);
      if (selectedCategory === id) setSelectedCategory(null);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateArticle = async () => {
    if (!selectedCategory) {
      alert("Сначала выберите категорию");
      return;
    }
    try {
      const template = await getKBTemplate();
      const title = prompt("Введите заголовок статьи:");
      if (!title) return;

      const newArt = await createKBArticle({
        title,
        content: template,
        category_id: selectedCategory
      });
      router.push(`/knowledge/${newArt.id}`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in zoom-in duration-1000">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2">
              База знаний
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Ваш правовой и технический навигатор</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <input
                type="text"
                placeholder="Поиск по статьям..."
                className="glass-input w-full !py-3 !text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <button
              onClick={handleCreateArticle}
              disabled={!selectedCategory}
              className="glass-button-primary !px-6 !py-3 !text-[9px] flex items-center gap-2 whitespace-nowrap"
              title={!selectedCategory ? "Выберите категорию слева" : "Создать новую статью"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              Новая статья
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Сайдбар - Категории */}
          <div className="col-span-12 md:col-span-3 space-y-6">
            <div className="glass-card rounded-[2rem] p-6 border-white/5">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                Категории
              </h3>

              <div className="space-y-2">
                <button
                  className={`w-full text-left px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border ${selectedCategory === null
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-white/20 shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
                    : "bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white"
                    }`}
                  onClick={() => setSelectedCategory(null)}
                >
                  Все статьи
                </button>

                {categories.map((c) => (
                  <div key={c.id} className="group relative">
                    <button
                      className={`w-full text-left px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border pr-12 ${selectedCategory === c.id
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-white/20 shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
                        : "bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white"
                        }`}
                      onClick={() => setSelectedCategory(c.id)}
                    >
                      {c.title}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition border border-transparent hover:border-red-400/20"
                      title="Удалить категорию"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCreateCategory} className="mt-8 flex gap-2">
                <input
                  type="text"
                  placeholder="Новая..."
                  className="flex-1 glass-input !py-2 !px-4 !text-[11px] !h-10 border-white/5 focus:border-emerald-500/50"
                  value={newCatTitle}
                  onChange={(e) => setNewCatTitle(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-10 h-10 shrink-0 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-white transition font-black flex items-center justify-center text-xl"
                >
                  +
                </button>
              </form>
            </div>
          </div>

          {/* Список статей */}
          <div className="col-span-12 md:col-span-9">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                <p className="text-white/20 font-black text-[10px] uppercase tracking-[0.3em]">Синхронизация знаний...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="glass-card rounded-[2rem] p-20 text-center border-white/5">
                <div className="text-5xl mb-6 opacity-20">🔎</div>
                <p className="text-white/40 font-black text-xs uppercase tracking-widest">
                  {searchQuery ? "По вашему запросу ничего не найдено" : "В этой категории пока нет статей"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {articles.map((a) => (
                  <Link href={`/knowledge/${a.id}`} key={a.id}>
                    <div className="glass-card hover:bg-white/10 transition-all p-6 rounded-[2rem] flex items-center gap-6 group border-white/5 cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] -mr-16 -mt-16 transition group-hover:bg-emerald-500/10"></div>

                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg border border-white/10 text-white shrink-0 group-hover:scale-110 transition duration-500">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight truncate mb-1">
                          {a.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                            {a.category?.title || "Без категории"}
                          </span>
                          <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                            # {a.id}
                          </span>
                        </div>
                      </div>

                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition duration-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
