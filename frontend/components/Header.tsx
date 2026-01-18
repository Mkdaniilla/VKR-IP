import Link from "next/link";

export default function Header() {
  return (
    <header className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
      <span className="flex items-center gap-2 font-semibold">
        <span className="inline-grid h-7 w-7 place-items-center rounded-xl bg-black/90 text-white">MD</span>
        MDM IP
      </span>
      <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
        <a className="hover:text-gray-900 transition-colors" href="/#features">Возможности</a>
        <a className="hover:text-gray-900 transition-colors" href="/#how">Как это работает</a>
        <Link className="rounded-xl border px-4 py-2 hover:bg-white transition" href="/login">Войти</Link>
      </nav>
    </header>
  );
}
