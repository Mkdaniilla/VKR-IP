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
import {
  Clock,
  Calendar,
  AlertCircle,
  Trash2,
  Plus,
  ArrowRight,
  Notebook,
  Triangle,
  History,
  Bell
} from "lucide-react";

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
        <div className="mb-14 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-400 to-blue-500 mb-4 uppercase tracking-tighter text-left">
            Контроль сроков
          </h1>
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-cyan-400/30"></span>
            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[9px]">Мониторинг критических дат и обязательств</p>
          </div>
        </div>

        {/* Upcoming Deadlines - Highlight Section */}
        <div className="mb-12 p-1 md:p-10 glass-card rounded-[3rem] border-white/5 relative overflow-hidden bg-white/[0.02]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>

          <div className="flex items-center justify-between mb-10 px-6 md:px-0">
            <div className="flex items-center gap-5 relative z-10">
              <div className="bg-rose-500/20 text-rose-400 w-14 h-14 rounded-2xl flex items-center justify-center border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
                <Clock className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                  Ближайшие события
                </h2>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Критический горизонт: 30 дней</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
              <Bell className="w-4 h-4 text-white/20" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Уведомления активны</span>
            </div>
          </div>

          {upcoming.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-white/5 border-dashed">
              <Calendar className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-sm font-black uppercase tracking-widest leading-relaxed">Критичных дедлайнов нет</p>
              <p className="text-white/10 text-[9px] uppercase font-bold mt-2 tracking-widest">Все процессы в штатном режиме</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 relative z-10">
              {upcoming.map((d) => {
                const daysLeft = getDaysRemaining(d.due_date);
                const isOverdue = daysLeft < 0;
                return (
                  <div
                    key={d.id}
                    className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${getDeadlineClass(d.due_date)} glass-card shadow-xl group hover:scale-[1.01] border-opacity-20 flex text-left`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-current flex items-center gap-2 ${isOverdue ? "bg-rose-500/20 animate-pulse" : "bg-white/10"}`}>
                          {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {daysLeft < 0 ? "Просрочено" : daysLeft === 0 ? "Сегодня" : `${daysLeft} дн.`}
                        </div>
                        <div className="flex items-center gap-2 text-white/40">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {new Date(d.due_date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xl font-black text-white mb-4 uppercase tracking-tighter group-hover:text-white transition-colors">
                        {d.kind}
                      </h4>

                      <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-2xl border border-white/5">
                        <Triangle className="w-3 h-3 text-cyan-400 fill-cyan-400 rotate-90" />
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                          {getIPObjectName(d.ip_id)}
                        </p>
                      </div>

                      {d.note && (
                        <div className="flex gap-3 items-start px-4 py-3 bg-black/30 rounded-2xl text-[10px] font-medium text-white/30 italic group-hover:text-white/50 transition-colors">
                          <Notebook className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{d.note}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(d.id)}
                      className="ml-6 flex-shrink-0 w-12 h-12 bg-white/5 text-white/20 rounded-2xl flex items-center justify-center hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-white/5 group-hover:border-rose-500/20"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* Form - Modern Card */}
          <div className="lg:col-span-1 p-10 glass-card rounded-[3rem] border-white/5 relative overflow-hidden bg-white/[0.02] text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>

            <h2 className="text-xl font-black mb-10 text-white uppercase tracking-tighter flex items-center gap-4 relative z-10">
              <div className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg">
                <Plus className="w-5 h-5" strokeWidth={3} />
              </div>
              Новое событие
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Объект ИС</label>
                <CustomSelect
                  value={form.ip_id}
                  onChange={v => setForm({ ...form, ip_id: Number(v) })}
                  placeholder="Выберите объект"
                  options={ipObjects.map(ip => ({ value: ip.id, label: ip.title }))}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Дата события</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-cyan-400 transition-colors" />
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full glass-input !pl-12 font-bold !h-14"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Тип события</label>
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
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Комментарий</label>
                <div className="relative group">
                  <Notebook className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-cyan-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Описание..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full glass-input !pl-12 font-bold !h-14"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="glass-button-primary w-full py-5 flex items-center justify-center gap-3 group"
              >
                Создать
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          {/* All Deadlines */}
          <div className="lg:col-span-2 p-10 glass-card rounded-[3rem] border-white/5 relative bg-white/[0.01] text-left">
            <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] -ml-40 -mt-40 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                <History className="w-7 h-7 text-white/20" />
                Все дедлайны
              </h2>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Всего: {deadlines.length}</span>
            </div>

            {deadlines.length === 0 ? (
              <div className="text-center py-32 bg-white/5 rounded-[2.5rem] border border-white/5 border-dashed">
                <Calendar className="w-16 h-16 text-white/5 mx-auto mb-6" />
                <p className="text-white/20 text-lg font-black uppercase tracking-widest">Список пуст</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {deadlines.map((d) => {
                  const daysLeft = getDaysRemaining(d.due_date);
                  return (
                    <div
                      key={d.id}
                      className={`p-8 rounded-[2.5rem] border transition-all duration-300 ${getDeadlineClass(d.due_date)} glass-card border-opacity-10 group hover:bg-white/[0.04]`}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-4 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40 group-hover:text-white transition-colors">
                              {daysLeft < 0 ? "Просрочено" : daysLeft === 0 ? "Сегодня" : `${daysLeft}д`}
                            </span>
                            <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest">
                              <Calendar className="w-3 h-3" />
                              {new Date(d.due_date).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                          <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2 group-hover:text-cyan-400 transition-colors">
                            {d.kind}
                          </h4>
                          <div className="flex items-center gap-3">
                            <Triangle className="w-2 h-2 text-white/20 fill-white/20 rotate-90" />
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                              {getIPObjectName(d.ip_id)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="py-4 px-8 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-white/5 group-hover:border-rose-500/20 flex items-center gap-3"
                        >
                          <Trash2 className="w-4 h-4" />
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
      </div>
    </DashboardLayout>
  );
}
