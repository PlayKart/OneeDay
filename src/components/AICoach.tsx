import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  User, 
  Sparkles, 
  Target, 
  Plus, 
  Search, 
  ArrowLeft, 
  MoreVertical, 
  Pin, 
  Edit2, 
  Trash2, 
  Copy, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  Check, 
  CornerDownLeft,
  Share2,
  Download,
  Flame,
  Zap,
  Activity,
  Award,
  Menu,
  X,
  MessageSquare,
  Archive,
  MoreHorizontal
} from 'lucide-react';
import { AICoachIcon, AICoachAvatar } from './AICoachIcon';
import { useStore, ChatSession, ChatMessage } from '../store/useStore';
import { chatService } from '../services/chatService';
import { toast } from 'react-hot-toast';
import { MonolithLogo } from './MonolithLogo';

export const AICoach = () => {
  const {
    chatSessions,
    activeChatId,
    chatMessages,
    chatLoading,
    sessionsLoading,
    fetchSessions,
    createSession,
    selectSession,
    deleteSession,
    pinSession,
    sendChatMessage,
    regenerateMessage,
    editPreviousMessage,
    user,
    habits
  } = useStore();

  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const [activeSessionMenuId, setActiveSessionMenuId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const prevLoadingRef = useRef(chatLoading);
  const prevMsgCountRef = useRef(chatMessages?.length || 0);
  const userJustSentRef = useRef(false);

  // Load chat sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const isNearBottom = () => {
    if (!scrollRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    return scrollHeight - scrollTop - clientHeight < 150;
  };

  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // Scroll to bottom according to rules:
  // - User sends a message
  // - Assistant finishes streaming
  // - User is already near bottom
  useEffect(() => {
    const prevLoading = prevLoadingRef.current;
    const prevCount = prevMsgCountRef.current;
    const currentCount = chatMessages?.length || 0;

    const isNewMessage = currentCount > prevCount;
    const finishedStreaming = prevLoading && !chatLoading;
    const userJustSent = userJustSentRef.current;

    if (userJustSent || finishedStreaming) {
      scrollToBottom(true);
      userJustSentRef.current = false;
    } else if (isNewMessage || chatLoading) {
      if (isNearBottom()) {
        scrollToBottom(true);
      }
    }

    prevLoadingRef.current = chatLoading;
    prevMsgCountRef.current = currentCount;
  }, [chatMessages, chatLoading]);

  // Scroll to bottom when active session changes
  useEffect(() => {
    scrollToBottom(false);
  }, [activeChatId]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      // Also close active session dropdown menu
      setActiveSessionMenuId(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Auto-resize input textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;
    
    const textToSend = input;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    
    userJustSentRef.current = true;
    scrollToBottom(true);
    try {
      await sendChatMessage(textToSend);
    } catch (err) {
      console.error("Failed to send message:", err);
      setInput(textToSend);
      toast.error("Delivery failed. Restored your input.");
    }
  };

  const handleChipClick = async (prompt: string) => {
    if (chatLoading) return;
    userJustSentRef.current = true;
    scrollToBottom(true);
    try {
      await sendChatMessage(prompt);
    } catch (err) {
      console.error("Failed to send prompt:", err);
      setInput(prompt);
      toast.error("Failed to send prompt. Copied to input box.");
    }
  };

  const handleStartNewChat = async () => {
    try {
      await createSession("New Chat");
      setSidebarOpen(false);
      toast.success("New chat started");
    } catch (e) {
      console.error("Failed to create new chat:", e);
      toast.error("Could not start new chat");
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleEditMessageClick = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingMessageText(msg.content);
  };

  const handleEditMessageSave = async (id: string) => {
    if (!editingMessageText.trim()) {
      setEditingMessageId(null);
      return;
    }
    await editPreviousMessage(id, editingMessageText);
    setEditingMessageId(null);
    toast.success("Message edited");
  };

  const handleDeleteMessageLocal = async (msgId: string) => {
    try {
      await chatService.deleteMessage(msgId);
      const safeMsgs = Array.isArray(chatMessages) ? chatMessages : [];
      const updated = safeMsgs.filter(m => m && m.id !== msgId);
      useStore.setState({ chatMessages: updated });
      toast.success("Message deleted");
    } catch (e) {
      console.error("Failed to delete message", e);
      toast.error("Failed to delete message");
    }
  };

  const handleClearChatLocal = () => {
    useStore.setState({ chatMessages: [] });
    setMenuOpen(false);
    toast.success("Chat history cleared locally");
  };

  const handleExportChat = async () => {
    try {
      const data = await chatService.exportChats();
      if (!data) {
        toast.error("Failed to export chats");
        return;
      }
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Monolith_Chats.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMenuOpen(false);
      toast.success("Chats exported successfully");
    } catch (e) {
      console.error("Export chats error", e);
      toast.error("Failed to export chats");
    }
  };

  const handleFeedbackToggle = (msgId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type as any
    }));
    toast.success(type === 'up' ? "Thanks for your positive feedback!" : "Feedback recorded. Adjusting response strategy.");
  };

  // Format session date/time
  const formatSessionDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    
    const now = new Date();
    const diffTime = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0 && now.getDate() === d.getDate()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1 || (diffDays === 0 && now.getDate() !== d.getDate())) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Strip session prefixes, UUIDs, dates, or session numbers from displayed names
  const cleanTitle = (title: string) => {
    if (!title) return "New Chat";
    let cleaned = title.replace(/\d{4}-\d{2}-\d{2}/g, '').trim();
    cleaned = cleaned.replace(/(Session|Chat|ID|Conversation)\s*[#\-:_]?\s*([a-f0-9\-]+|\d+)/gi, '').trim();
    cleaned = cleaned.replace(/^[\-_:\s]+|[\-_:\s]+$/g, '').trim();
    return cleaned || "New Chat";
  };

  const safeChatSessions = Array.isArray(chatSessions) ? chatSessions : [];
  const sortedSessions = [...safeChatSessions].sort((a, b) => {
    if (a && b) {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
    }
    return 0;
  });

  const filteredSessions = sortedSessions.filter(session => 
    session && String(session.title || "New Chat").toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  const safeChatMessages = Array.isArray(chatMessages) ? chatMessages : [];

  const quickPrompts = [
    { label: "Build Discipline", text: "Help me build rock-solid discipline today.", desc: "Command focus & kill excuses", icon: "🛡️" },
    { label: "Study", text: "Help me design an effective study revision plan.", desc: "Accelerate cognitive absorption", icon: "📚" },
    { label: "Workout", text: "Give me an intense workout routine for today.", desc: "Unleash metabolic energy", icon: "⚡" },
    { label: "Sports", text: "Help me optimize my athletic training and competitive sports performance.", desc: "Dominate the competition", icon: "🏆" },
    { label: "Productivity", text: "How can I double my focus and productivity today?", desc: "Optimize deep work blocks", icon: "🎯" },
    { label: "Motivation", text: "Give me a direct, no-nonsense motivational push.", desc: "Ignite the drive within", icon: "🔥" },
    { label: "Life", text: "Give me strategic advice on balancing my life goals and personal growth.", desc: "Sustain absolute alignment", icon: "🌱" }
  ];

  return (
    <div className="flex h-full w-full min-h-0 bg-[#070707] text-white font-sans overflow-hidden select-none relative">

      {/* SIDEBAR CONTAINER (DESKTOP & MOBILE RESPONSIVE) */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 w-[285px] sm:w-[310px] md:w-80 bg-[#09090b] border-r border-white/[0.08] h-full z-40 flex flex-col justify-between transition-transform duration-300 ease-out backdrop-blur-2xl relative
          ${sidebarOpen ? 'translate-x-0 flex shadow-[0_0_60px_rgba(0,0,0,0.9)]' : '-translate-x-full md:translate-x-0 md:flex'}
        `}
      >
        {/* Subtle top-edge light catch */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent pointer-events-none" />

        <div className="flex-1 flex flex-col min-h-0">
          
          {/* SIDEBAR HEADER */}
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-white/[0.07] shrink-0 h-14 bg-[#0a0a0d]/90 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-100 font-sans">
                Conversations
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[10px] font-semibold text-slate-300 font-mono leading-none">
                {filteredSessions.length}
              </span>
            </div>
            {/* Mobile sidebar close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden w-8 h-8 rounded-lg text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition-all active:scale-95"
              aria-label="Close sidebar"
            >
              <X size={15} />
            </button>
          </div>

          {/* SEARCH INPUT */}
          <div className="px-3.5 pt-3 pb-1.5 shrink-0">
            <div className="relative group">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-200 transition-colors pointer-events-none" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#131316] hover:bg-[#16161a] focus:bg-[#18181d] border border-white/[0.08] focus:border-white/25 rounded-xl py-2 pl-8.5 pr-8 text-xs text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* + NEW CHAT BUTTON */}
          <div className="px-3.5 py-1.5 shrink-0">
            <button
              onClick={handleStartNewChat}
              className="w-full py-2.5 px-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold tracking-tight transition-all shadow-[0_2px_12px_rgba(255,255,255,0.15)] active:scale-[0.98] cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-black/10 flex items-center justify-center text-black group-hover:scale-105 transition-transform">
                  <Plus size={13} className="stroke-[2.5]" />
                </div>
                <span className="font-bold text-black tracking-tight text-xs">New Chat</span>
              </div>
              <span className="text-[10px] text-zinc-600 group-hover:text-black transition-colors flex items-center gap-1 font-semibold">
                <Sparkles size={11} />
              </span>
            </button>
          </div>

          {/* CHAT HISTORY LIST */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 min-h-0">
            {sessionsLoading ? (
              <div className="space-y-2 px-1 py-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#131316] border border-white/[0.05] animate-pulse space-y-2">
                    <div className="h-3 w-3/4 bg-white/10 rounded" />
                    <div className="h-2.5 w-1/3 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                  <MessageSquare size={17} />
                </div>
                <p className="text-xs font-semibold text-zinc-200">No conversations found</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[190px] leading-relaxed">
                  {searchQuery ? "Try a different search query" : "Start a new session with your AI Coach."}
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = activeChatId === session.id;
                const isEditing = editingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      if (!isEditing) {
                        selectSession(session.id);
                        setSidebarOpen(false); // Close mobile sidebar
                      }
                    }}
                    className={`group relative flex items-center justify-between p-2.5 pl-3 rounded-xl transition-all cursor-pointer border min-h-[46px] ${
                      isActive
                        ? "bg-[#18181c] border-white/[0.14] text-white shadow-[0_2px_12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : "bg-transparent border-transparent hover:bg-[#131316] hover:border-white/[0.06] text-slate-300 hover:text-white"
                    }`}
                  >
                    {/* Active Accent Pill */}
                    {isActive && (
                      <div className="absolute left-1 top-2.5 bottom-2.5 w-[3px] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
                      <div
                        className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-white/10 text-white border border-white/20 shadow-sm"
                            : "bg-white/[0.04] text-slate-400 group-hover:text-slate-200 border border-white/[0.05]"
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
                            if (e.key === 'Enter') {
                              if (renameText.trim()) {
                                await useStore.getState().renameSession(session.id, renameText);
                                toast.success("Conversation renamed");
                              }
                              setEditingSessionId(null);
                            } else if (e.key === 'Escape') {
                              setEditingSessionId(null);
                            }
                          }}
                          onBlur={async () => {
                            if (renameText.trim()) {
                              await useStore.getState().renameSession(session.id, renameText);
                            }
                            setEditingSessionId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-[#131316] border border-white/25 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs truncate leading-tight tracking-tight ${isActive ? "font-semibold text-white" : "font-medium text-slate-200 group-hover:text-white"}`}>
                            {cleanTitle(session.title)}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 group-hover:text-slate-300 mt-0.5 font-medium leading-none">
                            {session.is_pinned && (
                              <span className="inline-flex items-center gap-0.5 text-slate-200 text-[9px] font-semibold">
                                <Pin size={8} className="fill-white" />
                              </span>
                            )}
                            <span>{formatSessionDate(session.updated_at || session.created_at)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {/* Actions Button */}
                      <div className={`relative ${activeSessionMenuId === session.id ? 'block' : 'group-hover:block hidden'}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSessionMenuId(activeSessionMenuId === session.id ? null : session.id);
                          }}
                          className="w-6 h-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                          aria-label="Conversation options"
                        >
                          <MoreHorizontal size={13} />
                        </button>
                        
                        {activeSessionMenuId === session.id && (
                          <div 
                            className="absolute right-0 mt-1 w-36 bg-[#16161a] border border-white/[0.12] rounded-xl shadow-2xl py-1 z-50 backdrop-blur-xl divide-y divide-white/[0.05]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-0.5">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setActiveSessionMenuId(null);
                                  await pinSession(session.id);
                                }}
                                className="w-full text-left px-3 py-1.5 text-[11px] text-slate-200 hover:text-white hover:bg-white/[0.08] flex items-center gap-2 font-medium transition-colors"
                              >
                                <Pin size={11} className={session.is_pinned ? "text-white" : "text-slate-400"} />
                                {session.is_pinned ? "Unpin Chat" : "Pin Chat"}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSessionMenuId(null);
                                  setEditingSessionId(session.id);
                                  setRenameText(session.title || "New Chat");
                                }}
                                className="w-full text-left px-3 py-1.5 text-[11px] text-slate-200 hover:text-white hover:bg-white/[0.08] flex items-center gap-2 font-medium transition-colors"
                              >
                                <Edit2 size={11} className="text-slate-400" />
                                Rename
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSessionMenuId(null);
                                  toast.success("Conversation archived");
                                }}
                                className="w-full text-left px-3 py-1.5 text-[11px] text-slate-200 hover:text-white hover:bg-white/[0.08] flex items-center gap-2 font-medium transition-colors"
                              >
                                <Archive size={11} className="text-slate-400" />
                                Archive
                              </button>
                            </div>
                            <div className="py-0.5">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setActiveSessionMenuId(null);
                                  if (window.confirm("Are you sure you want to delete this conversation?")) {
                                    await deleteSession(session.id);
                                  }
                                }}
                                className="w-full text-left px-3 py-1.5 text-[11px] text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-semibold transition-colors"
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
              })
            )}
          </div>

        </div>

        {/* SIDEBAR FOOTER (USER & STATS SUMMARY) */}
        <div className="p-3.5 border-t border-white/[0.08] shrink-0 bg-[#0a0a0d]/90 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner text-slate-200">
              <User size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-100 truncate">{user?.name || 'Monolith User'}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <span>Level {user?.level || 1}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-slate-300 flex items-center gap-0.5 font-semibold">
                  <Flame size={10} className="fill-white" />
                  {user?.streak || 0}d
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MOBILE SIDEBAR BACKGROUND OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-30 transition-opacity duration-300"
        />
      )}

      {/* RIGHT MAIN CHAT COLUMN */}
      <div className="flex-1 min-h-0 flex flex-col h-full bg-[#070708] relative overflow-hidden">
        
        {/* CHAT HEADER */}
        <div className="px-4 py-3 border-b border-white/[0.07] bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 z-10 h-14">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-8 h-8 rounded-lg text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] flex items-center justify-center transition-all active:scale-95 shrink-0"
              aria-label="Open conversations menu"
            >
              <Menu size={15} />
            </button>
            <div className="hidden sm:flex shrink-0">
              <AICoachAvatar size={28} active />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-slate-400 font-sans leading-none">AI Personal Coach</span>
              <span className="text-xs font-semibold text-white truncate max-w-xs mt-1 leading-none">
                {activeChatId ? cleanTitle(safeChatSessions.find(s => s && s.id === activeChatId)?.title || "Active Coach session") : "Active Coach session"}
              </span>
            </div>
          </div>

          {/* Three-Dot Menu dropdown wrapper */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
              aria-label="More options"
            >
              <MoreVertical size={14} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-48 bg-[#151518] border border-white/[0.12] rounded-xl shadow-2xl py-1 z-30 overflow-hidden divide-y divide-white/[0.05]"
                >
                  <div className="py-0.5">
                    <button
                      onClick={handleClearChatLocal}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-2"
                    >
                      <RotateCcw size={12} className="text-slate-400" />
                      Clear Conversation
                    </button>

                    <button
                      onClick={handleExportChat}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Download size={12} className="text-slate-400" />
                      Export Chat
                    </button>
                  </div>

                  <div className="py-0.5">
                    <button
                      onClick={() => {
                        if (activeChatId && window.confirm("Are you sure you want to delete this conversation?")) {
                          deleteSession(activeChatId);
                        }
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={12} />
                      Delete Chat
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* MESSAGES VIEWPORT */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth"
          id="chat-messages-scroll"
          style={{ scrollBehavior: 'smooth' }}
        >
          {chatLoading && safeChatMessages.length === 0 ? (
            <div className="space-y-6 max-w-3xl mx-auto py-8">
              <div className="flex items-start gap-4 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-white/10 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-4 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            </div>
          ) : safeChatMessages.length === 0 ? (
            /* EMPTY STATE: "What are we conquering today?" */
            <div className="max-w-2xl mx-auto text-center py-12 md:py-20 flex flex-col items-center justify-center select-none px-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-6 relative"
              >
                <div className="absolute inset-0 bg-white/[0.04] blur-2xl rounded-full scale-125" />
                <MonolithLogo size={68} />
              </motion.div>
              
              <motion.h2 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2.5 text-white"
              >
                What are we conquering today?
              </motion.h2>
              
              <motion.p 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-md mb-8"
              >
                Select your primary training focus protocol below to activate your personal coach, or construct a custom request.
              </motion.p>

              <motion.div 
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl"
              >
                {quickPrompts.map((p, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => handleChipClick(p.text)}
                    disabled={chatLoading}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                    className="group flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0f0f12] hover:bg-[#141418] border border-white/[0.07] hover:border-white/20 text-left transition-all cursor-pointer disabled:opacity-50 shadow-md relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 text-base group-hover:bg-white/[0.08] group-hover:border-white/15 transition-all">
                      {p.icon}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white group-hover:text-white transition-colors">
                        {p.label}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium leading-normal mt-0.5 group-hover:text-slate-300 transition-colors">
                        {p.desc}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          ) : (
            safeChatMessages.map((msg) => {
              if (!msg) return null;
              const isUser = msg.role === 'user';
              const isMessageEditing = editingMessageId === msg.id;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  key={msg.id}
                  className={`flex items-start gap-3.5 group/msg max-w-3xl mx-auto ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <AICoachAvatar size="md" active className="mt-0.5" />
                  )}

                  <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end max-w-[82%]' : 'items-start max-w-[85%]'}`}>
                    
                    {isUser ? (
                      /* USER MESSAGE BUBBLE */
                      <div className="bg-[#18181c] text-white px-4.5 py-3 rounded-2xl rounded-tr-sm border border-white/[0.12] text-sm leading-relaxed whitespace-pre-wrap shadow-md">
                        {isMessageEditing ? (
                          <div className="flex flex-col gap-2 min-w-[220px]">
                            <textarea
                              value={editingMessageText}
                              onChange={(e) => setEditingMessageText(e.target.value)}
                              className="w-full bg-black border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none h-16"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingMessageId(null)}
                                className="px-2.5 py-1 bg-white/[0.06] hover:bg-white/10 border border-white/10 rounded text-[10px] uppercase font-bold text-slate-300"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleEditMessageSave(msg.id)}
                                className="px-3 py-1 bg-white text-black hover:bg-slate-200 rounded text-[10px] uppercase font-bold"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    ) : msg.content.startsWith('⚠️') ? (
                      /* ASSISTANT ERROR ALERT BOX */
                      <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4.5 py-3.5 rounded-2xl rounded-tl-sm text-xs flex flex-col gap-2.5 max-w-sm mt-1 shadow-md">
                        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px] text-red-400">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                          <span>Uplink Interrupt</span>
                        </div>
                        <p className="text-slate-200 font-medium leading-relaxed">
                          {msg.content.replace('⚠️', '').trim() || "The connection was interrupted. Let's try sending that again."}
                        </p>
                        <button
                          onClick={async () => {
                            const msgIndex = safeChatMessages.findIndex(m => m.id === msg.id);
                            let lastUserText = "";
                            if (msgIndex > 0) {
                              const precedingMsgs = safeChatMessages.slice(0, msgIndex);
                              const lastUserMsg = precedingMsgs.reverse().find(m => m.role === 'user');
                              if (lastUserMsg) {
                                lastUserText = lastUserMsg.content;
                              }
                            }
                            if (lastUserText) {
                              await handleDeleteMessageLocal(msg.id);
                              handleChipClick(lastUserText);
                            } else {
                              toast.error("Could not find prompt context to retry");
                            }
                          }}
                          className="w-full py-2 bg-red-500 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg hover:bg-red-600 active:scale-95 transition-all cursor-pointer h-9 flex items-center justify-center gap-2 shadow"
                        >
                          <RotateCcw size={12} strokeWidth={2.5} />
                          <span>Retry Request</span>
                        </button>
                      </div>
                    ) : (
                      /* ASSISTANT MESSAGE */
                      <div className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap select-text pl-1 py-0.5">
                        {msg.content}
                      </div>
                    )}

                    {/* Action Bar */}
                    {!isMessageEditing && (
                      <div
                        className="flex items-center gap-3 opacity-0 group-hover/msg:opacity-100 transition-opacity text-[10px] text-slate-400 font-medium tracking-wide px-1 mt-0.5"
                      >
                        {isUser ? (
                          <>
                            <button
                              onClick={() => handleEditMessageClick(msg)}
                              className="hover:text-white flex items-center gap-1 transition-colors"
                              title="Edit prompt"
                            >
                              <Edit2 size={10} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMessageLocal(msg.id)}
                              className="hover:text-rose-400 flex items-center gap-1 transition-colors text-slate-400"
                              title="Delete message"
                            >
                              <Trash2 size={10} />
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleCopyMessage(msg.content)}
                              className="hover:text-white flex items-center gap-1 transition-colors"
                              title="Copy text"
                            >
                              <Copy size={10} />
                              Copy
                            </button>
                            <button
                              onClick={() => regenerateMessage(msg.id)}
                              className="hover:text-white flex items-center gap-1 transition-colors"
                              title="Regenerate"
                            >
                              <RotateCcw size={10} />
                              Regenerate
                            </button>
                            <button
                              onClick={() => handleFeedbackToggle(msg.id, 'up')}
                              className={`flex items-center gap-1 transition-colors hover:text-white ${feedback[msg.id] === 'up' ? 'text-white' : 'text-slate-400'}`}
                            >
                              <ThumbsUp size={10} className={feedback[msg.id] === 'up' ? 'fill-white' : ''} />
                            </button>
                            <button
                              onClick={() => handleFeedbackToggle(msg.id, 'down')}
                              className={`flex items-center gap-1 transition-colors hover:text-white ${feedback[msg.id] === 'down' ? 'text-rose-400' : 'text-slate-400'}`}
                            >
                              <ThumbsDown size={10} className={feedback[msg.id] === 'down' ? 'fill-rose-400' : ''} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}

          {/* STREAMING / TYPING LOADER */}
          {chatLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3.5 max-w-3xl mx-auto"
            >
              <AICoachAvatar size="md" active animate />
              <div className="py-2 px-3 flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-xl rounded-tl-sm">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          {/* Anchor for auto-scroll */}
          <div ref={messagesEndRef} className="h-4 shrink-0" />
        </div>

        {/* BOTTOM INPUT BAR */}
        <div className="shrink-0 p-3 md:p-4 bg-[#09090b] border-t border-white/[0.08] z-20 pb-4">
          <div className="max-w-2xl mx-auto w-full">
            
            {safeChatMessages.length > 0 && safeChatMessages.length < 5 && (
              <div className="flex gap-1.5 justify-center overflow-x-auto pb-3 mb-1 scrollbar-hide">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(p.text)}
                    className="text-[10px] font-semibold px-3 py-1.5 rounded-full border border-white/[0.08] hover:border-white/20 bg-[#131316] hover:bg-white hover:text-black text-slate-300 transition-all shrink-0 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={(e) => {
              if (chatLoading) return;
              handleSend(e);
            }} className="relative w-full flex items-end gap-2 bg-[#121215] border border-white/[0.1] rounded-2xl p-2 pl-3.5 pr-2 shadow-xl focus-within:border-white/25 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => {
                  setTimeout(() => {
                    scrollToBottom(true);
                  }, 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!chatLoading) {
                      handleSend(e);
                    }
                  }
                }}
                placeholder={chatLoading ? "Coach is generating strategy..." : "Message your OneDay AI Coach..."}
                disabled={chatLoading}
                className="flex-1 bg-transparent border-0 outline-none text-white text-sm placeholder:text-slate-500 focus:ring-0 focus:outline-none resize-none py-2.5 px-1 max-h-48 overflow-y-auto scrollbar-hide leading-relaxed"
              />

              <motion.button
                type="submit"
                disabled={chatLoading || !input.trim()}
                whileTap={{ scale: 0.94 }}
                className="w-10 h-10 bg-white text-black hover:bg-zinc-200 transition-colors rounded-xl disabled:opacity-20 cursor-pointer flex items-center justify-center shrink-0 shadow-md active:scale-95"
              >
                {chatLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin block" />
                ) : (
                  <Send size={14} strokeWidth={2.5} />
                )}
              </motion.button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
