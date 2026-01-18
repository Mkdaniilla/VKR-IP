import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getCounterparties,
  createCounterparty,
  updateCounterparty,
  deleteCounterparty,
} from "@/api/counterparties";
import { Counterparty } from "@/types/counterparty";
import Button from "@/components/ui/Button";

export default function CounterpartiesPage() {
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Counterparty>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getCounterparties();
      setCounterparties(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    try {
      if (form.id) {
        await updateCounterparty(form.id, form);
      } else {
        await createCounterparty(form);
      }
      setForm({});
      setEditingId(null);
      loadData();
    } catch (err) {
      alert("Ошибка при сохранении");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить контрагента?")) return;
    try {
      await deleteCounterparty(id);
      loadData();
    } catch (err) {
      alert("Ошибка при удалении");
    }
  }

  function handleEdit(c: Counterparty) {
    setForm(c);
    setEditingId(c.id);
  }

  function handleCancel() {
    setForm({});
    setEditingId(null);
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Modern Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Контрагенты
          </h1>
          <p className="text-gray-600">Управляйте партнёрами и контактами</p>
        </div>

        {/* Creation/Edit Form - Modern Card */}
        <div className="mb-10 p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
              {editingId ? "✏️" : "+"}
            </span>
            {editingId ? "Редактировать контрагента" : "Добавить нового контрагента"}
          </h2>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Название (ООО, ИП, и т.д.)"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              required
            />
            <input
              type="text"
              placeholder="Контактное лицо"
              value={form.contact_person || ""}
              onChange={(e) =>
                setForm({ ...form, contact_person: e.target.value })
              }
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            <input
              type="text"
              placeholder="Телефон"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            <input
              type="text"
              placeholder="Адрес (юридический или фактический)"
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all md:col-span-2"
            />
            <div className="md:col-span-2 flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all"
              >
                {editingId ? "💾 Сохранить изменения" : "✨ Добавить"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl py-3 font-bold transition-all"
                >
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Counterparties Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
          </div>
        ) : counterparties.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🤝</div>
            <p className="text-gray-500 text-lg">Контрагентов пока нет</p>
            <p className="text-gray-400 text-sm mt-2">Добавьте первого партнёра выше</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {counterparties.map((c) => (
              <div
                key={c.id}
                className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl border-2 border-gray-100 hover:border-green-200 overflow-hidden transition-all duration-300"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b-2 border-green-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                      ID: {c.id}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-bold text-xs shadow-md hover:shadow-lg transition-all"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold text-xs shadow-md hover:shadow-lg transition-all"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{c.name}</h3>
                  {c.contact_person && (
                    <p className="text-sm text-gray-600">👤 {c.contact_person}</p>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                  {c.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 font-medium">📧 Email:</span>
                      <a
                        href={`mailto:${c.email}`}
                        className="text-green-600 hover:underline font-medium"
                      >
                        {c.email}
                      </a>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 font-medium">📱 Телефон:</span>
                      <a
                        href={`tel:${c.phone}`}
                        className="text-green-600 hover:underline font-medium"
                      >
                        {c.phone}
                      </a>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-gray-500 font-medium mt-0.5">📍 Адрес:</span>
                      <span className="text-gray-900 font-medium">{c.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
