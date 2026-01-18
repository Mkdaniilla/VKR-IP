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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4 py-8">
        {/* Сайдбар */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <SectionTitle className="text-lg mb-4">Категории</SectionTitle>
            <button
              className={`block w-full text-left px-3 py-2 rounded-lg mb-2 transition ${selectedCategory === null ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
              onClick={() => setSelectedCategory(null)}
            >
              Все статьи
            </button>
            {categories.map((c) => (
              <div key={c.id} className="group flex items-center justify-between mb-2">
                <button
                  className={`flex-grow text-left px-3 py-2 rounded-l-lg transition ${selectedCategory === c.id ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  onClick={() => setSelectedCategory(c.id)}
                >
                  {c.title}
                </button>
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  className="bg-gray-100 px-3 py-2 rounded-r-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition"
                  title="Удалить категорию"
                >
                  ✕
                </button>
              </div>
            ))}

            <form onSubmit={handleCreateCategory} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Новая категория"
                className="w-full border rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-green-500"
                value={newCatTitle}
                onChange={(e) => setNewCatTitle(e.target.value)}
              />
              <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 font-bold">+</button>
            </form>
          </Card>
        </div>

        {/* Список статей */}
        <div className="md:col-span-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <SectionTitle className="text-xl mb-0">Статьи базы знаний</SectionTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Поиск по статьям..."
                className="flex-grow border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={handleCreateArticle}
                disabled={!selectedCategory}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
                title={!selectedCategory ? "Выберите категорию слева" : "Создать новую статью"}
              >
                + Новая статья
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : articles.length === 0 ? (
            <p className="text-gray-500 italic p-4 bg-white rounded-lg shadow-sm border text-center">
              {searchQuery ? "По вашему запросу ничего не найдено" : "В этой категории пока нет статей"}
            </p>
          ) : (
            <ul className="space-y-3">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link href={`/knowledge/${a.id}`}>
                    <div className="block px-6 py-4 bg-white rounded-xl shadow-sm border border-transparent hover:border-green-200 hover:shadow-md transition cursor-pointer group">
                      <h3 className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">{a.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-green-50 text-green-600 rounded">
                          {a.category?.title || "Без категории"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
