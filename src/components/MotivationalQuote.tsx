import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import { Sparkles } from 'lucide-react';

export const MotivationalQuote = () => {
  const { quote, user } = useStore();

  if (!user) return null;

  return (
    <div className="py-12 px-4 text-center max-w-4xl mx-auto relative overflow-hidden">
      <motion.div
        key={quote}
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/5 border border-violet-500/10 text-[9px] uppercase tracking-[0.25em] text-violet-400 font-extrabold">
          <Sparkles size={10} className="text-violet-400 animate-pulse" />
          <span>Daily Focus Directive</span>
        </div>
        
        <h2 className="text-2xl md:text-5xl font-display font-light leading-[1.25] text-slate-100 tracking-tight max-w-2xl mx-auto">
          "{quote}"
        </h2>
        
        <div className="flex justify-center items-center gap-4 pt-4">
          <div className="h-[1px] w-8 bg-white/5" />
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] font-mono">System Protocol v3.2</p>
          <div className="h-[1px] w-8 bg-white/5" />
        </div>
      </motion.div>
    </div>
  );
};

