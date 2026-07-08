import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, Sparkles, ShieldAlert, Target, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

export const AICoach = () => {
  const { sendChat, loading, user, habits } = useStore();
  const [messages, setMessages] = useState<{role: 'bot' | 'user', content: string}[]>([
    { role: 'bot', content: "Your streak is a monument to your discipline. What's next?" }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    
    try {
      const reply = await sendChat(textToSend);
      setMessages(prev => [...prev, { role: 'bot', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', content: "Coach offline. Keep moving regardless." }]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const currentInput = input;
    setInput('');
    await handleSendMessage(currentInput);
  };

  const handleChipClick = async (prompt: string) => {
    if (loading) return;
    await handleSendMessage(prompt);
  };

  // Calculate stats to display in real-time synced banner
  const totalHabits = habits?.length || 0;
  const completedToday = habits?.filter(h => h.completedToday).length || 0;

  const quickPrompts = [
    { label: "🔍 Audit neglected habits", text: "Audit my neglected habits today." },
    { label: "🔥 Keep streak alive", text: "Push me to keep my streak alive!" },
    { label: "📊 Assess my progress", text: "Assess my progress today." }
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Real-time Synced Context Header */}
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles size={16} className="text-orange-500 animate-pulse" />
          <div>
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Coach Protocol</h3>
            {user && (
              <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                Synced: {user.name} • Lvl {user.level} • {user.streak}d streak
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-2 py-1 bg-white/5 border border-white/10 rounded-full font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Target size={10} className="text-slate-400" />
            {completedToday}/{totalHabits} habits complete
          </span>
        </div>
      </div>

      {/* Chat messages viewport */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-36">
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={i} 
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-white/10 text-white rounded-tr-none' : 'bg-transparent text-slate-300 rounded-tl-none border border-white/10'}`}>
              {msg.content}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating control zone for action chips and input form */}
      <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black via-black/95 to-transparent pt-12 flex flex-col gap-3">
        {/* Quick action chips aligned with the new backend features */}
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto w-full">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(p.text)}
              disabled={loading}
              className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="relative max-w-2xl mx-auto w-full">
          <input 
            placeholder={loading ? "Coach is thinking..." : "Report progress..."}
            disabled={loading}
            className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40 transition-all pr-12 shadow-2xl disabled:opacity-50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:hover:bg-white"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin block" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
