import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { MonolithLogo } from "./MonolithLogo";
import { useStore } from "../store/useStore";

interface LevelUpAnimationProps {
  level: number;
  xp: number;
  progress: number;
  previousLevel?: number;
  onClose: () => void;
}

// Sophisticated, confident OneDay level subtitles
const LEVEL_SUBTITLES: Record<number, string> = {
  2: "Discipline is compounding.",
  3: "Consistency creates certainty.",
  4: "Standards define identity.",
  5: "Mastery through repetition.",
  6: "Unwavering commitment.",
  7: "The habit becomes second nature.",
  8: "Relentless execution.",
  9: "Quietly undeniable.",
  10: "Apex standard achieved.",
};

// 20 subtle deterministic micro particles
const PARTICLES = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * 2 * Math.PI + (i % 3) * 0.2;
  const distance = 80 + (i % 5) * 24;
  const size = (i % 3 === 0) ? 3 : 2;
  const duration = 1.6 + (i % 4) * 0.3;
  const delay = 0.4 + (i % 5) * 0.1;
  return {
    id: i,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    size,
    duration,
    delay,
    opacity: 0.4 + (i % 3) * 0.25,
  };
});

export function LevelUpAnimation({
  level,
  xp,
  progress,
  previousLevel = level - 1,
  onClose,
}: LevelUpAnimationProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [stage, setStage] = useState<"initial" | "revealed" | "complete">("initial");

  const levelJump = Math.max(1, level - (previousLevel || level - 1));
  const subtitle = LEVEL_SUBTITLES[level] || "You are building momentum.";

  // Safe XP progress bounded between 0 and 100
  const safeProgress = typeof progress === "number" && !isNaN(progress) 
    ? Math.min(100, Math.max(0, progress)) 
    : 0;

  // Reduced motion detection
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Single subtle haptic feedback when level is revealed
  useEffect(() => {
    const timer = setTimeout(() => {
      setStage("revealed");
      if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
        try {
          navigator.vibrate(35);
        } catch {
          // Ignore unsupported devices
        }
      }
    }, 750);

    return () => clearTimeout(timer);
  }, []);

  // Subtle intensity progression based on level tier
  const isHighLevel = level >= 7;
  const isMidLevel = level >= 4 && level < 7;

  if (prefersReducedMotion) {
    return (
      <div 
        id="level-up-modal" 
        className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label={`Level ${level} Unlocked`}
      >
        <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/15 rounded-3xl p-8 text-center flex flex-col items-center">
          <MonolithLogo size={64} className="mb-6" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-2">
            LEVEL UP
          </span>
          <h2 className="text-4xl font-black text-white tracking-tight mb-2">
            LEVEL {level}
          </h2>
          {levelJump > 1 && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full mb-3">
              +{levelJump} Levels
            </span>
          )}
          <p className="text-xs text-slate-400 font-medium mb-6">
            {subtitle}
          </p>

          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left">
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-slate-400 uppercase tracking-widest text-[9px]">Authoritative XP</span>
              <span className="text-white">{xp} XP</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full" 
                style={{ width: `${safeProgress}%` }}
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-white text-black font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer"
          >
            Continue
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        id="level-up-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-hidden select-none"
        role="dialog"
        aria-modal="true"
        aria-label={`Level ${level} Unlocked`}
      >
        {/* Subtle background glow tuned to level intensity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: isHighLevel ? 0.35 : isMidLevel ? 0.25 : 0.18, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={`absolute w-96 h-96 rounded-full blur-3xl pointer-events-none ${
            isHighLevel 
              ? "bg-gradient-to-tr from-amber-500/40 via-amber-400/20 to-transparent" 
              : "bg-gradient-to-tr from-amber-500/30 via-white/10 to-transparent"
          }`}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-sm bg-[#09090b]/95 border border-white/10 rounded-3xl p-7 text-center flex flex-col items-center shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Top highlight shine */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Micro floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  opacity: [0, p.opacity, 0],
                  scale: [0, 1, 0.4],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "easeOut",
                }}
                className="absolute left-1/2 top-28 rounded-full bg-amber-300"
                style={{
                  width: p.size,
                  height: p.size,
                  boxShadow: "0 0 6px rgba(251, 191, 36, 0.6)",
                }}
              />
            ))}
          </div>

          {/* Monolith & Expanding Energy Ring */}
          <div className="relative mb-6 mt-2 flex items-center justify-center">
            {/* Expanding energy ring 1 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.9], opacity: [0.8, 0] }}
              transition={{ duration: 1.3, delay: 0.45, ease: "easeOut" }}
              className="absolute w-20 h-20 rounded-full border border-amber-400/50 pointer-events-none"
            />
            {/* Expanding energy ring 2 (subtle secondary echo) */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 2.4], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, delay: 0.65, ease: "easeOut" }}
              className="absolute w-20 h-20 rounded-full border border-white/30 pointer-events-none"
            />

            {/* Central Monolith Logo with scale and glow */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 260,
                delay: 0.2,
              }}
              className="relative z-10"
            >
              <div className="relative">
                <MonolithLogo size={68} />
                {/* Soft monolith pulse glow */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0.2] }}
                  transition={{ duration: 1.4, delay: 0.3 }}
                  className="absolute inset-0 rounded-[16px] bg-amber-400/20 blur-lg -z-10"
                />
              </div>
            </motion.div>
          </div>

          {/* Eyebrow Label */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.65 }}
            className="flex items-center gap-1.5 mb-1.5"
          >
            <Sparkles size={12} className="text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/90">
              LEVEL UP
            </span>
          </motion.div>

          {/* Big Bold Level Reveal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              damping: 18,
              stiffness: 280,
              delay: 0.85,
            }}
            className="flex flex-col items-center mb-2"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              LEVEL {level}
            </h2>
          </motion.div>

          {/* Multi-level jump badge if jumped >1 level */}
          {levelJump > 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0, type: "spring", stiffness: 300, damping: 20 }}
              className="mb-2"
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                +{levelJump} Levels Unlocked
              </span>
            </motion.div>
          )}

          {/* Supporting Copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.1 }}
            className="text-xs text-slate-400 font-medium mb-6 max-w-[260px] leading-relaxed"
          >
            {subtitle}
          </motion.p>

          {/* XP & Level Progress Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 1.25 }}
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-6 text-left"
          >
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-slate-400 uppercase tracking-widest text-[9px]">
                Total XP
              </span>
              <span className="text-white font-mono text-xs">
                {xp} <span className="text-slate-500 text-[10px]">XP</span>
              </span>
            </div>

            {/* Dynamic Level Progress Bar */}
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${safeProgress}%` }}
                transition={{ duration: 0.9, delay: 1.45, ease: "easeOut" }}
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full"
              />
            </div>

            <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest text-slate-500">
              <span>{Math.round(safeProgress)}% to Level {level + 1}</span>
              <span>100 XP Target</span>
            </div>
          </motion.div>

          {/* Continue / Dismiss Button */}
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 1.55 }}
            onClick={onClose}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.35)] active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
          >
            Keep Going
            <ArrowRight size={14} />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function LevelUpModal() {
  const { levelUpData, setLevelUpData } = useStore();

  if (!levelUpData) return null;

  return (
    <LevelUpAnimation
      level={levelUpData.currentLevel}
      previousLevel={levelUpData.previousLevel}
      xp={levelUpData.xp}
      progress={levelUpData.progress}
      onClose={() => setLevelUpData(null)}
    />
  );
}
