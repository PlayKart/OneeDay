import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export function TitleLossModal() {
  const { titleLossData, setTitleLossData } = useStore();

  if (!titleLossData) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 via-transparent to-transparent pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
        transition={{ 
          scale: { type: "spring", damping: 25, stiffness: 300 },
          x: { duration: 0.4, delay: 0.1 }
        }}
        className="relative w-full max-w-md bg-[#0a0a0a]/95 border border-red-500/40 rounded-3xl p-8 shadow-[0_0_80px_rgba(239,68,68,0.2)] text-center flex flex-col items-center"
      >
        {/* Glow effect */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          <AlertTriangle size={40} className="animate-pulse" />
        </div>

        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400/90 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full mb-3">
          Title Lost
        </span>

        <h2 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">
          {titleLossData.title}
        </h2>

        <div className="my-4 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl w-full">
          <p className="text-red-200/90 text-sm italic leading-relaxed font-medium">
            "{titleLossData.signature}"
          </p>
        </div>

        <p className="text-xs text-slate-400 font-medium mb-8 leading-relaxed">
          {titleLossData.reason || "Your XP dropped below the required threshold. Every setback is temporary. Earn it back."}
        </p>

        <button
          onClick={() => setTitleLossData(null)}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_25px_rgba(239,68,68,0.4)] active:scale-95 cursor-pointer text-sm uppercase tracking-wider"
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
}
