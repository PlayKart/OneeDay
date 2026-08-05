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
import { useStore, ChatSession, ChatMessage } from '../store/useStore';
import { toast } from 'react-hot-toast';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load chat sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Scroll to bottom on message updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

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
    
    await sendChatMessage(textToSend);
  };

  const handleChipClick = async (prompt: string) => {
    if (chatLoading) return;
    await sendChatMessage(prompt);
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

  const handleDeleteMessageLocal = (msgId: string) => {
    const safeMsgs = Array.isArray(chatMessages) ? chatMessages : [];
    const updated = safeMsgs.filter(m => m && m.id !== msgId);
    useStore.setState({ chatMessages: updated });
    toast.success("Message deleted");
  };

  const handleClearChatLocal = () => {
    useStore.setState({ chatMessages: [] });
    setMenuOpen(false);
    toast.success("Chat history cleared locally");
  };

  const handleExportChat = () => {
    const safeMsgs = Array.isArray(chatMessages) ? chatMessages : [];
    if (safeMsgs.length === 0) {
      toast.error("No messages to export");
      return;
    }
    const text = safeMsgs
      .map(m => m ? `### ${m.role === 'user' ? 'User' : 'OneDay Coach'}\n\n${m.content}\n\n` : "")
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
    session && typeof session.title === "string" && session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const safeChatMessages = Array.isArray(chatMessages) ? chatMessages : [];

  const quickPrompts = [
    { label: "Build Discipline", text: "Help me build rock-solid discipline today." },
    { label: "Study", text: "Help me design an effective study revision plan." },
    { label: "Workout", text: "Give me an intense workout routine for today." },
    { label: "Sports", text: "Help me optimize my athletic training and competitive sports performance." },
    { label: "Productivity", text: "How can I double my focus and productivity today?" },
    { label: "Motivation", text: "Give me a direct, no-nonsense motivational push." },
    { label: "Life", text: "Give me strategic advice on balancing my life goals and personal growth." }
  ];

  return (
    <div className="flex h-full w-full bg-[#070707] text-white font-sans overflow-hidden select-none relative">
      
      {/* MOBILE HEADER BAR */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0A0A0A] absolute top-0 inset-x-0 h-14 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <Menu size={18} />
        </button>
        <span className="text-xs font-black tracking-widest uppercase text-white">OneDay AI Coach</span>
        <button
          onClick={handleStartNewChat}
          className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* SIDEBAR CONTAINER (DESKTOP & MOBILE RESPONSIVE) */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 w-72 md:w-80 bg-[#0A0A0A] border-r border-white/5 h-full z-40 flex flex-col justify-between transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0 flex shadow-2xl' : '-translate-x-full md:translate-x-0 md:flex'}
        `}
      >
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* SIDEBAR HEADER */}
          <div className="p-4 flex items-center justify-between border-b border-white/5 shrink-0 h-14">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Conversations</span>
            </div>
            {/* Mobile sidebar close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* SEARCH INPUT */}
          <div className="px-4 pt-4 pb-2 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111111] border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* + NEW CHAT BUTTON */}
          <div className="px-4 py-2 shrink-0">
            <button
              onClick={handleStartNewChat}
              className="w-full py-3 rounded-xl border border-white/10 hover:border-white/25 bg-black hover:bg-white hover:text-black text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              New Chat
            </button>
          </div>

          {/* CHAT HISTORY LIST */}
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-hide min-h-0">
            {sessionsLoading ? (
              <div className="space-y-2 px-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#111111] border border-white/5 animate-pulse space-y-2">
                    <div className="h-3 w-3/4 bg-white/5 rounded" />
                    <div className="h-2.5 w-1/2 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-600">
                <MessageSquare size={20} className="text-slate-700 mb-2" />
                <p className="text-xs uppercase font-bold tracking-widest text-slate-500">No chats found</p>
                <p className="text-[11px] mt-1 max-w-[180px] text-slate-500">Auto-created sessions appear here.</p>
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
                    className={`group relative flex items-center justify-between px-3 py-3 rounded-xl transition-all cursor-pointer border ${
                      isActive
                        ? "bg-white/10 border-white/5"
                        : "bg-transparent border-transparent hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Bot size={15} className={`shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"} transition-colors`} />
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
                          className="flex-1 bg-[#111] border border-white/20 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                          {cleanTitle(session.title)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {session.is_pinned && <Pin size={10} className="text-orange-400 fill-orange-400" />}
                      <span className="text-[10px] text-slate-500 group-hover:hidden block">
                        {formatSessionDate(session.updated_at || session.created_at)}
                      </span>
                      
                      {/* Actions Button */}
                      <div className="relative group-hover:block hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSessionMenuId(activeSessionMenuId === session.id ? null : session.id);
                          }}
                          className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <MoreHorizontal size={12} />
                        </button>
                        
                        {activeSessionMenuId === session.id && (
                          <div 
                            className="absolute right-0 mt-1 w-32 bg-[#121212] border border-white/10 rounded-lg shadow-2xl py-1 z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={async () => {
                                await pinSession(session.id);
                                setActiveSessionMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/5 flex items-center gap-1.5 font-bold"
                            >
                              <Pin size={10} />
                              {session.is_pinned ? "Unpin" : "Pin"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingSessionId(session.id);
                                setRenameText(session.title || "New Chat");
                                setActiveSessionMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/5 flex items-center gap-1.5 font-bold"
                            >
                              <Edit2 size={10} />
                              Rename
                            </button>
                            <button
                              onClick={() => {
                                toast.success("Conversation archived");
                                setActiveSessionMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/5 flex items-center gap-1.5 font-bold"
                            >
                              <Archive size={10} />
                              Archive
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this conversation?")) {
                                  deleteSession(session.id);
                                }
                                setActiveSessionMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-950/20 flex items-center gap-1.5 font-bold"
                            >
                              <Trash2 size={10} />
                              Delete
                            </button>
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
        <div className="p-4 border-t border-white/5 shrink-0 bg-[#070707] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <User size={14} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'OneDay Executioner'}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Level {user?.level || 1} • {user?.streak || 0}d streak</p>
          </div>
        </div>

      </div>

      {/* MOBILE SIDEBAR BACKGROUND OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity"
        />
      )}

      {/* RIGHT MAIN CHAT COLUMN */}
      <div className="flex-1 flex flex-col h-full bg-black relative pt-14 md:pt-0 overflow-hidden">
        
        {/* CHAT HEADER */}
        <div className="p-4 border-b border-white/5 bg-black flex items-center justify-between gap-4 shrink-0 z-10 h-14">
          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white transition-all"
            >
              <Menu size={16} />
            </button>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 leading-none">AI Personal Coach</span>
              <span className="text-xs font-black text-white truncate max-w-xs mt-0.5 leading-none">
                {activeChatId ? cleanTitle(safeChatSessions.find(s => s && s.id === activeChatId)?.title || "Active Coach session") : "Active Coach session"}
              </span>
            </div>
          </div>

          {/* Three-Dot Menu dropdown wrapper */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <MoreVertical size={14} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-48 bg-[#121212] border border-white/10 rounded-xl shadow-2xl py-1 z-30 overflow-hidden"
                >
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
                      if (activeChatId && window.confirm("Are you sure you want to delete this conversation?")) {
                        deleteSession(activeChatId);
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

        {/* MESSAGES VIEWPORT */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-36"
          id="chat-messages-scroll"
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
            <div className="max-w-xl mx-auto text-center py-16 md:py-24 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                <Bot size={28} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-white">What are we conquering today?</h2>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-sm mb-8">
                I remember every conversation separately.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(p.text)}
                    disabled={chatLoading}
                    className="text-xs font-bold p-3.5 rounded-xl bg-[#111111] hover:bg-white hover:text-black border border-white/10 text-slate-300 transition-all cursor-pointer text-center disabled:opacity-50 active:scale-95 shadow-md"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
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
                  className={`flex items-start gap-4 group/msg max-w-3xl mx-auto ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={12} />
                    </div>
                  )}

                  <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end max-w-[80%]' : 'items-start max-w-[85%]'}`}>
                    
                    {isUser ? (
                      /* USER MESSAGE BUBBLE */
                      <div className="bg-[#1C1C1C] text-white px-5 py-3.5 rounded-[20px] rounded-tr-sm border border-white/5 text-sm leading-relaxed whitespace-pre-wrap shadow-xl">
                        {isMessageEditing ? (
                          <div className="flex flex-col gap-2 min-w-[220px]">
                            <textarea
                              value={editingMessageText}
                              onChange={(e) => setEditingMessageText(e.target.value)}
                              className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none h-16"
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
                      /* ASSISTANT MESSAGE */
                      <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap select-text pl-1 py-1">
                        {msg.content}
                      </div>
                    )}

                    {/* Action Bar */}
                    {!isMessageEditing && (
                      <div
                        className="flex items-center gap-3 opacity-0 group-hover/msg:opacity-100 transition-opacity text-[9px] text-slate-500 font-bold uppercase tracking-wider px-1 mt-1"
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
                              title="Delete message"
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
                              title="Regenerate"
                            >
                              <RotateCcw size={9} />
                              Regenerate
                            </button>
                            <button
                              onClick={() => handleFeedbackToggle(msg.id, 'up')}
                              className={`flex items-center gap-1 transition-colors hover:text-white ${feedback[msg.id] === 'up' ? 'text-white' : 'text-slate-500'}`}
                            >
                              <ThumbsUp size={9} className={feedback[msg.id] === 'up' ? 'fill-white' : ''} />
                            </button>
                            <button
                              onClick={() => handleFeedbackToggle(msg.id, 'down')}
                              className={`flex items-center gap-1 transition-colors hover:text-white ${feedback[msg.id] === 'down' ? 'text-red-400' : 'text-slate-500'}`}
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

          {/* STREAMING / TYPING LOADER */}
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

        {/* BOTTOM INPUT BAR */}
        <div className="absolute bottom-0 inset-x-0 p-4 md:p-6 bg-gradient-to-t from-black via-black/95 to-transparent pt-12 z-20">
          <div className="max-w-2xl mx-auto w-full">
            
            {safeChatMessages.length > 0 && safeChatMessages.length < 5 && (
              <div className="flex gap-1.5 justify-center overflow-x-auto pb-3 mb-1 scrollbar-hide">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(p.text)}
                    className="text-[9px] font-bold px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 bg-[#111] hover:bg-white hover:text-black text-slate-400 transition-all shrink-0 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="relative w-full flex items-end gap-2 bg-[#0E0E0E] border border-white/10 rounded-2xl p-2 px-3 shadow-2xl focus-within:border-white/25 transition-all">
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
                placeholder={chatLoading ? "Coach is generating strategy..." : "Message your OneDay AI Coach..."}
                disabled={chatLoading}
                className="flex-1 bg-transparent border-0 outline-none text-white text-sm placeholder:text-slate-500 focus:ring-0 focus:outline-none resize-none py-2 px-1 max-h-48 overflow-y-auto scrollbar-hide leading-relaxed"
              />

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

      </div>

    </div>
  );
};
