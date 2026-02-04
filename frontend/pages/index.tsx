import Link from "next/link";
import KBAgentFox from "../components/KBAgentFox";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30">
      {/* Hero Section Background */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[60%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      </div>

      <header className="fixed top-0 w-full z-50 transition-all duration-300 border-b border-white/5 bg-[#020617]/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-400 tracking-tighter uppercase">
            VKR IP
          </Link>

          <nav className="hidden md:flex gap-10">
            {['Возможности', 'Технологии', 'Контакты'].map((item) => (
              <a
                key={item}
                href={`#${item === 'Возможности' ? 'features' : item.toLowerCase()}`}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-cyan-400 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/10 hover:bg-white/5 transition-all"
            >
              Войти
            </Link>
            <a
              href="#contacts"
              className="glass-button-primary px-8 py-2.5 text-[10px] font-black uppercase tracking-[0.2em]"
            >
              Начать работу
            </a>
          </div>
        </div>
      </header>

      <main className="relative pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-left duration-700">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,1)]"></span>
              Next Gen IP Management
            </div>

            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase animate-in slide-in-from-left duration-700 delay-100">
              Экосистема <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Интеллекта</span>
            </h1>

            <p className="text-lg text-white/40 leading-relaxed font-medium max-w-lg animate-in slide-in-from-left duration-700 delay-200">
              Управление ИС, автоматизация документов и контроль сроков на базе ИИ. <br />
              <span className="text-white/60">Ваш цифровой патентный поверенный в облаке.</span>
            </p>

            <div className="flex flex-wrap gap-4 pt-4 animate-in slide-in-from-left duration-700 delay-300">
              <Link
                href="/login"
                className="glass-button-primary px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(34,211,238,0.1)]"
              >
                Создать кабинет
              </Link>
              <a
                href="#features"
                className="px-10 py-5 rounded-full border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
              >
                Исследовать →
              </a>
            </div>
          </div>

          <div className="relative animate-in zoom-in duration-1000">
            <div className="glass-card p-4 rounded-[3rem] border-white/10 shadow-[0_0_100px_rgba(34,211,238,0.1)] overflow-hidden">
              <div className="bg-[#0f172a] rounded-[2.5rem] overflow-hidden border border-white/5">
                <div className="bg-white/5 px-6 py-3 flex gap-2 border-b border-white/5">
                  <span className="w-2 h-2 rounded-full bg-rose-500/50"></span>
                  <span className="w-2 h-2 rounded-full bg-amber-500/50"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>
                </div>
                <div className="p-8 space-y-6">
                  <div className="h-4 bg-white/5 rounded-full w-2/3"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-cyan-500/5 rounded-3xl border border-white/5"></div>
                    <div className="h-32 bg-blue-500/5 rounded-3xl border border-white/5"></div>
                  </div>
                  <div className="h-4 bg-white/5 rounded-full w-full"></div>
                  <div className="h-4 bg-white/5 rounded-full w-4/5"></div>
                </div>
              </div>
            </div>
            {/* Decors */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-[60px]"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-[60px]"></div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.5em]">Функции платформы</h2>
          <p className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Всё для вашей ИС</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { h: "Центр управления", p: "Единый стек всех ваших патентов, программ для ЭВМ и брендов.", i: "💠" },
            { h: "AI Оценка", p: "Умный калькулятор рыночной стоимости с генерацией отчетов.", i: "⚖️" },
            { h: "Смарт-Контроль", p: "Умные уведомления о сроках продления и уплате пошлин.", i: "🕒" },
            { h: "Автодокументы", p: "Генератор юридических документов по вашим шаблонам.", i: "⚡" },
          ].map((f, idx) => (
            <div key={f.h} className="glass-card p-10 rounded-[2.5rem] border-white/5 group hover:border-cyan-500/30 transition-all hover:translate-y-[-10px] duration-500">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{f.i}</div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-4">{f.h}</h3>
              <p className="text-sm text-white/40 leading-relaxed font-medium">{f.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section id="contacts" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="glass-card p-12 md:p-20 rounded-[4rem] border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px]"></div>

          <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
            <div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-8">
                Готовы к новому уровню?
              </h2>
              <p className="text-lg text-white/40 mb-10 font-medium">
                Напишите нам, чтобы получить персональную демо-версию или обсудить интеграцию.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <span className="w-12 h-12 glass-card flex items-center justify-center rounded-2xl border-white/10">📧</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-white/60">support@vkr-ip.pro</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="w-12 h-12 glass-card flex items-center justify-center rounded-2xl border-white/10">💬</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-white/60">@vkr_ip_bot</span>
                </div>
              </div>
            </div>

            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Спасибо! Мы свяжемся с вами в ближайшее время.");
              }}
            >
              <div className="grid md:grid-cols-2 gap-6">
                <input className="glass-input" placeholder="Ваше имя" required />
                <input className="glass-input" type="email" placeholder="Email" required />
              </div>
              <textarea
                rows={4}
                className="glass-input"
                placeholder="Расскажите о вашем проекте"
                required
              />
              <button className="glass-button-primary w-full py-5 text-[11px] font-black uppercase tracking-[0.3em]">
                Отправить запрос →
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-2xl font-black text-white uppercase tracking-tighter">VKR IP</div>
          <div className="flex gap-10">
            {['Лигал', 'Конфиденциальность', 'Cookie'].map(l => (
              <a key={l} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors" href="#">{l}</a>
            ))}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/10">
            © {new Date().getFullYear()} VKR Intellectual Property System. All Rights Reserved.
          </p>
        </div>
      </footer>
      <KBAgentFox />
    </div>
  );
}
