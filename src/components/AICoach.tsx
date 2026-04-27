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
    <div className="glass flex flex-col h-[400px] overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
        <Sparkles size={16} className="text-orange-500" />
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Coach Protocol</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={i} 
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`p-4 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'chat-bubble-bot text-slate-200 rounded-tl-none border border-white/5'}`}>
              {msg.content}
            </div>
          </motion.div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/5">
        <div className="relative">
          <input 
            placeholder="Report progress..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all pr-12"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-orange-500 hover:text-orange-400 transition-colors">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};
