import React from "react";
import { useStore } from "../store/useStore";
import { LayoutDashboard, CheckSquare, MessageSquare, Settings } from "lucide-react";
import { motion } from "motion/react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { activeTab, setActiveTab } = useStore();
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);

  React.useEffect(() => {
    const detectKeyboard = () => {
      if (window.visualViewport) {
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
    <div className="flex flex-col h-[100dvh] bg-[#050508] text-slate-100 overflow-hidden">
      <main className={`flex-1 min-h-0 ${
        activeTab === 'coach' 
          ? `overflow-hidden flex flex-col ${isKeyboardOpen ? 'pb-0' : 'pb-[calc(5.2rem+env(safe-area-inset-bottom))]'}` 
          : `overflow-y-auto ${isKeyboardOpen ? 'pb-4' : 'pb-[calc(6.5rem+env(safe-area-inset-bottom))]'}`
      } scrollbar-hide`}>
        {children}
      </main>

      {!isKeyboardOpen && (
        <nav 
          aria-label="Primary Navigation"
          className="fixed bottom-0 inset-x-0 z-50 px-4 sm:px-6 py-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#08080c]/85 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.7)]"
        >
          <div className="flex justify-around items-center max-w-md mx-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  whileTap={{ scale: 0.92 }}
                  className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 select-none cursor-pointer focus:outline-none transition-all ${
                    isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className={`relative flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-[0_0_16px_rgba(139,92,246,0.25)]" 
                      : "bg-transparent text-slate-400"
                  }`}>
                    <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabIndicator" 
                        className="absolute -bottom-1 w-1 h-1 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.9)]" 
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className={`text-[9px] font-bold tracking-widest uppercase mt-1 transition-colors ${
                    isActive ? "text-purple-300 font-extrabold" : "text-slate-500"
                  }`}>
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
