// src/components/coach/CoachEmptyState.tsx

import React from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Flame, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { MonolithLogo } from "../MonolithLogo";
import { User, Habit } from "../../types";
import { getSmartGreeting, getContextAwarePrompts } from "../../utils/coachUtils";

interface CoachEmptyStateProps {
  user: User | null;
  habits: Habit[];
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

export const CoachEmptyState: React.FC<CoachEmptyStateProps> = ({
  user,
  habits,
  onSelectPrompt,
  disabled = false,
}) => {
  const greeting = getSmartGreeting(user, habits);
  const quickPrompts = getContextAwarePrompts(habits);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-10 flex flex-col items-center select-none">
      {/* Monolith Emblem & Branding */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center text-center mb-6 sm:mb-8"
      >
        <div className="relative mb-4">
          <MonolithLogo size={52} className="shadow-[0_0_30px_rgba(255,255,255,0.15)]" />
          <div className="absolute -inset-2 rounded-2xl bg-white/5 blur-xl -z-10" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5 font-display">
          What are we working on?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-md">
          Your discipline. Your system. Your next move.
        </p>
      </motion.div>

      {/* Dynamic Smart Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="w-full mb-6 sm:mb-8"
      >
        <div
          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            greeting.statusType === "ahead"
              ? "bg-[#0d1813] border-emerald-500/30 text-emerald-100 shadow-[0_4px_24px_rgba(16,185,129,0.08)]"
              : greeting.statusType === "behind"
              ? "bg-[#16121a] border-amber-500/30 text-amber-100 shadow-[0_4px_24px_rgba(245,158,11,0.08)]"
              : "bg-[#111116] border-white/[0.1] text-zinc-100 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          }`}
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                greeting.statusType === "ahead"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : greeting.statusType === "behind"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-white/10 text-white border border-white/20"
              }`}
            >
              {greeting.statusType === "ahead" ? (
                <CheckCircle2 size={16} />
              ) : greeting.statusType === "behind" ? (
                <AlertCircle size={16} />
              ) : (
                <Flame size={16} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white leading-tight">
                  {greeting.headline}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/10 text-zinc-300 font-mono">
                  {greeting.tag}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {greeting.subtext}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Starter Protocol Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="w-full space-y-2.5"
      >
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 font-mono flex items-center gap-1.5">
            <Sparkles size={11} className="text-slate-300" />
            Tactical Protocols
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Tap to execute</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {quickPrompts.map((item, idx) => (
            <motion.button
              key={idx}
              disabled={disabled}
              onClick={() => onSelectPrompt(item.prompt)}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="p-3.5 rounded-2xl bg-[#111116] hover:bg-[#16161d] active:bg-[#1a1a24] border border-white/[0.08] hover:border-white/20 text-left transition-all duration-200 group flex items-start justify-between gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.4)] disabled:opacity-50 cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm select-none shrink-0">{item.icon}</span>
                  <p className="text-xs font-bold text-white group-hover:text-zinc-100 transition-colors tracking-tight">
                    {item.label}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="w-6 h-6 rounded-lg bg-white/[0.04] group-hover:bg-white/15 border border-white/[0.06] group-hover:border-white/20 flex items-center justify-center text-slate-400 group-hover:text-white transition-all shrink-0 mt-0.5">
                <ArrowUpRight size={12} strokeWidth={2.5} />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
