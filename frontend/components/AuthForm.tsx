// frontend/components/ui/AuthForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import { loginReq, registerReq } from "@/lib/api";
import AuthForm from "@/components/ui/AuthForm";


type Mode = "login" | "register";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await loginReq(email, password); // username=email
        router.push("/dashboard");
      } else {
        await registerReq(email, password);
        // если токен вернули — сразу в кабинет; иначе на логин
        router.push("/dashboard");
      }
    } catch (e: any) {
      setErr(e?.message || "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 w-full max-w-md mx-auto bg-white/60 backdrop-blur p-6 rounded-2xl shadow-sm"
    >
      <div>
        <label className="block text-sm mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Пароль</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
          placeholder="••••••••"
        />
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-black text-white py-2.5 disabled:opacity-60"
      >
        {loading
          ? "Подождите…"
          : mode === "login"
          ? "Войти"
          : "Зарегистрироваться"}
      </button>
    </form>
  );
}
