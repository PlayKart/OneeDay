// src/components/coach/CoachHeader.tsx

import React, { useState, useRef, useEffect } from "react";
import { 
  Menu, 
  Plus, 
  MoreVertical, 
  RotateCcw, 
  Download, 
  Trash2, 
  PanelLeft, 
  PanelLeftClose
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AICoachAvatar } from "../AICoachIcon";
import { cleanCoachTitle } from "../../utils/coachUtils";

interface CoachHeaderProps {
  activeTitle?: string;
  isDesktopSidebarOpen: boolean;
  onToggleMobileDrawer: () => void;
  onToggleDesktopSidebar: () => void;
  onNewChat: () => void;
  onClearChat: () => void;
  onExportChat: () => void;
  onDeleteChat: () => void;
  hasActiveSession: boolean;
  chatLoading: boolean;
}

export const CoachHeader: React.FC<CoachHeaderProps> = ({
  activeTitle,
  isDesktopSidebarOpen,
  onToggleMobileDrawer,
  onToggleDesktopSidebar,
  onNewChat,
  onClearChat,
  onExportChat,
  onDeleteChat,
  hasActiveSession,
  chatLoading,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const displayTitle = cleanCoachTitle(activeTitle);

  return (
    <header className="px-3 sm:px-4 py-2.5 border-b border-white/[0.08] bg-[#09090b]/95 backdrop-blur-xl flex items-center justify-between gap-2 shrink-0 z-20 h-14 w-full select-none">
      {/* Left: Controls & Brand */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleMobileDrawer}
          className="md:hidden w-8.5 h-8.5 rounded-xl text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer"
          aria-label="Open chat history"
          title="Chat History"
        >
          <Menu size={16} />
        </button>

        {/* Desktop Sidebar Toggle Button */}
        <button
          onClick={onToggleDesktopSidebar}
          className="hidden md:flex w-8.5 h-8.5 rounded-xl text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer"
          aria-label={isDesktopSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          title={isDesktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isDesktopSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
        </button>

        {/* Coach Avatar Badge */}
        <div className="hidden sm:flex shrink-0">
          <AICoachAvatar size="md" active animate={chatLoading} />
        </div>

        {/* Title and Status */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-black tracking-[0.18em] uppercase text-zinc-300 font-mono leading-none truncate">
              ✦ ONE DAY COACH
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider hidden xs:inline">
                Online
              </span>
            </div>
          </div>
          <p className="text-xs font-semibold text-white truncate mt-0.5 leading-snug">
            {displayTitle}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Prominent New Chat Button */}
        <motion.button
          onClick={onNewChat}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black border border-white/20 text-xs font-bold transition-all cursor-pointer shadow-[0_2px_10px_rgba(255,255,255,0.12)] active:scale-95 shrink-0"
          title="Start new conversation"
        >
          <Plus size={13} strokeWidth={3} />
          <span className="font-bold tracking-tight text-[11px] sm:text-xs whitespace-nowrap">
            New Chat
          </span>
        </motion.button>

        {/* Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8.5 h-8.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            aria-label="More options"
          >
            <MoreVertical size={14} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-[#121216] border border-white/[0.12] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] py-1.5 z-50 backdrop-blur-2xl divide-y divide-white/[0.06]"
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onClearChat();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <RotateCcw size={13} className="text-slate-400" />
                    <span>Clear Messages</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onExportChat();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <Download size={13} className="text-slate-400" />
                    <span>Export Protocols</span>
                  </button>
                </div>

                {hasActiveSession && (
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteChat();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Delete Chat</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
