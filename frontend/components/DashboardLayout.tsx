import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Home,
  Briefcase,
  Users,
  Calendar,
  AreaChart,
  BookOpen,
  LogOut
} from "lucide-react";
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
      icon: Home,
    },
    {
      href: "/ip-objects",
      label: "Мои активы",
      icon: Briefcase,
    },
    {
      href: "/counterparties",
      label: "Контрагенты",
      icon: Users,
    },
    {
      href: "/deadlines",
      label: "Сроки",
      icon: Calendar,
    },
    {
      href: "/valuation",
      label: "Оценка ИС",
      icon: AreaChart,
    },
    {
      href: "/knowledge",
      label: "База знаний",
      icon: BookOpen,
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
            const Icon = tab.icon;
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
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${isActive ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] scale-110" : "text-white/20 group-hover:text-white/60 group-hover:scale-110"}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`font-bold uppercase tracking-widest text-[10px] hidden md:block whitespace-nowrap transition-all duration-300 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1 h-5 rounded-full bg-cyan-400 hidden md:block shadow-[0_0_15px_rgba(34,211,238,1)]"></div>
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
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" strokeWidth={2} />
            <span className="font-bold uppercase tracking-widest text-[10px] hidden md:block">Выйти</span>
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
