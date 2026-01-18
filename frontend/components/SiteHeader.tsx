import Link from "next/link";
import { logout } from "../lib/api";

type Props = {
  authed?: boolean;  // true → показывать "Выйти", иначе "Войти"
};

export default function SiteHeader({ authed }: Props) {
  return (
    <header className="bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto h-16 px-4 flex items-center">
        <Link href="/" className="text-xl font-semibold text-green-800">
          MDM IP
        </Link>

        <nav className="ml-10 hidden sm:flex items-center gap-6 text-[15px] text-slate-700">
          <Link href="/dashboard" className="hover:text-green-700">Реестр ИС</Link>
          <Link href="/dashboard?tab=docs" className="hover:text-green-700">Документы</Link>
          <Link href="/dashboard?tab=monitoring" className="hover:text-green-700">Мониторинг</Link>
          <Link href="/dashboard?tab=alerts" className="hover:text-green-700">Уведомления</Link>
          <Link href="/dashboard?tab=profile" className="hover:text-green-700">Профиль</Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {authed ? (
            <button
              onClick={logout}
              className="px-4 py-2 rounded-full border border-green-600 text-green-700 hover:bg-green-50"
            >
              Выйти
            </button>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
