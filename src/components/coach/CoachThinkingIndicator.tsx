// src/components/coach/CoachThinkingIndicator.tsx

import React from "react";
import { motion } from "motion/react";
import { AICoachAvatar } from "../AICoachIcon";

interface CoachThinkingIndicatorProps {
  statusText?: string;
}

export const CoachThinkingIndicator: React.FC<CoachThinkingIndicatorProps> = ({
  statusText = "Analyzing your protocol...",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 w-full max-w-3xl mx-auto px-2 sm:px-4 py-2"
    >
      <div className="shrink-0 mt-0.5">
        <AICoachAvatar size="md" active animate />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300 font-mono">
            OneDay Coach
          </span>
          <span className="text-[10px] text-slate-500 font-mono">• Thinking</span>
        </div>

        <div className="p-3.5 rounded-2xl rounded-tl-sm bg-[#121216] border border-white/[0.09] shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-3">
          {/* Pulsing Dots */}
          <div className="flex items-center gap-1.5">
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.15, 0.9] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", times: [0, 0.5, 1] }}
              className="w-1.5 h-1.5 rounded-full bg-white"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.15, 0.9] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.2, times: [0, 0.5, 1] }}
              className="w-1.5 h-1.5 rounded-full bg-slate-300"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.15, 0.9] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.4, times: [0, 0.5, 1] }}
              className="w-1.5 h-1.5 rounded-full bg-slate-500"
            />
          </div>

          <span className="text-xs font-medium text-slate-300 tracking-tight">
            {statusText}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
