import React from "react";
import { useStore } from "../store/useStore";
import { LayoutDashboard, CheckSquare, MessageSquare, Settings } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { activeTab, setActiveTab } = useStore();

  const tabs = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "habits", icon: CheckSquare, label: "Habits" },
    { id: "coach", icon: MessageSquare, label: "Coach" },
    { id: "settings", icon: Settings, label: "Settings" }
  ] as const;

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-white">
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full glass-nav border-t border-white/10 z-50 px-6 py-4 pb-safe bg-black/80 backdrop-blur-xl">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 min-w-[64px] ${
                  isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <div className={`relative flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${isActive ? "bg-white/10 scale-110" : ""}`}>
                   <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""} />
                </div>
                <span className={`text-[10px] font-bold tracking-wider ${isActive ? "text-white" : "text-slate-600"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
