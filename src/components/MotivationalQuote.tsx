import { motion } from 'motion/react';
import { useStore } from '../store/useStore';

export const MotivationalQuote = () => {
  const { quote, user } = useStore();

  if (!user) return null;

  return (
    <div className="py-20 px-4 text-center max-w-4xl mx-auto">
      <motion.div
        key={quote}
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="text-[10px] uppercase tracking-[0.5em] text-orange-500 font-black mb-6 block opacity-50">Operational Directive</span>
        <h1 className="text-4xl md:text-7xl font-display font-black leading-[1] text-white selection:bg-orange-500/30 tracking-[-0.04em]">
          {quote}
        </h1>
        <div className="mt-12 flex justify-center items-center gap-6">
          <div className="h-[1px] w-12 bg-white/5" />
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Protocol OneDay.v1</p>
          <div className="h-[1px] w-12 bg-white/5" />
        </div>
      </motion.div>
    </div>
  );
};
