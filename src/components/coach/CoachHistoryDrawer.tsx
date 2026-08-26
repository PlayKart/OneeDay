// src/components/coach/CoachHistoryDrawer.tsx

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  X,
  MessageSquare,
  Pin,
  Edit2,
  Trash2,
  Archive,
  MoreHorizontal,
  Flame,
  User as UserIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatSession, User } from "../../types";
import { AICoachIcon } from "../AICoachIcon";
import {
  cleanCoachTitle,
  groupSessionsByDate,
  formatRelativeTime,
} from "../../utils/coachUtils";

interface CoachHistoryDrawerProps {
  sessions: ChatSession[];
  activeChatId: string | null;
  sessionsLoading: boolean;
  isOpenMobile: boolean;
  isOpenDesktop: boolean;
  user: User | null;
  onCloseMobile: () => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => Promise<void>;
  onPinSession: (id: string) => Promise<void>;
  onArchiveSession: (id: string) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
}

export const CoachHistoryDrawer: React.FC<CoachHistoryDrawerProps> = ({
  sessions,
  activeChatId,
  sessionsLoading,
  isOpenMobile,
  isOpenDesktop,
  user,
  onCloseMobile,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onPinSession,
  onArchiveSession,
  onDeleteSession,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Close context menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setActiveMenuSessionId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) =>
      cleanCoachTitle(s.title).toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  // Group filtered sessions chronologically
  const grouped = useMemo(
    () => groupSessionsByDate(filteredSessions),
    [filteredSessions]
  );

  const handleSaveRename = async (sessionId: string) => {
    if (renameText.trim()) {
      await onRenameSession(sessionId, renameText.trim());
    }
    setEditingSessionId(null);
  };

  const renderSessionItem = (session: ChatSession) => {
    const isActive = activeChatId === session.id;
    const isEditing = editingSessionId === session.id;
    const isMenuOpen = activeMenuSessionId === session.id;
    const isPinned = Boolean(session.isPinned || session.is_pinned);
    const displayTitle = cleanCoachTitle(session.title);
    const timeLabel = formatRelativeTime(
      session.updatedAt || session.updated_at || session.createdAt || session.created_at
    );

    return (
      <div
        key={session.id}
        onClick={() => {
          if (!isEditing) {
            onSelectSession(session.id);
            onCloseMobile();
          }
        }}
        className={`group relative flex items-center justify-between p-2.5 pl-3 rounded-xl transition-all cursor-pointer border min-h-[46px] select-none ${
          isActive
            ? "bg-[#16161c] border-white/[0.16] text-white shadow-[0_2px_12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "bg-transparent border-transparent hover:bg-[#121216] hover:border-white/[0.06] text-slate-300 hover:text-white"
        }`}
      >
        {/* Active Monolith Pillar Accent Bar */}
        {isActive && (
          <div className="absolute left-1 top-2.5 bottom-2.5 w-[3px] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        )}

        <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
          <div
            className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isActive
                ? "bg-white/10 text-white border border-white/20 shadow-sm"
                : "bg-white/[0.03] text-slate-400 group-hover:text-slate-200 border border-white/[0.05]"
            }`}
          >
            <AICoachIcon size={12} active={isActive} />
          </div>

          {isEditing ? (
            <input
              type="text"
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  await handleSaveRename(session.id);
                } else if (e.key === "Escape") {
                  setEditingSessionId(null);
                }
              }}
              onBlur={() => handleSaveRename(session.id)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-black border border-white/30 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white"
              autoFocus
            />
          ) : (
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs truncate leading-snug tracking-tight ${
                  isActive
                    ? "font-semibold text-white"
                    : "font-medium text-slate-200 group-hover:text-white"
                }`}
              >
                {displayTitle}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 group-hover:text-slate-300 mt-0.5 font-medium leading-none">
                {isPinned && (
                  <span className="inline-flex items-center gap-0.5 text-amber-300 text-[9px] font-semibold">
                    <Pin size={8} className="fill-amber-300 text-amber-300" />
                  </span>
                )}
                <span>{timeLabel}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <div className={`relative ${isMenuOpen ? "block" : "group-hover:block md:hidden"}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuSessionId(isMenuOpen ? null : session.id);
              }}
              className="w-6.5 h-6.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Conversation options"
            >
              <MoreHorizontal size={13} />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-38 bg-[#141418] border border-white/[0.14] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.85)] py-1 z-50 backdrop-blur-2xl divide-y divide-white/[0.06]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-0.5">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActiveMenuSessionId(null);
                      await onPinSession(session.id);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-slate-200 hover:text-white hover:bg-white/[0.08] flex items-center gap-2 font-medium transition-colors cursor-pointer"
                  >
                    <Pin
                      size={11}
                      className={isPinned ? "text-amber-300 fill-amber-300" : "text-slate-400"}
                    />
                    {isPinned ? "Unpin Chat" : "Pin to Top"}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuSessionId(null);
                      setEditingSessionId(session.id);
                      setRenameText(session.title || "");
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-slate-200 hover:text-white hover:bg-white/[0.08] flex items-center gap-2 font-medium transition-colors cursor-pointer"
                  >
                    <Edit2 size={11} className="text-slate-400" />
                    Rename
                  </button>

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActiveMenuSessionId(null);
                      await onArchiveSession(session.id);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-slate-200 hover:text-white hover:bg-white/[0.08] flex items-center gap-2 font-medium transition-colors cursor-pointer"
                  >
                    <Archive size={11} className="text-slate-400" />
                    Archive
                  </button>
                </div>

                <div className="py-0.5">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActiveMenuSessionId(null);
                      if (window.confirm("Delete this conversation?")) {
                        await onDeleteSession(session.id);
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 size={11} />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, items: ChatSession[]) => {
    if (items.length === 0) return null;
    return (
      <div key={title} className="space-y-0.5 pt-2 first:pt-0">
        <div className="px-2.5 py-1 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 font-mono">
            {title}
          </span>
          <span className="text-[9px] text-slate-500 font-semibold">{items.length}</span>
        </div>
        <div className="space-y-0.5">{items.map((s) => renderSessionItem(s))}</div>
      </div>
    );
  };

  const drawerContent = (
    <div
      ref={menuContainerRef}
      className="h-full flex flex-col justify-between bg-[#09090c] border-r border-white/[0.08] select-none w-full max-w-full overflow-x-hidden"
    >
      {/* Top Header */}
      <div className="px-3.5 py-3 flex items-center justify-between border-b border-white/[0.07] shrink-0 h-14 bg-[#0a0a0e]/95 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <span className="text-[11px] font-black tracking-[0.18em] uppercase text-zinc-100 font-mono">
            Chat History
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[10px] font-bold text-slate-300 font-mono leading-none">
            {sessions.length}
          </span>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden w-8 h-8 rounded-xl text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          aria-label="Close history"
        >
          <X size={15} />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pt-2.5 pb-1.5 shrink-0">
        <div className="relative group">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-slate-200 transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121216] hover:bg-[#15151a] focus:bg-[#16161c] border border-white/[0.08] focus:border-white/25 rounded-xl py-2 pl-8.5 pr-8 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* + NEW CHAT Button */}
      <div className="px-3 py-1.5 shrink-0">
        <motion.button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold tracking-wider uppercase transition-all shadow-[0_2px_12px_rgba(255,255,255,0.12)] cursor-pointer flex items-center justify-center text-center font-mono"
        >
          + NEW CHAT
        </motion.button>
      </div>

      {/* Session History List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1.5 space-y-1 scrollbar-thin scrollbar-thumb-white/10 min-h-0">
        {sessionsLoading ? (
          <div className="space-y-2 px-1 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#121216] border border-white/[0.05] animate-pulse space-y-2"
              >
                <div className="h-3 w-3/4 bg-white/10 rounded" />
                <div className="h-2 w-1/3 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center select-none">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <MessageSquare size={17} />
            </div>
            <p className="text-xs font-semibold text-zinc-200">
              {searchQuery ? "No matching chats" : "No chat history"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[190px] leading-relaxed">
              {searchQuery
                ? "Try a different search query."
                : "Start a new conversation with your OneDay Coach."}
            </p>
          </div>
        ) : (
          <>
            {renderSection("Pinned", grouped.pinned)}
            {renderSection("Today", grouped.today)}
            {renderSection("Yesterday", grouped.yesterday)}
            {renderSection("Previous 7 Days", grouped.thisWeek)}
            {renderSection("Earlier", grouped.earlier)}
          </>
        )}
      </div>

      {/* Bottom Profile / Stat Badge */}
      <div className="p-3 border-t border-white/[0.08] shrink-0 bg-[#0a0a0e]/95 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 shadow-inner text-slate-200">
            <UserIcon size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-100 truncate">
              {user?.name || "OneDay User"}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <span>Level {user?.level || 1}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-slate-300 flex items-center gap-0.5 font-semibold">
                <Flame size={10} className="fill-white text-white" />
                {user?.currentStreak ?? user?.streak ?? 0}d streak
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR (Visible on md: when isOpenDesktop is true) */}
      <div
        className={`hidden md:block shrink-0 transition-all duration-300 ease-out h-full overflow-hidden ${
          isOpenDesktop ? "w-72 lg:w-80 border-r border-white/[0.08]" : "w-0 border-r-0"
        }`}
      >
        <div className="w-72 lg:w-80 h-full">{drawerContent}</div>
      </div>

      {/* MOBILE SLIDE-OUT DRAWER */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 35 }}
              className="relative z-50 w-[84vw] max-w-[300px] sm:max-w-[320px] h-full shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden"
            >
              {drawerContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
