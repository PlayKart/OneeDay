import React from "react";
import { useStore } from "../store/useStore";
import { LayoutDashboard, CheckSquare, MessageSquare, Settings } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { activeTab, setActiveTab, user } = useStore();

  const tabs = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "habits", icon: CheckSquare, label: "Habits" },
    { id: "coach", icon: MessageSquare, label: "Coach" },
    { id: "settings", icon: Settings, label: "Settings" }
  ] as const;

  return (
    <div className="flex h-screen bg-[#030303] text-slate-100 overflow-hidden font-sans">
      {/* DESKTOP SIDEBAR NAVIGATION (md and up) */}
      <aside className="hidden md:flex flex-col w-[260px] bg-[#09090d]/60 border-r border-white/5 shrink-0 relative z-40 backdrop-blur-3xl">
        {/* Subtle decorative glow at top of sidebar */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        
        {/* Branding header */}
        <div className="p-6 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-inner">
            <BrandLogo size={18} />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-light text-md tracking-tight text-white">OneDay</span>
            <span className="text-[8px] font-black text-slate-500 tracking-widest uppercase">Discipline Protocol</span>
          </div>
        </div>

        {/* Sidebar Nav links */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 relative group cursor-pointer ${
                  isActive 
                    ? "text-white bg-white/[0.04] border border-white/5" 
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]"
                }`}
              >
                {/* Active side indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/3 bottom-1/3 w-[3px] rounded-r-full bg-gradient-to-b from-[#3b82f6] to-[#ec4899]" />
                )}

                <Icon 
                  size={18} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`transition-transform duration-300 group-hover:scale-105 ${
                    isActive ? "text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" : "text-slate-500"
                  }`} 
                />
                
                <span className={`text-xs font-semibold tracking-wide ${isActive ? "text-slate-100 font-bold" : "text-slate-400"}`}>
                  {tab.label}
                </span>

                {/* Micro hover dot indicator */}
                {!isActive && (
                  <span className="absolute right-4 w-1 h-1 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>

        {/* User profile section at the bottom */}
        {user && (
          <div className="p-4 border-t border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3 p-2 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-violet-950/50">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-slate-200 truncate">{user.name}</span>
                <span className="text-[9px] text-violet-400 font-extrabold tracking-widest uppercase">Lvl {user.level} Practitioner</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className={`flex-1 overflow-y-auto scrollbar-hide ${activeTab === "coach" ? "pb-24 md:pb-4 h-full flex flex-col" : "pb-28 md:pb-8"}`}>
          {children}
        </main>

        {/* MOBILE FLOATING GLASS NAVIGATION BAR (hidden on md and up) */}
        <nav className="md:hidden fixed bottom-5 left-4 right-4 z-50">
          <div className="max-w-md mx-auto rounded-[1.75rem] border border-white/[0.06] bg-[#0c0c10]/70 backdrop-blur-3xl px-6 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.9)]">
            <div className="flex justify-between items-center">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 py-1 px-3 rounded-2xl relative ${
                      isActive ? "text-white scale-105" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {/* Glowing pill background */}
                    {isActive && (
                      <span className="absolute inset-0 bg-white/[0.04] rounded-2xl border border-white/5 pointer-events-none" />
                    )}

                    <div className="relative flex items-center justify-center p-1.5">
                      <Icon 
                        size={19} 
                        strokeWidth={isActive ? 2.5 : 2} 
                        className={isActive ? "text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" : ""} 
                      />
                    </div>
                    <span className={`text-[9px] font-bold tracking-wider uppercase ${isActive ? "text-slate-200" : "text-slate-600"}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

