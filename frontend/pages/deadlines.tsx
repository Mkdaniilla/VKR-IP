import { useEffect, useState } from "react";
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

  if (diffDays < 0) return "bg-red-100 border-red-300 text-red-900"; // Просрочено
  if (diffDays <= 7) return "bg-orange-100 border-orange-300 text-orange-900";
  if (diffDays <= 14) return "bg-yellow-100 border-yellow-300 text-yellow-900";
  if (diffDays <= 30) return "bg-green-100 border-green-300 text-green-900";
  return "bg-blue-50 border-blue-200 text-blue-900";
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
        <div className="mb-10">
          <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Контроль сроков
          </h1>
          <p className="text-gray-600">Отслеживайте важные даты и дедлайны по вашим объектам ИС</p>
        </div>

        {/* Upcoming Deadlines - Highlight Section */}
        <div className="mb-10 p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl shadow-xl border-2 border-green-200">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">
              ⏰
            </span>
            <h2 className="text-2xl font-black text-gray-900">
              Ближайшие дедлайны (30 дней)
            </h2>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-green-600 text-lg font-medium">✨ Нет дедлайнов в ближайшие 30 дней!</p>
              <p className="text-gray-500 text-sm mt-2">У вас всё под контролем</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((d) => {
                const daysLeft = getDaysRemaining(d.due_date);
                return (
                  <div
                    key={d.id}
                    className={`p-5 rounded-2xl border-2 ${getDeadlineClass(
                      d.due_date
                    )} shadow-md hover:shadow-lg transition-all`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-black">
                            {daysLeft < 0 ? "⚠️ ПРОСРОЧЕНО" : daysLeft === 0 ? "🔥 СЕГОДНЯ" : `⏳ ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}`}
                          </span>
                          <span className="text-sm font-bold bg-white/50 px-3 py-1 rounded-full">
                            {new Date(d.due_date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold mb-1">{d.kind}</h4>
                        <p className="text-sm font-medium opacity-80">
                          📦 {getIPObjectName(d.ip_id)}
                        </p>
                        {d.note && (
                          <p className="text-sm mt-2 font-medium opacity-70">
                            💬 {d.note}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="ml-4 px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold text-sm shadow-md hover:shadow-lg transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form - Modern Card */}
        <div className="mb-10 p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
              +
            </span>
            Добавить новый дедлайн
          </h2>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Объект ИС
              </label>
              <select
                value={form.ip_id}
                onChange={(e) =>
                  setForm({ ...form, ip_id: Number(e.target.value) })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              >
                <option value={0}>Выберите объект</option>
                {ipObjects.map((ip) => (
                  <option key={ip.id} value={ip.id}>
                    {ip.title} (ID: {ip.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Дата дедлайна
              </label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Тип дедлайна
              </label>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              >
                <option value="">Выберите тип</option>
                <option value="Продление регистрации">Продление регистрации</option>
                <option value="Подача заявки">Подача заявки</option>
                <option value="Ответ на экспертизу">Ответ на экспертизу</option>
                <option value="Уплата пошлины">Уплата пошлины</option>
                <option value="Оплата контракта">Оплата контракта</option>
                <option value="Срок действия договора">Срок действия договора</option>
                <option value="Другое">Другое</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Комментарий (опционально)
              </label>
              <input
                type="text"
                placeholder="Дополнительная информация"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all"
              >
                ✨ Добавить дедлайн
              </Button>
            </div>
          </form>
        </div>

        {/* All Deadlines */}
        <div className="p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            📋 Все дедлайны
          </h2>
          {deadlines.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-500 text-lg">Пока нет дедлайнов</p>
              <p className="text-gray-400 text-sm mt-2">Добавьте первый дедлайн выше</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deadlines.map((d) => {
                const daysLeft = getDaysRemaining(d.due_date);
                return (
                  <div
                    key={d.id}
                    className={`p-6 rounded-2xl border-2 ${getDeadlineClass(
                      d.due_date
                    )} shadow-md hover:shadow-lg transition-all`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold bg-white/50 px-3 py-1 rounded-full">
                            ID: {d.id}
                          </span>
                          <span className="text-sm font-bold">
                            {daysLeft < 0 ? "⚠️ Просрочено" : daysLeft === 0 ? "🔥 Сегодня" : `⏳ Осталось ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}`}
                          </span>
                          <span className="text-sm font-bold">
                            📅 {new Date(d.due_date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold mb-1">{d.kind}</h4>
                        <p className="text-sm font-medium opacity-80">
                          📦 {getIPObjectName(d.ip_id)}
                        </p>
                        {d.note && (
                          <p className="text-sm mt-2 font-medium opacity-70">
                            💬 {d.note}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="ml-4 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold shadow-md hover:shadow-lg transition-all"
                      >
                        🗑 Удалить
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
