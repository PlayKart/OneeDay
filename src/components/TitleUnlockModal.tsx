import React from 'react';
import { motion } from 'motion/react';
import { Trophy, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export function TitleUnlockModal() {
  const { titleUnlockData, setTitleUnlockData } = useStore();

  if (!titleUnlockData) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-[#0a0a0a]/95 border border-amber-500/40 rounded-3xl p-8 shadow-[0_0_80px_rgba(245,158,11,0.2)] text-center flex flex-col items-center"
      >
        {/* Glow effect */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
        >
          <Trophy size={40} className="animate-pulse" />
        </motion.div>

        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-3">
          New Title Unlocked
        </span>

        <h2 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">
          {titleUnlockData.title}
        </h2>

        <div className="my-4 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl w-full">
          <p className="text-amber-200/90 text-sm italic leading-relaxed font-medium">
            "{titleUnlockData.signature}"
          </p>
        </div>

        <div className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-8">
          Level {titleUnlockData.level} Achieved
        </div>

        <button
          onClick={() => setTitleUnlockData(null)}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_25px_rgba(245,158,11,0.4)] active:scale-95 cursor-pointer text-sm uppercase tracking-wider"
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
}
