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
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="w-full max-w-md rounded-2xl shadow-lg bg-white p-8">
        <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">
          Регистрация
        </h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 font-medium">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">Пароль</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="минимум 6 символов"
              required
              minLength={6}
            />
          </div>

          {err && <p className="text-red-600 text-sm">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold transition"
          >
            {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
          </button>

          <p className="text-sm text-center mt-2">
            Уже есть аккаунт?{" "}
            <a className="text-green-700 underline" href="/login">
              Войти
            </a>
          </p>

          <div className="text-center mt-4">
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-green-700 underline"
            >
              ← На главную
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
