import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';

export const AICoach = () => {
  const { sendChat, loading } = useStore();
  const [messages, setMessages] = useState<{role: 'bot' | 'user', content: string}[]>([
    { role: 'bot', content: "Your streak is a monument to your discipline. What's next?" }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

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
      setMessages(prev => [...prev, { role: 'bot', content: "Coach offline. Keep moving regardless." }]);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3 shrink-0">
        <Sparkles size={16} className="text-orange-500" />
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Coach Protocol</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24">
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

      <form onSubmit={handleSend} className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black via-black/90 to-transparent pt-12">
        <div className="relative max-w-2xl mx-auto">
          <input 
            placeholder="Report progress..."
            className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40 transition-all pr-12 shadow-2xl"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-xl hover:bg-slate-200 transition-colors">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};
