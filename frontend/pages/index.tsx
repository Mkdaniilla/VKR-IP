import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <header className="bg-white/70 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-emerald-700 font-semibold text-xl">
            MDM IP
          </Link>

          <nav className="hidden md:flex gap-6 text-slate-700">
            <a href="#features" className="hover:text-emerald-700">Возможности</a>
            <a href="#contacts" className="hover:text-emerald-700">Контакты</a>
          </nav>

          <div className="flex gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
            >
              Войти
            </Link>
            <a
              href="#contacts"
              className="px-4 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Запросить демо
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold leading-tight text-emerald-800">
            Платформа управления интеллектуальной собственностью
          </h1>

          <p className="mt-4 text-slate-600 text-lg">
            Реестр объектов ИС, автодокументы и контроль сроков — в одном рабочем пространстве.
            ИИ может помогать с подсказками и черновиками, но не заменяет юриста и не является экспертизой.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="px-5 py-3 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Перейти в кабинет
            </Link>
            <a
              href="#features"
              className="px-5 py-3 rounded-xl bg-white border hover:bg-emerald-50 text-emerald-700"
            >
              Узнать больше
            </a>
            <a
              href="#contacts"
              className="px-5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800"
            >
              Запросить демо
            </a>
          </div>

          <div className="mt-6 text-sm text-slate-500">
            * MDM IP — инструмент управления и подготовки документов. Не осуществляет регистрацию прав и не заменяет юридическую консультацию.
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur border rounded-2xl shadow p-6">
          <div className="text-sm text-slate-500 mb-3">Что внутри</div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ["Единый реестр ИС", "Структура по объектам: ПО, ТЗ, АП, договоры и файлы."],
              ["Автодокументы", "Шаблоны документов и черновики под конкретный объект."],
              ["Контроль сроков", "Ключевые даты, напоминания, чек-листы по действиям."],
              ["Централизованное управление", "Одна точка правды для ИС: всё собрано и связано."],
            ].map(([h, p]) => (
              <div key={h} className="border rounded-xl p-4 hover:shadow transition bg-white">
                <div className="text-emerald-700 font-medium">{h}</div>
                <div className="text-sm text-slate-600">{p}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <section id="features" className="max-w-6xl mx-auto px-4 pb-14">
        <div className="bg-white border rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-emerald-800">Возможности</h2>
          <p className="mt-2 text-slate-600">
            Только то, что отражает текущий функционал и юридически корректно формулируется.
          </p>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border p-5 bg-emerald-50/40">
              <div className="text-emerald-700 font-semibold">Реестр объектов</div>
              <div className="mt-2 text-sm text-slate-600">
                Карточки объектов ИС: описание, статус, файлы, ссылки, история изменений в данных объекта.
              </div>
            </div>

            <div className="rounded-2xl border p-5 bg-white">
              <div className="text-emerald-700 font-semibold">Документы</div>
              <div className="mt-2 text-sm text-slate-600">
                Генерация и хранение документов: шаблоны, черновики, экспорт.
              </div>
            </div>

            <div className="rounded-2xl border p-5 bg-white">
              <div className="text-emerald-700 font-semibold">Сроки и контроль</div>
              <div className="mt-2 text-sm text-slate-600">
                Календарь ключевых дат и напоминания: продления, пошлины, контрольные точки.
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="px-5 py-3 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Войти
            </Link>
            <a
              href="#contacts"
              className="px-5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800"
            >
              Запросить демо
            </a>
          </div>
        </div>
      </section>

      <section id="contacts" className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-semibold text-emerald-800 mb-6">Контакты</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-2xl p-6">
            <div className="text-slate-600 mb-3">
              Напишите — поможем разобраться и предложим подходящий формат работы.
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = e.currentTarget as HTMLFormElement;
                const d = new FormData(f);

                const body = encodeURIComponent(
                  `Имя: ${d.get("name")}\nEmail: ${d.get("email")}\nСообщение:\n${d.get("msg")}`
                );

                location.href = `mailto:support@mdmip.local?subject=${encodeURIComponent(
                  "Запрос с сайта MDM IP"
                )}&body=${body}`;
              }}
              className="space-y-3"
            >
              <input
                name="name"
                className="w-full border rounded-xl px-4 py-2"
                placeholder="Ваше имя"
                required
              />
              <input
                name="email"
                type="email"
                className="w-full border rounded-xl px-4 py-2"
                placeholder="Email"
                required
              />
              <textarea
                name="msg"
                rows={4}
                className="w-full border rounded-xl px-4 py-2"
                placeholder="Сообщение"
                required
              />
              <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                Отправить
              </button>
            </form>

            <div className="mt-4 text-xs text-slate-500">
              * Нажимая «Отправить», вы формируете письмо в почтовом клиенте (данные не сохраняются на сайте).
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border rounded-2xl p-6">
            <div className="text-slate-700">
              Телеграм:{" "}
              <a className="text-emerald-700 hover:underline" href="https://t.me/" target="_blank" rel="noreferrer">
                t.me/mdmip
              </a>
            </div>
            <div className="mt-2 text-slate-700">
              Почта:{" "}
              <a className="text-emerald-700 hover:underline" href="mailto:support@mdmip.local">
                support@mdmip.local
              </a>
            </div>

            <div className="mt-6 text-sm text-slate-600">
              Можно написать «нужна демо-сессия» — и я предложу удобное время и формат.
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-white/70 border">
              <div className="text-emerald-800 font-semibold">Юридическая корректность</div>
              <div className="mt-2 text-sm text-slate-600">
                MDM IP помогает управлять данными, документами и сроками по ИС. Платформа не является органом регистрации,
                не выдаёт экспертных заключений и не заменяет профессиональную юридическую помощь.
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-slate-500 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>© {new Date().getFullYear()} MDM IP</div>
          <div className="flex gap-4">
            <a className="hover:text-emerald-700" href="#features">Возможности</a>
            <a className="hover:text-emerald-700" href="#contacts">Контакты</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
