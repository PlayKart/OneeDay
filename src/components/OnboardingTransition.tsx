import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cpu, 
  LayoutGrid, 
  ShieldCheck, 
  Terminal, 
  CheckCircle2, 
  Sun, 
  Sparkles, 
  ArrowRight,
  Check,
  AlertTriangle,
  RefreshCw,
  Loader2
} from "lucide-react";

export type TransitionVariant = "calibrating" | "building" | "protocol" | "one-day" | "ready";
export type TransitionStatus = "syncing" | "success" | "error";

export interface OnboardingTransitionProps {
  variant?: TransitionVariant;
  status?: TransitionStatus;
  progress?: number;
  errorMessage?: string | null;
  onComplete?: () => void;
  onRetry?: () => void;
  userName?: string;
  persistent?: boolean;
  buttonText?: string;
  onAction?: () => void;
  timeoutMs?: number;
}

export function OnboardingTransition({
  variant = "calibrating",
  status = "syncing",
  progress: externalProgress,
  errorMessage,
  onComplete,
  onRetry,
  userName = "Champion",
  persistent = false,
  buttonText,
  onAction,
  timeoutMs = 15000,
}: OnboardingTransitionProps) {
  const [internalProgress, setInternalProgress] = useState(0);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);
  const [completedFired, setCompletedFired] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const currentStatus: TransitionStatus = errorMessage || timeoutError ? "error" : status;
  const displayError = errorMessage || timeoutError;

  // Active progress percentage
  const effectiveProgress = externalProgress !== undefined 
    ? externalProgress 
    : internalProgress;

  // Real state & animation synchronization
  useEffect(() => {
    // 1. If in ERROR state, freeze progress
    if (currentStatus === "error") {
      return;
    }

    // 2. If in SUCCESS state, advance to 100% and trigger onComplete
    if (currentStatus === "success") {
      const interval = setInterval(() => {
        setInternalProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return Math.min(100, prev + 8);
        });
      }, 30);

      return () => clearInterval(interval);
    }

    // 3. If in SYNCING state with persistent=false (standalone / auto mode)
    if (!persistent && status === "syncing") {
      const startTime = Date.now();
      const duration = 2400; // 2.4s

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const current = Math.min(90, Math.round((elapsed / duration) * 90));
        setInternalProgress(current);
      }, 30);

      return () => clearInterval(interval);
    }

    // 4. If in SYNCING state with persistent=true
    if (persistent && status === "syncing") {
      // Progress smoothly towards 90% during active sync
      const interval = setInterval(() => {
        setInternalProgress((prev) => (prev >= 90 ? 90 : prev + 3));
      }, 100);

      // Failsafe safety timeout against hung network requests (e.g. 15s)
      const timeoutId = setTimeout(() => {
        console.warn(`[SYNC] Operation timed out after ${timeoutMs}ms without confirmation.`);
        setTimeoutError("Synchronization timed out. Please tap below to retry.");
      }, timeoutMs);

      return () => {
        clearInterval(interval);
        clearTimeout(timeoutId);
      };
    }
  }, [currentStatus, status, persistent, timeoutMs]);

  // Handle firing onComplete when progress hits 100% in success state
  useEffect(() => {
    if (currentStatus === "success" && effectiveProgress >= 100 && !completedFired) {
      setCompletedFired(true);
      const timer = setTimeout(() => {
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStatus, effectiveProgress, completedFired]);

  // Fallback / retry action handler
  const handleAction = () => {
    if (currentStatus === "error") {
      setTimeoutError(null);
      if (onRetry) {
        onRetry();
      } else if (onAction) {
        onAction();
      }
    } else if (currentStatus === "success") {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    } else {
      if (onAction) {
        onAction();
      }
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
              <Cpu size={28} className={currentStatus === "syncing" ? "animate-pulse" : ""} />
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
                <span>{effectiveProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden p-[1px]">
                <motion.div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${effectiveProgress}%` }}
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

            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-6">
              <motion.div 
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${effectiveProgress}%` }}
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
                  <div className="text-[10px] text-slate-400">
                    {currentStatus === "error" ? "Synchronization paused" : "Optimizing sanctuary..."}
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-purple-400">{effectiveProgress}%</span>
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

        {/* ERROR STATE BANNER */}
        {currentStatus === "error" && (
          <div className="w-full bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 mb-6 text-left flex items-start gap-3">
            <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200">
              <span className="font-bold block text-rose-300 mb-0.5">Sync Interrupted</span>
              {displayError || "Unable to confirm state. Tap below to retry."}
            </div>
          </div>
        )}

        {/* Action / Retry / Enter Button */}
        {currentStatus === "error" ? (
          <button
            onClick={handleAction}
            className="w-full py-4 bg-rose-500 text-white font-extrabold rounded-2xl hover:bg-rose-600 transition-all shadow-[0_4px_30px_rgba(244,63,94,0.3)] active:scale-95 cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            <span>{buttonText || "Retry Sync"}</span>
          </button>
        ) : currentStatus === "success" ? (
          <button
            onClick={handleAction}
            className="w-full py-4 bg-white text-black font-extrabold rounded-2xl hover:bg-slate-200 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.2)] active:scale-95 cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <span>{buttonText || "Enter Dashboard"}</span>
            <ArrowRight size={16} />
          </button>
        ) : persistent ? (
          <button
            onClick={handleAction}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold rounded-2xl transition-all active:scale-95 cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Loader2 size={15} className="animate-spin text-slate-400" />
            <span>{buttonText || "Synchronizing..."}</span>
          </button>
        ) : (
          <button
            onClick={handleAction}
            className="w-full py-4 bg-white text-black font-extrabold rounded-2xl hover:bg-slate-200 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.2)] active:scale-95 cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <span>{buttonText || "Enter Dashboard"}</span>
            <ArrowRight size={16} />
          </button>
        )}
      </motion.div>
    </div>
  );
}
