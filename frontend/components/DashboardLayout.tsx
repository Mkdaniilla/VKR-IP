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
    <div className="flex h-screen overflow-hidden font-sans relative">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/industrial_bg.png")' }}
      />
      {/* Overlay to darken background */}
      <div className="absolute inset-0 z-1 bg-black/60 backdrop-blur-[2px]" />

      {/* Sidebar - Glass Effect */}
      <aside className="w-20 md:w-64 bg-white/[0.03] backdrop-blur-[30px] border-r border-white/10 text-white flex flex-col flex-shrink-0 transition-all duration-500 relative z-50 shadow-[20px_0_50px_rgba(0,0,0,0.3)]">

        {/* Logo Area */}
        <div className="h-24 flex items-center justify-center md:justify-start md:px-8 border-b border-white/5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.4)] relative group">
            <div className="absolute inset-0 rounded-2xl bg-cyan-400 animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <span className="font-black text-white text-2xl relative z-10">M</span>
          </div>
          <div className="ml-4 hidden md:block">
            <span className="font-black text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 block leading-none">MDM IP</span>
            <span className="text-[9px] font-black text-cyan-400/60 uppercase tracking-[0.2em] mt-1 block">Management</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-10 px-4 space-y-3 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => {
            const isActive = router.pathname.startsWith(tab.href);
            return (
              <Link key={tab.href} href={tab.href}>
                <div className={`
                  flex items-center gap-4 px-4 py-4 rounded-[1.25rem] cursor-pointer transition-all duration-300 group relative overflow-hidden
                  ${isActive
                    ? "bg-white/[0.08] text-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-white/10"
                    : "text-white/40 hover:bg-white/[0.05] hover:text-white"
                  }
                `}>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none"></div>
                  )}
                  <svg className={`w-6 h-6 flex-shrink-0 transition-all duration-300 ${isActive ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] scale-110" : "text-white/20 group-hover:text-white/60 group-hover:scale-110"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {tab.icon}
                  </svg>
                  <span className={`font-black uppercase tracking-widest text-[10px] hidden md:block whitespace-nowrap transition-all duration-300 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1 h-6 rounded-full bg-cyan-400 hidden md:block shadow-[0_0_15px_rgba(34,211,238,1)]"></div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-6 border-t border-white/5 bg-black/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-4 w-full rounded-2xl text-white/20 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300 group"
          >
            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="font-black uppercase tracking-widest text-[10px] hidden md:block">Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-black/10">
        <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        <KBAgentFox />
      </div>
    </div>
  );
}
