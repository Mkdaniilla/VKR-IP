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
        await createCounterparty(form as Omit<Counterparty, "id" | "owner_id">);
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
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-400 to-blue-500 mb-4 uppercase tracking-tighter">
            Контрагенты
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Управление партнёрами и контактами</p>
        </div>

        {/* Creation/Edit Form - Modern Card */}
        <div className="mb-10 p-10 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>

          <h2 className="text-xl font-black mb-8 text-white uppercase tracking-tighter flex items-center gap-4 relative z-10">
            <span className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-lg">
              {editingId ? "✏️" : "+"}
            </span>
            {editingId ? "Редактирование" : "Новый контрагент"}
          </h2>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6 relative z-10">
            <input
              type="text"
              placeholder="Название (ООО, ИП, и т.д.)"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="glass-input font-bold"
              required
            />
            <input
              type="text"
              placeholder="Контактное лицо"
              value={form.contact_person || ""}
              onChange={(e) =>
                setForm({ ...form, contact_person: e.target.value })
              }
              className="glass-input font-bold"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="glass-input font-bold"
            />
            <input
              type="text"
              placeholder="Телефон"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="glass-input font-bold"
            />
            <input
              type="text"
              placeholder="Юридический адрес"
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="glass-input font-bold md:col-span-2"
            />
            <div className="md:col-span-2 flex gap-4 pt-4">
              <button
                type="submit"
                className="glass-button-primary flex-1 py-4"
              >
                {editingId ? "Сохранить изменения" : "Добавить в базу"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="glass-button-secondary py-4"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Counterparties Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]"></div>
          </div>
        ) : counterparties.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-[2.5rem] border-white/5">
            <div className="text-6xl mb-6 opacity-30">🤝</div>
            <p className="text-white/40 text-lg font-bold uppercase tracking-widest leading-relaxed">Список контрагентов пуст</p>
            <p className="text-white/20 text-xs font-bold mt-2">Добавьте нового партнёра через форму выше</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {counterparties.map((c) => (
              <div
                key={c.id}
                className="group glass-card rounded-[2.5rem] overflow-hidden transition-all duration-500 border-white/5 hover:border-white/10"
              >
                {/* Header */}
                <div className="bg-white/5 p-8 border-b border-white/5">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full uppercase tracking-widest border border-cyan-400/20">
                      ID: {c.id}
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-3 bg-white/5 text-white/40 rounded-xl hover:text-white hover:bg-white/10 transition-all border border-white/5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-3 bg-rose-500/10 text-rose-500/40 rounded-xl hover:text-rose-500 hover:bg-rose-500/20 transition-all border border-rose-500/10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">{c.name}</h3>
                  {c.contact_person && (
                    <div className="flex items-center gap-2 mt-4 text-white/30 font-bold text-xs uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      {c.contact_person}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                  {c.email && (
                    <div className="flex flex-col gap-2 group/item">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Email</span>
                      <a
                        href={`mailto:${c.email}`}
                        className="text-sm text-cyan-400 font-bold hover:text-white transition-colors flex items-center gap-2"
                      >
                        {c.email}
                      </a>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex flex-col gap-2 group/item">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Телефон</span>
                      <a
                        href={`tel:${c.phone}`}
                        className="text-sm text-white font-bold hover:text-cyan-400 transition-colors flex items-center gap-2"
                      >
                        {c.phone}
                      </a>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex flex-col gap-2 group/item">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Юридический адрес</span>
                      <span className="text-sm text-white/70 font-medium leading-relaxed">{c.address}</span>
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
