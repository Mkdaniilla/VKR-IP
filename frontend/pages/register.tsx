import { FormEvent, useState } from "react";
import { register, login, setToken } from "../lib/api";
import { useRouter } from "next/router";
import { Mail, Lock, UserPlus, ChevronLeft, Shield, RefreshCw } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await register(email, password);
      // После регистрации сразу логинимся
      const tok = await login(email, password);
      setToken(tok.access_token);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden mesh-gradient">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -ml-48 -mt-48 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] -mr-48 -mb-48 pointer-events-none"></div>

      <div className="w-full max-w-md glass-card p-10 rounded-[2.5rem] border-white/5 relative z-10 shadow-2xl animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-2xl mx-auto flex items-center justify-center shadow-2xl mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400 uppercase tracking-tighter mb-2">Регистрация</h1>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Присоединяйтесь к экосистеме VKR IP</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Email</label>
            <div className="relative group/input">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover/input:text-blue-400 transition-colors" />
              <input
                type="email"
                className="glass-input font-bold pl-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Пароль</label>
            <div className="relative group/input">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover/input:text-blue-400 transition-colors" />
              <input
                type="password"
                className="glass-input font-bold pl-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {err && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in slide-in-from-top-2">
              <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest text-center">{err}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary w-full py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 group"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
            {loading ? "Создание профиля..." : "Создать аккаунт"}
          </button>

          <div className="pt-6 text-center space-y-4">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              Уже есть аккаунт?{" "}
              <a className="text-blue-400 hover:text-white transition-colors underline decoration-blue-400/30 underline-offset-4" href="/login">
                Войти
              </a>
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-[10px] font-bold text-white/20 hover:text-white transition-colors uppercase tracking-[0.3em] group/back"
            >
              <ChevronLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" />
              На главную
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
