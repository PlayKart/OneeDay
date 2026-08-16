// src/components/TitleUnlockModal.tsx

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check, Shield, Sparkles } from "lucide-react";
import { MonolithLogo } from "./MonolithLogo";
import { useStore } from "../store/useStore";
import { markTitleAsSeen, playTitleUnlockSound } from "../utils/titleUtils";

export function TitleUnlockModal() {
  const { titleUnlockData, setTitleUnlockData, equipTitle, user, levelUpData } = useStore();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isEquipped, setIsEquipped] = useState(false);

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

  // Haptic feedback and optional sound on title reveal
  useEffect(() => {
    if (!titleUnlockData || levelUpData) {
      setIsEquipped(false);
      return;
    }

    // Play sound and trigger haptic
    playTitleUnlockSound();
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate(35);
      } catch {
        // Safe ignore
      }
    }
  }, [titleUnlockData, levelUpData]);

  // Queue sequencing: wait until Level Up modal is dismissed
  if (!titleUnlockData || levelUpData) return null;

  const currentUserId = user?.id || user?.userId;
  const rawTitle = titleUnlockData.title;
  const uppercaseTitle = rawTitle.toUpperCase().trim();
  const signature = titleUnlockData.signature || "Consistency is becoming your standard.";
  const level = titleUnlockData.level || user?.level || 1;

  const handleDismiss = () => {
    markTitleAsSeen(rawTitle, currentUserId);
    setTitleUnlockData(null);
  };

  const handleEquip = async () => {
    setIsEquipped(true);
    markTitleAsSeen(rawTitle, currentUserId);
    await equipTitle(rawTitle);
    setTimeout(() => {
      setTitleUnlockData(null);
    }, 600);
  };

  if (prefersReducedMotion) {
    return (
      <div
        id="title-unlock-modal"
        className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label={`Title Unlocked: ${uppercaseTitle}`}
      >
        <div className="w-full max-w-sm bg-[#0a0a0a] border border-amber-500/30 rounded-3xl p-8 text-center flex flex-col items-center shadow-2xl">
          <MonolithLogo size={56} className="mb-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-3">
            TITLE UNLOCKED
          </span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
            {uppercaseTitle}
          </h2>
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
            <p className="text-amber-200/90 text-xs font-medium leading-relaxed">
              "{signature}"
            </p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-6">
            Level {level} Milestone
          </span>

          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={handleEquip}
              disabled={isEquipped}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs uppercase tracking-wider active:scale-95"
            >
              {isEquipped ? (
                <>
                  <Check size={14} />
                  Equipped
                </>
              ) : (
                "Equip Title"
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs uppercase tracking-wider"
            >
              Continue
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        id="title-unlock-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="fixed inset-0 z-[260] flex items-center justify-center p-4 sm:p-6 bg-black/92 backdrop-blur-2xl overflow-hidden select-none"
        role="dialog"
        aria-modal="true"
        aria-label={`Title Unlocked: ${uppercaseTitle}`}
      >
        {/* Ambient Dark Gold Radial Glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.22 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            className="w-[420px] h-[420px] bg-amber-500 rounded-full blur-[110px]"
          />
        </div>

        {/* Expanding Subtle Ring */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 1.8, delay: 0.3, ease: "easeOut" }}
            className="w-48 h-48 rounded-full border border-amber-400/40"
          />
        </div>

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.88, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.94, y: 12, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320, delay: 0.15 }}
          className="relative w-full max-w-sm bg-[#0a0a0a]/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center shadow-[0_20px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(245,158,11,0.15)] overflow-hidden"
        >
          {/* Subtle Ambient Top Border Highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

          {/* Monolith Logo Reveal */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 350, delay: 0.25 }}
            className="relative mb-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.25)]">
              <MonolithLogo size={42} />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="absolute -top-1 -right-1 text-amber-400"
            >
              <Sparkles size={14} />
            </motion.div>
          </motion.div>

          {/* Badge: TITLE UNLOCKED */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.45 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full mb-3"
          >
            <Shield size={10} className="text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
              Title Unlocked
            </span>
          </motion.div>

          {/* Title Header with Light Sweep */}
          <div className="relative overflow-hidden w-full py-1 mb-2">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.55 }}
              className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase"
            >
              {uppercaseTitle}
            </motion.h2>

            {/* Light Sweep Across Title */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.4, delay: 0.85, ease: "easeInOut" }}
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none skew-x-12"
            />
          </div>

          {/* Signature / Description Box */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.75 }}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 my-3 text-center"
          >
            <p className="text-amber-200/90 text-xs sm:text-[13px] font-medium leading-relaxed">
              "{signature}"
            </p>
          </motion.div>

          {/* Level / Milestone context */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.95 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Milestone Recognition
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400/90">
              Level {level}
            </span>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 1.1 }}
            className="w-full flex flex-col gap-2.5"
          >
            <button
              id="equip-title-btn"
              onClick={handleEquip}
              disabled={isEquipped}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_25px_rgba(245,158,11,0.35)] active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
            >
              {isEquipped ? (
                <>
                  <Check size={14} className="stroke-[3]" />
                  Equipped as Identity Badge
                </>
              ) : (
                "Equip Title"
              )}
            </button>

            <button
              id="continue-title-btn"
              onClick={handleDismiss}
              className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
            >
              Continue
              <ArrowRight size={13} />
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
