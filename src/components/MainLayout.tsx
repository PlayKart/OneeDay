import React from "react";
import { useStore } from "../store/useStore";
import { LayoutDashboard, CheckSquare, MessageSquare, Settings } from "lucide-react";
import { motion } from "motion/react";
import { SyncStatusBadge } from "./SyncStatusBadge";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { activeTab, setActiveTab } = useStore();
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);

  React.useEffect(() => {
    const detectKeyboard = () => {
      if (window.visualViewport) {
        // If the visual viewport height is significantly less than innerHeight, a keyboard is up
        setIsKeyboardOpen(window.visualViewport.height < window.innerHeight * 0.85);
      } else {
        setIsKeyboardOpen(window.innerHeight < window.screen.height * 0.7);
      }
    };
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", detectKeyboard);
    }
    window.addEventListener("resize", detectKeyboard);
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", detectKeyboard);
      }
      window.removeEventListener("resize", detectKeyboard);
    };
  }, []);

  const tabs = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "habits", icon: CheckSquare, label: "Habits" },
    { id: "coach", icon: MessageSquare, label: "Coach" },
    { id: "settings", icon: Settings, label: "Settings" }
  ] as const;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#000000] text-white overflow-hidden relative">
      <div className="fixed top-3 right-4 z-50 pointer-events-auto">
        <SyncStatusBadge />
      </div>
      <main className={`flex-1 min-h-0 ${
        activeTab === 'coach' 
          ? `overflow-hidden flex flex-col ${isKeyboardOpen ? 'pb-0' : 'pb-[calc(5.2rem+env(safe-area-inset-bottom))]'}` 
          : `overflow-y-auto ${isKeyboardOpen ? 'pb-4' : 'pb-[calc(6.5rem+env(safe-area-inset-bottom))]'}`
      } scrollbar-hide`}>
        {children}
      </main>

      {!isKeyboardOpen && (
        <nav className="fixed bottom-0 w-full glass-nav border-t border-white/10 z-50 px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-black/90 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
          <div className="flex justify-between items-center max-w-md mx-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  whileTap={{ scale: 0.92 }}
                  className={`flex flex-col items-center gap-1 transition-all duration-300 min-w-[64px] py-1 select-none cursor-pointer focus:outline-none ${
                    isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <div className={`relative flex items-center justify-center p-2.5 rounded-2xl transition-all duration-300 ${isActive ? "bg-white/10 scale-105" : "bg-transparent"}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] text-white" : "text-slate-500"} />
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabIndicator" 
                        className="absolute -bottom-1.5 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className={`text-[9px] font-black tracking-widest uppercase mt-1 ${isActive ? "text-white font-black" : "text-slate-600 font-bold"}`}>
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

