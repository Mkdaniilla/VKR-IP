import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import KBAgentFox from "./KBAgentFox";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const tabs = [
    {
      href: "/dashboard",
      label: "Главная",
      icon: <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    },
    {
      href: "/ip-objects",
      label: "Мои активы",
      icon: <path d="M20 7h-9.586A2 2 0 019 5.586l-.293-.293A2 2 0 007.293 4H3a2 2 0 00-2 2v12a2 2 0 002 2h17a2 2 0 002-2V9a2 2 0 00-2-2z" />
    },
    {
      href: "/counterparties",
      label: "Контрагенты",
      icon: <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    },
    {
      href: "/deadlines",
      label: "Сроки",
      icon: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    },
    {
      href: "/valuation",
      label: "Оценка ИС",
      icon: <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    },
    {
      href: "/knowledge",
      label: "База знаний",
      icon: <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar - Fixed Left */}
      <aside className="w-20 md:w-64 bg-[#064e3b] text-white flex flex-col flex-shrink-0 transition-all duration-300 relative z-50">

        {/* Logo Area */}
        <div className="h-20 flex items-center justify-center md:justify-start md:px-6 border-b border-emerald-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
            <span className="font-bold text-white text-xl">M</span>
          </div>
          <span className="ml-3 font-bold text-lg hidden md:block tracking-wide">MDM IP</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = router.pathname.startsWith(tab.href);
            return (
              <Link key={tab.href} href={tab.href}>
                <div className={`
                  flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer transition-all group
                  ${isActive
                    ? "bg-emerald-800 text-white shadow-lg shadow-emerald-900/20"
                    : "text-emerald-300 hover:bg-emerald-800/50 hover:text-white"
                  }
                `}>
                  <svg className={`w-6 h-6 flex-shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-emerald-400/70 group-hover:text-emerald-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {tab.icon}
                  </svg>
                  <span className="font-medium hidden md:block whitespace-nowrap">{tab.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 hidden md:block shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-emerald-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-emerald-300 hover:bg-red-500/10 hover:text-red-200 transition-all group"
          >
            <svg className="w-6 h-6 group-hover:stroke-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="font-medium hidden md:block">Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-slate-50">
        {/* Top Header (Mobile specific or Breadcrumbs) - Optional, kept simple for now */}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Fox Overlay - managed by component itself but container relative */}
        <KBAgentFox />
      </div>
    </div>
  );
}
