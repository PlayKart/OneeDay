import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cpu, 
  Sliders, 
  LayoutGrid, 
  Layers, 
  ShieldCheck, 
  Terminal, 
  Zap, 
  CheckCircle2, 
  Sun, 
  Sparkles, 
  Award, 
  ArrowRight,
  Check
} from "lucide-react";

export type TransitionVariant = "calibrating" | "building" | "protocol" | "one-day" | "ready";

interface OnboardingTransitionProps {
  variant?: TransitionVariant;
  onComplete?: () => void;
  userName?: string;
  persistent?: boolean;
  buttonText?: string;
  onAction?: () => void;
}

export function OnboardingTransition({
  variant = "calibrating",
  onComplete,
  userName = "Champion",
  persistent = false,
  buttonText,
  onAction,
}: OnboardingTransitionProps) {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Auto-progress timer for smooth transition (approx 2.4 seconds)
  useEffect(() => {
    if (persistent) {
      // Indeterminate pulsing progress for persistent loading states
      const interval = setInterval(() => {
        setProgress(prev => (prev >= 92 ? 92 : prev + 4));
      }, 100);
      return () => clearInterval(interval);
    }

    const startTime = Date.now();
    const duration = 2400; // 2.4s

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const current = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        setIsFinished(true);
        if (onComplete) {
          const timer = setTimeout(() => {
            onComplete();
          }, 300);
          return () => clearTimeout(timer);
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete, persistent]);

  // Safety fallback / action handler
  const handleAction = () => {
    setIsFinished(true);
    if (onAction) {
      onAction();
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-[#050505]/95 backdrop-blur-2xl overflow-hidden select-none">
      {/* Background ambient radial glow matching variant */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {variant === "calibrating" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        )}
        {variant === "building" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-emerald-600/10 rounded-full blur-[120px]" />
        )}
        {variant === "protocol" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-purple-600/15 rounded-full blur-[140px]" />
        )}
        {variant === "one-day" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-amber-500/10 rounded-full blur-[130px]" />
        )}
        {variant === "ready" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-emerald-500/12 rounded-full blur-[130px]" />
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-[#0a0a0a]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col items-center text-center overflow-hidden"
      >
        {/* ==========================================================
            VARIANT 1: "CALIBRATING YOUR SYSTEM"
           ========================================================== */}
        {variant === "calibrating" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-blue-400 mb-6 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
              <Cpu size={28} className="animate-pulse" />
            </div>
            
            <div className="space-y-2 mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
                Initialization
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                CALIBRATING YOUR SYSTEM…
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Setting things up around you.
              </p>
            </div>

            {/* Thin progress indicator */}
            <div className="w-full space-y-2 mb-8">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>System Sync</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden p-[1px]">
                <motion.div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </>
        )}

        {/* ==========================================================
            VARIANT 2: "BUILDING YOUR DAY"
           ========================================================== */}
        {variant === "building" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <LayoutGrid size={28} />
            </div>

            <div className="space-y-2 mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                BUILDING YOUR DAY…
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Your goals. Your habits. Your pace.
              </p>
            </div>

            {/* Minimal bento-style composition preview */}
            <div className="grid grid-cols-2 gap-2.5 w-full mb-8">
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-left flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Habits</span>
                <span className="text-sm font-black text-white mt-2">Active Protocol</span>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-left flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Streak</span>
                <span className="text-sm font-black text-emerald-400 mt-2">Day 1 Ready</span>
              </div>
            </div>

            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
              <motion.div 
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}

        {/* ==========================================================
            VARIANT 3: "PREPARING YOUR PROTOCOL"
           ========================================================== */}
        {variant === "protocol" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
              <ShieldCheck size={28} />
            </div>

            <div className="space-y-2 mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">
                Security & Sync
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                PREPARING YOUR PROTOCOL…
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Everything is ready for your next day.
              </p>
            </div>

            <div className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 mb-8 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                  <Terminal size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Protocol Alpha</div>
                  <div className="text-[10px] text-slate-400">Optimizing sanctuary...</div>
                </div>
              </div>
              <span className="text-xs font-black text-purple-400">{progress}%</span>
            </div>
          </>
        )}

        {/* ==========================================================
            VARIANT 4: "ONE DAY AT A TIME"
           ========================================================== */}
        {variant === "one-day" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
              <Sun size={28} />
            </div>

            <div className="space-y-2 mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
                Sanctuary
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ONE DAY AT A TIME.
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                You're ready to begin.
              </p>
            </div>

            <div className="w-full flex items-center justify-center gap-2 py-3 bg-white/[0.02] border border-white/10 rounded-2xl mb-8">
              <CheckCircle2 size={16} className="text-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-300">Mindset Synchronized</span>
            </div>
          </>
        )}

        {/* ==========================================================
            VARIANT 5: "YOUR SYSTEM IS READY"
           ========================================================== */}
        {variant === "ready" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
              <Sparkles size={28} />
            </div>

            <div className="space-y-2 mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                Complete
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                YOUR SYSTEM IS READY.
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Let's make today count.
              </p>
            </div>

            <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-8 flex items-center justify-center gap-3">
              <Check size={18} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">Welcome, {userName}</span>
            </div>
          </>
        )}

        {/* Manual Fallback / Enter Button (Ensures it never gets stuck) */}
        <button
          onClick={handleAction}
          className="w-full py-4 bg-white text-black font-extrabold rounded-2xl hover:bg-slate-200 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.2)] active:scale-95 cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <span>{buttonText || "Enter Dashboard"}</span>
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
}
