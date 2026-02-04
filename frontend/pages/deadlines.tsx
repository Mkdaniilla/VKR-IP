import { useEffect, useState } from "react";
import CustomSelect from "../components/CustomSelect";
import DashboardLayout from "../components/DashboardLayout";
import {
  getDeadlines,
  getUpcomingDeadlines,
  createDeadline,
  deleteDeadline,
  Deadline,
  getIPObjects,
} from "../lib/api";

import Button from "../components/ui/Button";

// утилита для подсветки по сроку
function getDeadlineClass(dueDate: string) {
  const today = new Date();
  const target = new Date(dueDate);
  const diffDays = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "bg-rose-500/10 border-rose-500/20 text-rose-400"; // Просрочено
  if (diffDays <= 7) return "bg-orange-500/10 border-orange-500/20 text-orange-400";
  if (diffDays <= 14) return "bg-amber-500/10 border-amber-500/20 text-amber-400";
  if (diffDays <= 30) return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
  return "bg-white/5 border-white/10 text-white/50";
}

function getDaysRemaining(dueDate: string): number {
  const today = new Date();
  const target = new Date(dueDate);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// сортировка по дате
function sortByDate(arr: Deadline[]) {
  return [...arr].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );
}

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [upcoming, setUpcoming] = useState<Deadline[]>([]);
  const [ipObjects, setIpObjects] = useState<any[]>([]);
  const [form, setForm] = useState({
    ip_id: 0,
    due_date: "",
    kind: "",
    note: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [deadlinesData, upcomingData, ipData] = await Promise.all([
        getDeadlines(),
        getUpcomingDeadlines(30),
        getIPObjects(),
      ]);
      setDeadlines(sortByDate(deadlinesData));
      setUpcoming(sortByDate(upcomingData));
      setIpObjects(ipData);
      if (ipData.length > 0 && form.ip_id === 0) {
        setForm(prev => ({ ...prev, ip_id: ipData[0].id }));
      }
    } catch (err) {
      console.error("Ошибка загрузки данных", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ip_id || !form.due_date || !form.kind) {
      alert("Заполните все обязательные поля");
      return;
    }
    try {
      const newDeadline = await createDeadline(form);
      const deadlineObj = {
        ...form,
        ...newDeadline,
        notified: false,
      } as Deadline;
      setDeadlines(sortByDate([...deadlines, deadlineObj]));
      const upcomingData = await getUpcomingDeadlines(30);
      setUpcoming(sortByDate(upcomingData));
      setForm({ ip_id: ipObjects[0]?.id || 0, due_date: "", kind: "", note: "" });
    } catch (err) {
      console.error(err);
      alert("Ошибка при создании дедлайна");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить дедлайн?")) return;
    try {
      await deleteDeadline(id);
      setDeadlines(sortByDate(deadlines.filter((d) => d.id !== id)));
      const upcomingData = await getUpcomingDeadlines(30);
      setUpcoming(sortByDate(upcomingData));
    } catch (err) {
      console.error(err);
      alert("Ошибка при удалении дедлайна");
    }
  }

  const getIPObjectName = (ipId: number) => {
    const obj = ipObjects.find(ip => ip.id === ipId);
    return obj ? obj.title : `ID ${ipId}`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Modern Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-400 to-blue-500 mb-4 uppercase tracking-tighter">
            Контроль сроков
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Мониторинг критических дат и обязательств</p>
        </div>

        {/* Upcoming Deadlines - Highlight Section */}
        <div className="mb-10 p-10 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>

          <div className="flex items-center gap-4 mb-8 relative z-10">
            <span className="bg-rose-500/20 text-rose-400 w-12 h-12 rounded-2xl flex items-center justify-center text-xl border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              ⏰
            </span>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              Ближайшие события
            </h2>
          </div>

          {upcoming.length === 0 ? (
            <div className="text-center py-10 opacity-40">
              <p className="text-white text-lg font-black uppercase tracking-widest leading-relaxed">Критичных дедлайнов нет</p>
              <p className="text-white/50 text-[10px] uppercase font-bold mt-2">Все процессы в штатном режиме</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 relative z-10">
              {upcoming.map((d) => {
                const daysLeft = getDaysRemaining(d.due_date);
                const isOverdue = daysLeft < 0;
                return (
                  <div
                    key={d.id}
                    className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${getDeadlineClass(d.due_date)} glass-card shadow-2xl group hover:scale-[1.02] border-opacity-30`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-current ${isOverdue ? 'bg-rose-500/20 animate-pulse' : 'bg-white/10'}`}>
                            {daysLeft < 0 ? "⚠️ ПРОСРОЧЕНО" : daysLeft === 0 ? "🔥 СЕГОДНЯ" : `${daysLeft}д`}
                          </span>
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                            {new Date(d.due_date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{d.kind}</h4>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                          <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest">
                            {getIPObjectName(d.ip_id)}
                          </p>
                        </div>
                        {d.note && (
                          <div className="p-3 bg-black/20 rounded-xl text-[10px] font-medium text-white/40 italic">
                            "{d.note}"
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-3 bg-white/5 text-white/20 rounded-xl hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-white/5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form - Modern Card */}
        <div className="mb-10 p-10 glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>

          <h2 className="text-xl font-black mb-8 text-white uppercase tracking-tighter flex items-center gap-4 relative z-10">
            <span className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-lg">
              +
            </span>
            Новый дедлайн
          </h2>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Объект ИС</label>
              <CustomSelect
                value={form.ip_id}
                onChange={v => setForm({ ...form, ip_id: Number(v) })}
                placeholder="Выберите объект"
                options={ipObjects.map(ip => ({ value: ip.id, label: ip.title }))}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Дата события</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full glass-input font-bold"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Тип события</label>
              <CustomSelect
                value={form.kind}
                onChange={v => setForm({ ...form, kind: String(v) })}
                placeholder="Выберите тип"
                options={[
                  { value: "Продление регистрации", label: "Продление регистрации" },
                  { value: "Подача заявки", label: "Подача заявки" },
                  { value: "Ответ на экспертизу", label: "Ответ на экспертизу" },
                  { value: "Уплата пошлины", label: "Уплата пошлины" },
                  { value: "Оплата контракта", label: "Оплата контракта" },
                  { value: "Срок действия договора", label: "Срок действия договора" },
                  { value: "Другое", label: "Другое" },
                ]}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Комментарий</label>
              <input
                type="text"
                placeholder="Краткое описание..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full glass-input font-bold"
              />
            </div>

            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                className="glass-button-primary w-full py-4"
              >
                Добавить в календарь
              </button>
            </div>
          </form>
        </div>

        {/* All Deadlines */}
        <div className="p-10 glass-card rounded-[2.5rem] border-white/5 relative">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-10 flex items-center gap-4">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            Архив и текущие дедлайны
          </h2>

          {deadlines.length === 0 ? (
            <div className="text-center py-20 opacity-30">
              <div className="text-6xl mb-6">📅</div>
              <p className="text-white text-lg font-black uppercase tracking-widest">Список пуст</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {deadlines.map((d) => {
                const daysLeft = getDaysRemaining(d.due_date);
                return (
                  <div
                    key={d.id}
                    className={`p-8 rounded-[2rem] border transition-all duration-300 ${getDeadlineClass(d.due_date)} glass-card border-opacity-10 group`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded-lg">
                            ID: {d.id}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {daysLeft < 0 ? "⚠️ Просрочено" : daysLeft === 0 ? "🔥 Сегодня" : `⏳ ${daysLeft}д`}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            📅 {new Date(d.due_date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-cyan-400 transition-colors">{d.kind}</h4>
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                          {getIPObjectName(d.ip_id)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="py-3 px-8 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-white/5"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
