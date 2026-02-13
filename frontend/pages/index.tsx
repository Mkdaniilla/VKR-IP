import Link from "next/link";
import Head from "next/head";
import KBAgentFox from "../components/KBAgentFox";
import {
  Shield,
  Zap,
  BarChart3,
  Clock,
  FileCode2,
  Mail,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  Layout,
  Globe,
  Database,
  Cpu,
  Plus
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30">
      <Head>
        <title>VKR IP — Интеллектуальное управление и оценка ИС</title>
        <meta name="description" content="Профессиональная LegalTech платформа для аудита, мониторинга и финансовой оценки объектов интеллектуальной собственности с помощью ИИ." />
        <meta name="keywords" content="интеллектуальная собственность, оценка ИС, LegalTech, AI, патенты, товарные знаки" />
      </Head>
      {/* Hero Section Background */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none sticky-background">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[60%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      </div>

      <header className="fixed top-2 left-1/2 -translate-x-1/2 w-[98%] max-w-7xl z-[100] transition-all duration-500 border border-white/5 bg-[#020617]/40 backdrop-blur-2xl rounded-3xl mt-4">
        <div className="px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-400 tracking-tighter uppercase">
              VKR IP
            </span>
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
            <Link
              href="/register"
              className="glass-button-primary px-8 py-2.5 text-[10px] font-black uppercase tracking-[0.2em]"
            >
              Начать работу
            </Link>
          </div>
        </div>
      </header>

      <main className="relative pt-48 pb-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-left duration-700">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,1)]"></span>
              Modern IP Management Platform
            </div>

            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase animate-in slide-in-from-left duration-700 delay-100">
              Цифровая <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Крепость</span> <br />
              Ваших Идей
            </h1>

            <p className="text-lg text-white/40 leading-relaxed font-medium max-w-lg animate-in slide-in-from-left duration-700 delay-200">
              Управление ИС, автоматизация документов и контроль сроков на базе ИИ.
              <span className="block mt-2 text-white/60">Ваш персональный цифровой патентный поверенный в облаке.</span>
            </p>

            <div className="flex flex-wrap gap-4 pt-4 animate-in slide-in-from-left duration-1000 delay-300">
              <Link
                href="/register"
                className="glass-button-primary px-10 py-5 text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(34,211,238,0.1)] flex items-center gap-3 group"
              >
                Создать кабинет
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="px-10 py-5 rounded-full border border-white/10 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all text-white/60 hover:text-white"
              >
                Исследовать возможности
              </a>
            </div>
          </div>

          <div className="relative animate-in zoom-in duration-1000 lg:-mt-40">
            <div className="glass-card p-4 rounded-[3.5rem] border-white/10 shadow-[0_0_100px_rgba(34,211,238,0.1)] overflow-hidden bg-white/5 backdrop-blur-3xl group">
              <div className="bg-[#0f172a]/80 rounded-[3rem] overflow-hidden border border-white/5 shadow-inner">
                <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/50"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/50"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/50"></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                    <div className="text-[9px] font-black text-white/20 tracking-[0.3em] uppercase">Документооборот</div>
                  </div>
                </div>
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="h-40 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-3 group-hover:bg-cyan-500/5 transition-all">
                      <FileCode2 className="w-8 h-8 text-white/20" />
                      <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Договор</div>
                    </div>
                    <div className="h-40 bg-gradient-to-br from-blue-500/10 to-transparent rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-3">
                      <Shield className="w-8 h-8 text-white/20" />
                      <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Претензия</div>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center gap-3 shadow-lg transform group-hover:scale-[1.02] transition-all">
                    <Plus className="w-5 h-5 text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Создать новый документ</span>
                  </button>
                </div>
              </div>
            </div>
            {/* Decors */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-[80px]"></div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.5em] flex items-center justify-center gap-4">
            <span className="w-8 h-px bg-cyan-400/30"></span>
            Функции платформы
            <span className="w-8 h-px bg-cyan-400/30"></span>
          </h2>
          <p className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Всё для вашей ИС</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { h: "Центр управления", p: "Единый каталог всех ваших патентов, программ и брендов.", i: <Database className="w-8 h-8 text-cyan-400" />, color: "cyan" },
            { h: "AI Оценка", p: "Умный калькулятор рыночной стоимости с генерацией отчетов.", i: <BarChart3 className="w-8 h-8 text-blue-400" />, color: "blue" },
            { h: "Смарт-Контроль", p: "Умные уведомления о сроках продления и уплате пошлин.", i: <Clock className="w-8 h-8 text-emerald-400" />, color: "emerald" },
            { h: "Автодокументы", p: "Генератор юридических документов по вашим шаблонам.", i: <FileCode2 className="w-8 h-8 text-rose-400" />, color: "rose" },
          ].map((f, idx) => (
            <div key={f.h} className="glass-card p-10 rounded-[3rem] border-white/5 group hover:border-white/20 transition-all hover:translate-y-[-12px] duration-500 relative overflow-hidden">
              <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${f.color}-500/5 rounded-full blur-2xl group-hover:bg-${f.color}-500/10 transition-all text-sm`}></div>
              <div className="mb-8 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">{f.i}</div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                {f.h}
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-sm text-white/40 leading-relaxed font-medium">{f.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Section */}
      <section className="bg-white/[0.02] py-32 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-10"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-12">
            Синергия <span className="text-cyan-400">Технологий</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-x-20 gap-y-12">
            <div className="flex flex-col items-center gap-4">
              <Globe className="w-10 h-10 text-white/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Global Search</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <Cpu className="w-10 h-10 text-white/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">AI Analysis</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <Shield className="w-10 h-10 text-white/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Secured Storage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contacts" className="max-w-7xl mx-auto px-6 py-32">
        <div className="glass-card p-12 md:p-20 rounded-[4rem] border-white/5 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
            <div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-8 leading-[0.9]">
                Готовы к <br />
                <span className="text-cyan-400">цифровoй</span> <br />
                трансформации?
              </h2>
              <p className="text-lg text-white/40 mb-10 font-medium leading-relaxed">
                Оставьте заявку, чтобы получить персональную демо-версию или обсудить интеграцию в ваш бизнес.
              </p>
              <div className="space-y-8">
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 glass-card flex items-center justify-center rounded-2xl border-white/10 group-hover:border-cyan-400/50 transition-colors">
                    <Mail className="w-6 h-6 text-white/40 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Email</p>
                    <p className="text-sm font-black uppercase tracking-widest text-white/60">support@vkr-ip.pro</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 glass-card flex items-center justify-center rounded-2xl border-white/10 group-hover:border-blue-400/50 transition-colors">
                    <MessageSquare className="w-6 h-6 text-white/40 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Телеграм</p>
                    <p className="text-sm font-black uppercase tracking-widest text-white/60">@vkr_ip_bot</p>
                  </div>
                </div>
              </div>
            </div>

            <form
              className="space-y-6 bg-white/[0.01] p-10 rounded-[3rem] border border-white/5 backdrop-blur-md"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Спасибо! Мы свяжемся с вами в ближайшее время.");
              }}
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-4">Имя</label>
                  <input className="glass-input !rounded-2xl" placeholder="Александр" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-4">Email</label>
                  <input className="glass-input !rounded-2xl" type="email" placeholder="alex@company.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-4">Сообщение</label>
                <textarea
                  rows={4}
                  className="glass-input !rounded-3xl"
                  placeholder="Расскажите о ваших объектах ИС..."
                  required
                />
              </div>
              <button className="glass-button-primary w-full py-5 text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 group">
                Отправить запрос
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="py-20 border-t border-white/5 relative bg-[#01040f]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-cyan-400" />
            <div className="text-2xl font-black text-white uppercase tracking-tighter">VKR IP</div>
          </div>
          <div className="flex gap-10">
            {['Правовая информация', 'Приватность', 'Условия'].map(l => (
              <a key={l} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors" href="#">{l}</a>
            ))}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/10 italic">
            © {new Date().getFullYear()} VKR Intellect Platform. Engineered for excellence.
          </p>
        </div>
      </footer>
      <KBAgentFox />
    </div>
  );
}
