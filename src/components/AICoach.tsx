import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Bot, 
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
  Paperclip,
  Share2,
  Download,
  Flame,
  Zap,
  Activity,
  Award
} from 'lucide-react';
import { useStore, ChatSession, ChatMessage } from '../store/useStore';
import { toast } from 'react-hot-toast';

export const AICoach = () => {
  const {
    chatSessions,
    activeChatId,
    chatMessages,
    chatLoading,
    fetchSessions,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    pinSession,
    sendChatMessage,
    regenerateMessage,
    editPreviousMessage,
    user,
    habits
  } = useStore();

  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [viewState, setViewState] = useState<'split' | 'fullscreen'>('split');
  
  // Custom interactive states
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load chat sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Handle transition state based on activeChatId
  useEffect(() => {
    if (activeChatId) {
      setViewState('fullscreen');
    } else {
      setViewState('split');
    }
  }, [activeChatId]);

  // Scroll to bottom on message updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // Focus rename input when activated
  useEffect(() => {
    if (editingSessionId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingSessionId]);

  // Close three-dot menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
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
    
    await sendChatMessage(textToSend);
  };

  const handleChipClick = async (prompt: string) => {
    if (chatLoading) return;
    
    if (!activeChatId) {
      createSession();
      // wait a tiny bit to allow local state update
      setTimeout(() => {
        sendChatMessage(prompt);
      }, 100);
    } else {
      await sendChatMessage(prompt);
    }
  };

  const handleRenameSave = async (id: string) => {
    if (!renameText.trim()) {
      setEditingSessionId(null);
      return;
    }
    await renameSession(id, renameText);
    setEditingSessionId(null);
    toast.success("Conversation renamed");
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

  const handleDeleteMessageLocal = (msgId: string) => {
    const updated = chatMessages.filter(m => m.id !== msgId);
    useStore.setState({ chatMessages: updated });
    toast.success("Message deleted");
  };

  const handleClearChatLocal = () => {
    useStore.setState({ chatMessages: [] });
    setMenuOpen(false);
    toast.success("Chat history cleared locally");
  };

  const handleExportChat = () => {
    if (chatMessages.length === 0) {
      toast.error("No messages to export");
      return;
    }
    const text = chatMessages
      .map(m => `### ${m.role === 'user' ? 'User' : 'OneDay Coach'}\n\n${m.content}\n\n`)
      .join('---\n\n');
    const blob = new Blob([`# OneDay Coaching Log\n\n${text}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OneDay_Coaching_Log_${activeChatId || 'session'}.md`;
    a.click();
    setMenuOpen(false);
    toast.success("Chat history exported (.md)");
  };

  const handleFeedbackToggle = (msgId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type as any
    }));
    toast.success(type === 'up' ? "Thanks for your positive feedback!" : "Feedback recorded. Adjusting response strategy.");
  };

  const handleBackToSplit = () => {
    useStore.setState({ activeChatId: null });
    setViewState('split');
  };

  const handleSearchToggle = () => {
    setIsSearchActive(!isSearchActive);
    if (!isSearchActive) {
      // Transition to STATE 2
      setViewState('fullscreen');
    }
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

  // Filter and sort conversations
  const sortedSessions = [...chatSessions].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const filteredSessions = sortedSessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalHabits = habits?.length || 0;
  const completedToday = habits?.filter(h => h.completedToday).length || 0;

  const quickPrompts = [
    { label: "🔍 Audit neglected habits", text: "Audit my neglected habits today." },
    { label: "🔥 Keep streak alive", text: "Push me to keep my streak alive!" },
    { label: "📊 Assess my progress", text: "Assess my progress today." }
  ];

  return (
    <div className="flex h-full w-full bg-black text-white font-sans overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {viewState === 'split' ? (
          /* ── STATE 1: VERTICAL SPLIT VIEW ─────────────────────────────────────── */
          <motion.div
            key="state-split"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-full w-full"
          >
            {/* LEFT PANEL: 70% Beautiful Presentation */}
            <div className="hidden md:flex md:w-[70%] h-full flex-col justify-between p-12 border-r border-white/5 bg-black">
              {/* Premium Header Accent */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="text-[10px] tracking-[0.4em] uppercase font-bold text-slate-500">Coach Protocol v4.0</span>
              </div>

              {/* Big Slogan Typography */}
              <div className="max-w-xl my-auto space-y-6">
                <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-white leading-none">
                  True discipline is what you do when no one is watching.
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                  Your OneDay AI performance coach reads your habits, streaks, and focus metrics to custom-tailor performance strategies in real-time.
                </p>

                {/* Micro Stats Grid */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Completed Habits</p>
                    <p className="text-2xl font-bold mt-1 text-white">{completedToday}<span className="text-slate-600 text-sm font-medium">/{totalHabits}</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Discipline Level</p>
                    <p className="text-2xl font-bold mt-1 text-white">Lvl {user?.level || 1}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Streak</p>
                    <p className="text-2xl font-bold mt-1 text-white flex items-center gap-1.5">
                      <Flame size={18} className="text-orange-400 fill-orange-400" />
                      {user?.streak || 0}d
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Quick Chips */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Quick actions</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(p.text)}
                      className="text-xs font-medium px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer active:scale-95"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: 30% Recent Conversations */}
            <div className="w-full md:w-[30%] h-full flex flex-col justify-between p-8 bg-black relative">
              
              {/* Panel Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white leading-none">OneDay Coach</h1>
                  <p className="text-xs text-slate-500 mt-1">Your personal AI performance coach</p>
                </div>

                {/* Circular Search Icon */}
                <button
                  onClick={handleSearchToggle}
                  className="p-2 rounded-full border border-white/10 hover:bg-white/10 transition-all text-slate-300 hover:text-white cursor-pointer active:scale-95"
                  title="Search & open chat"
                >
                  <Search size={14} />
                </button>
              </div>

              {/* Recent Chats Cards List */}
              <div className="flex-1 overflow-y-auto py-6 space-y-3 scrollbar-hide">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Recent Chats</span>
                  {chatSessions.length > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400 font-bold">
                      {chatSessions.length}
                    </span>
                  )}
                </div>

                {chatSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-600">
                    <p className="text-xs uppercase font-bold tracking-widest">No previous chats</p>
                    <p className="text-[11px] mt-1 max-w-[180px]">Start your first coaching session below</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSessions.map((session) => {
                      const isActive = activeChatId === session.id;
                      const isEditing = editingSessionId === session.id;

                      return (
                        <div
                          key={session.id}
                          onClick={() => {
                            if (!isEditing) {
                              selectSession(session.id);
                            }
                          }}
                          className={`group flex flex-col p-4 rounded-2xl transition-all cursor-pointer border ${
                            isActive
                              ? "bg-white/10 border-white/20"
                              : "bg-[#0A0A0A] border-white/5 hover:border-white/20 hover:bg-[#111111]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <input
                                  ref={renameInputRef}
                                  value={renameText}
                                  onChange={(e) => setRenameText(e.target.value)}
                                  onBlur={() => handleRenameSave(session.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameSave(session.id);
                                    if (e.key === 'Escape') setEditingSessionId(null);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-white/5 border border-white/20 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                                />
                              ) : (
                                <h3 className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1.5">
                                  {session.is_pinned && <Pin size={10} className="text-orange-400 fill-orange-400 shrink-0" />}
                                  {session.title || "New Session"}
                                </h3>
                              )}
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                                {session.id === 'temp_new' ? 'Unsaved conversation' : 'Resume coaching chat history...'}
                              </p>
                            </div>
                            <span className="text-[9px] text-slate-500 shrink-0 mt-0.5">
                              {formatSessionDate(session.updated_at || session.created_at)}
                            </span>
                          </div>

                          {/* Quick Card Controls on Hover */}
                          {!isEditing && (
                            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity self-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  pinSession(session.id);
                                }}
                                className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors"
                              >
                                <Pin size={10} className={session.is_pinned ? "fill-orange-400 text-orange-400" : ""} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(session.id);
                                  setRenameText(session.title);
                                }}
                                className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors"
                              >
                                <Edit2 size={10} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(session.id);
                                }}
                                className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Large Rounded + New Chat Button */}
              <button
                onClick={createSession}
                className="w-full py-4 rounded-2xl border border-white bg-black hover:bg-white hover:text-black text-xs font-extrabold uppercase tracking-widest text-white transition-all cursor-pointer active:scale-98"
              >
                + New Chat
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── STATE 2: FULL-SCREEN CHAT VIEW ─────────────────────────────────────── */
          <motion.div
            key="state-chat"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full bg-black relative"
          >
            {/* Minimal Header */}
            <div className="p-4 border-b border-white/5 bg-black flex items-center justify-between gap-4 shrink-0 z-10">
              <button
                onClick={handleBackToSplit}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500">OneDay Coach Protocol</span>
                <span className="text-xs font-extrabold text-white truncate max-w-xs mt-0.5">
                  {chatSessions.find(s => s.id === activeChatId)?.title || "Coaching Session"}
                </span>
              </div>

              {/* Three-Dot Dropdown Menu Container */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 rounded-lg border border-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95"
                >
                  <MoreVertical size={14} />
                </button>

                {/* Dropdown panel */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 mt-2 w-48 bg-[#0D0D0D] border border-white/10 rounded-xl shadow-2xl py-1 z-30 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          const currentId = activeChatId;
                          if (currentId) {
                            setEditingSessionId(currentId);
                            setRenameText(chatSessions.find(s => s.id === currentId)?.title || "");
                          }
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <Edit2 size={12} />
                        Rename
                      </button>

                      <button
                        onClick={handleClearChatLocal}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <RotateCcw size={12} />
                        Clear Conversation
                      </button>

                      <button
                        onClick={handleExportChat}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <Download size={12} />
                        Export Chat
                      </button>

                      <div className="border-t border-white/5 my-1" />

                      <button
                        onClick={() => {
                          if (activeChatId) {
                            deleteSession(activeChatId);
                            handleBackToSplit();
                          }
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/20 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={12} />
                        Delete Chat
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Rename Input Modal Overlay (when editing from header dropdown) */}
            <AnimatePresence>
              {editingSessionId === activeChatId && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-2xl"
                  >
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Rename Conversation</h3>
                    <input
                      value={renameText}
                      onChange={(e) => setRenameText(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/35 mb-4"
                      placeholder="Enter new conversation name..."
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingSessionId(null)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => activeChatId && handleRenameSave(activeChatId)}
                        className="px-4 py-2 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-extrabold transition-all cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Chat Messages Viewport */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 pb-40"
              id="chat-messages-scroll"
            >
              {/* Optional inline search bar inside full view if search active */}
              {isSearchActive && (
                <div className="max-w-2xl mx-auto w-full mb-4">
                  <div className="relative w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      placeholder="Filter conversations or search query..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-8 text-xs text-white focus:outline-none focus:border-white/20"
                    />
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchActive(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {chatMessages.length === 0 ? (
                /* Empty / Welcome prompts state */
                <div className="max-w-xl mx-auto text-center py-20 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
                    <Bot size={24} className="text-white" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight mb-2">Discipline Starts Today</h2>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-8">
                    Your performance telemetry is active. Report progress, audit routines, or seek strategic accountability.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                    {quickPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChipClick(p.text)}
                        disabled={chatLoading}
                        className="text-[11px] font-bold p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer text-center disabled:opacity-50"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isMessageEditing = editingMessageId === msg.id;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      key={msg.id}
                      className={`flex items-start gap-4 group/msg max-w-3xl mx-auto ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* Avatar icon */}
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Bot size={12} />
                        </div>
                      )}

                      <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end max-w-[80%]' : 'items-start max-w-[85%]'}`}>
                        
                        {/* Message Content */}
                        {isUser ? (
                          /* USER MESSAGE: Dark gray bubble, white text, 20px corners */
                          <div className="bg-[#1A1A1A] text-white px-5 py-3.5 rounded-[20px] rounded-tr-sm border border-white/5 text-sm leading-relaxed whitespace-pre-wrap shadow-xl">
                            {isMessageEditing ? (
                              <div className="flex flex-col gap-2 min-w-[220px]">
                                <textarea
                                  value={editingMessageText}
                                  onChange={(e) => setEditingMessageText(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none resize-none h-16"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setEditingMessageId(null)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] uppercase font-bold"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleEditMessageSave(msg.id)}
                                    className="px-2.5 py-1 bg-white text-black hover:bg-slate-200 rounded text-[10px] uppercase font-black"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              msg.content
                            )}
                          </div>
                        ) : (
                          /* ASSISTANT MESSAGE: Left aligned, no bubble, premium typography */
                          <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap select-text pl-1 py-1">
                            {msg.content}
                          </div>
                        )}

                        {/* Hover Action Bar */}
                        {!isMessageEditing && (
                          <div
                            className={`flex items-center gap-3 opacity-0 group-hover/msg:opacity-100 transition-opacity text-[9px] text-slate-500 font-bold uppercase tracking-wider px-1 mt-1`}
                          >
                            {isUser ? (
                              <>
                                <button
                                  onClick={() => handleEditMessageClick(msg)}
                                  className="hover:text-white flex items-center gap-1 transition-colors"
                                  title="Edit prompt"
                                >
                                  <Edit2 size={9} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMessageLocal(msg.id)}
                                  className="hover:text-red-400 flex items-center gap-1 transition-colors text-slate-500"
                                  title="Delete message locally"
                                >
                                  <Trash2 size={9} />
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
                                  <Copy size={9} />
                                  Copy
                                </button>
                                <button
                                  onClick={() => regenerateMessage(msg.id)}
                                  className="hover:text-white flex items-center gap-1 transition-colors"
                                  title="Regenerate reply"
                                >
                                  <RotateCcw size={9} />
                                  Regenerate
                                </button>
                                <button
                                  onClick={() => handleFeedbackToggle(msg.id, 'up')}
                                  className={`flex items-center gap-1 transition-colors hover:text-white ${feedback[msg.id] === 'up' ? 'text-white' : 'text-slate-500'}`}
                                  title="Thumbs up"
                                >
                                  <ThumbsUp size={9} className={feedback[msg.id] === 'up' ? 'fill-white' : ''} />
                                </button>
                                <button
                                  onClick={() => handleFeedbackToggle(msg.id, 'down')}
                                  className={`flex items-center gap-1 transition-colors hover:text-white ${feedback[msg.id] === 'down' ? 'text-red-400' : 'text-slate-500'}`}
                                  title="Thumbs down"
                                >
                                  <ThumbsDown size={9} className={feedback[msg.id] === 'down' ? 'fill-red-400' : ''} />
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

              {/* Typing bounce indicator */}
              {chatLoading && (
                <div className="flex items-start gap-4 max-w-3xl mx-auto">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center shrink-0">
                    <Bot size={11} />
                  </div>
                  <div className="py-2.5 px-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Rounded Input Box Overlay */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent pt-12 z-20">
              <div className="max-w-2xl mx-auto w-full">
                
                {/* Micro suggested prompts list if messages present but short */}
                {chatMessages.length > 0 && chatMessages.length < 5 && (
                  <div className="flex gap-1.5 justify-center overflow-x-auto pb-3 mb-1 scrollbar-hide">
                    {quickPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChipClick(p.text)}
                        className="text-[9px] font-bold px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 bg-[#0A0A0A] hover:bg-[#111111] text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSend} className="relative w-full flex items-end gap-2 bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 px-3 shadow-2xl focus-within:border-white/25 transition-all">
                  
                  {/* Disabled Paperclip Attachment Button */}
                  <button
                    type="button"
                    disabled
                    className="p-2 text-slate-500 cursor-not-allowed shrink-0 rounded-lg"
                    title="Attachment (disabled)"
                  >
                    <Paperclip size={15} />
                  </button>

                  {/* Auto-Expanding Textarea Input */}
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder={chatLoading ? "Coaching session payload generating..." : "Ask me anything..."}
                    disabled={chatLoading}
                    className="flex-1 bg-transparent border-0 outline-none text-white text-sm placeholder:text-slate-500 focus:ring-0 focus:outline-none resize-none py-2 px-1 max-h-48 overflow-y-auto scrollbar-hide leading-relaxed"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={chatLoading || !input.trim()}
                    className="p-2.5 bg-white text-black hover:bg-slate-200 transition-colors rounded-xl disabled:opacity-40 disabled:hover:bg-white cursor-pointer active:scale-95 shrink-0 flex items-center justify-center"
                  >
                    {chatLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin block" />
                    ) : (
                      <Send size={13} />
                    )}
                  </button>

                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
