import { FormEvent, useState } from "react";
import { register, login, setToken, clearToken } from "../lib/api";
import { useRouter } from "next/router";

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
      const tok = await login(email, password);
      setToken(tok.access_token);
      router.push("/dashboard");
    } catch (e: any) {
      clearToken();
      setErr(e?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -ml-48 -mt-48 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -mr-48 -mb-48 pointer-events-none"></div>

      <div className="w-full max-w-md glass-card p-10 rounded-[2.5rem] border-white/5 relative z-10 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-400 uppercase tracking-tighter mb-2">Создать аккаунт</h1>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Присоединяйтесь к экосистеме VKR IP</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Email</label>
            <input
              type="email"
              className="glass-input font-bold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Пароль</label>
            <input
              type="password"
              className="glass-input font-bold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="минимум 6 символов"
              required
              minLength={6}
            />
          </div>

          {err && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest text-center">{err}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary w-full py-4 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            {loading ? "Создание..." : "Зарегистрироваться"}
          </button>

          <div className="pt-6 text-center space-y-4">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              Уже есть аккаунт?{" "}
              <a className="text-cyan-400 hover:text-white transition-colors" href="/login">
                Войти в систему
              </a>
            </p>
            <a
              href="/"
              className="block text-[10px] font-bold text-white/20 hover:text-white transition-colors uppercase tracking-[0.3em]"
            >
              ← На главную
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
