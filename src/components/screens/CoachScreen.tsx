import { useStore } from "../../store/useStore";
import { AICoach } from "../AICoach";
import { motion } from "motion/react";

export function CoachScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto h-full flex flex-col pt-4 px-6 md:px-8"
    >
      <header className="mb-6 shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tighter">AI Coach</h1>
        <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold mt-1">
          Zero Excuses
        </p>
      </header>
      
      <div className="flex-1 overflow-hidden rounded-2xl glass mb-6 border border-white/10 relative">
        <AICoach />
      </div>
    </motion.div>
  );
}
