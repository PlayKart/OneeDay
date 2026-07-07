import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, Image as ImageIcon, Paperclip, Mic, ArrowUp } from 'lucide-react';
import { useStore } from '../store/useStore';

export const AICoach = () => {
  const { sendChat, loading } = useStore();
  const [messages, setMessages] = useState<{role: 'bot' | 'user', content: string}[]>([
    { role: 'bot', content: "Your progress is a monument to your discipline. Let's optimize your routine. What's standing in your way today?" }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    
    try {
      const reply = await sendChat(userMsg);
      setMessages(prev => [...prev, { role: 'bot', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', content: "Coach offline. Maintain discipline regardless." }]);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-black">
      {/* Header Panel */}
      <div className="p-4 border-b border-white/[0.05] bg-black flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <Sparkles size={11} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 tracking-wide">AI Discipline Engine</h3>
            <span className="text-[8px] font-bold text-white uppercase tracking-widest block leading-none">Intelligence Coach</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Operational</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide pb-28">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              key={i} 
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <Sparkles size={11} className="text-white" />
                </div>
              )}
              
              <div className={`max-w-[85%] text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-white/[0.04] border border-white/10 rounded-[1.25rem] rounded-tr-sm px-4 py-3 text-slate-200 shadow-md font-sans' 
                  : 'text-slate-300 py-1 font-sans font-light'
              }`}>
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <User size={12} className="text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI Pulse Thinking Wave */}
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 animate-spin-slow">
              <Sparkles size={11} className="text-white" />
            </div>
            <div className="flex-1 space-y-2 max-w-sm pt-2">
              <div className="h-1.5 w-full bg-white rounded-full animate-pulse opacity-40" />
              <div className="h-1.5 w-[75%] bg-white rounded-full animate-pulse opacity-20" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Capsule Input Form */}
      <form onSubmit={handleSend} className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent pt-12">
        <div className="relative max-w-2xl mx-auto brand-border-glow rounded-[1.75rem]">
          <div className="w-full bg-black border border-white/10 rounded-[1.75rem] px-5 py-3 flex items-center gap-3 shadow-2xl">
            {/* Visual Action Buttons inside the input pill */}
            <div className="flex items-center gap-2.5 text-slate-500">
              <button type="button" className="hover:text-slate-300 transition-colors cursor-pointer">
                <Paperclip size={16} />
              </button>
              <button type="button" className="hover:text-slate-300 transition-colors cursor-pointer">
                <ImageIcon size={16} />
              </button>
            </div>

            <input 
              placeholder="Ask anything or report progress..."
              className="flex-1 bg-transparent border-none text-slate-200 placeholder:text-slate-500 focus:outline-none text-xs md:text-sm py-1 font-light"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />

            <div className="flex items-center gap-2.5">
              <button type="button" className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                <Mic size={16} />
              </button>
              <button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="p-1.5 bg-slate-200 text-black hover:bg-white disabled:bg-white/[0.03] disabled:text-slate-600 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center shadow-lg active:scale-95"
              >
                <ArrowUp size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

