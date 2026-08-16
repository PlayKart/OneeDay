import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  LayoutDashboard, 
  Flame, 
  Zap, 
  Settings, 
  CheckCircle2, 
  Shield, 
  ArrowRight, 
  X,
  Target,
  Award,
  Clock,
  UserCheck
} from 'lucide-react';
import { MonolithLogo } from './MonolithLogo';
import { AICoachIcon, AICoachAvatar } from './AICoachIcon';

interface AppIntroFlowProps {
  userId: string;
  userName?: string;
  onComplete: () => void;
}

export function AppIntroFlow({ userId, userName, onComplete }: AppIntroFlowProps) {
  useEffect(() => {
    console.log("[INTRO] started");
  }, []);

  // Step 0: Welcome Screen
  // Step 1: Dashboard
  // Step 2: Habits
  // Step 3: AI Coach
  // Step 4: Settings
  const [step, setStep] = useState<number>(() => {
    const savedStep = localStorage.getItem(`oneday_intro_step_${userId}`);
    if (savedStep !== null) {
      const parsed = parseInt(savedStep, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 4) {
        return parsed;
      }
    }
    return 0;
  });

  // Save current step to localStorage for session persistence across refresh
  useEffect(() => {
    localStorage.setItem(`oneday_intro_step_${userId}`, step.toString());
  }, [step, userId]);

  const handleNext = () => {
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    console.log("[INTRO] skipped");
    localStorage.setItem(`oneday_intro_seen_${userId}`, 'true');
    localStorage.removeItem(`oneday_intro_step_${userId}`);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col justify-between overflow-y-auto font-sans select-none">
      {/* Background Orbs */}
      <div className="fixed top-[-150px] left-[-150px] w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-150px] right-[-150px] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MonolithLogo size={28} />
          <span className="font-bold tracking-tight text-lg text-white">OneDay</span>
        </div>

        {/* Skip button (available on all steps) */}
        <button
          onClick={handleFinish}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <span>Skip Intro</span>
          <X size={14} />
        </button>
      </header>

      {/* Main Content Stage */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-4 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* ──────────────── STEP 0: WELCOME SCREEN ──────────────── */}
          {step === 0 && (
            <motion.div
              key="step-0-welcome"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center max-w-2xl mx-auto py-8"
            >
              {/* Emblem / Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="mb-8 relative"
              >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center justify-center shadow-2xl shadow-amber-500/10">
                  <MonolithLogo size={52} />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#FBBC05] text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-lg">
                  Calibrated
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight"
              >
                You Are Ready, <span className="text-[#FBBC05]">{userName || "Champion"}</span>.
              </motion.h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-base md:text-lg text-slate-400 font-medium leading-relaxed mb-10 max-w-xl"
              >
                Your discipline profile is calibrated.<br className="hidden sm:inline" />
                Welcome to the ultimate sanctuary for relentless growth.
              </motion.p>

              {/* Action Button */}
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                onClick={handleNext}
                className="group relative inline-flex items-center gap-3 bg-[#FBBC05] hover:bg-yellow-400 text-black font-extrabold text-sm uppercase tracking-widest px-10 py-4 rounded-xl transition-all shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          )}

          {/* ──────────────── STEP 1: DASHBOARD ──────────────── */}
          {step === 1 && (
            <motion.div
              key="step-1-dashboard"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-6"
            >
              {/* Step indicator */}
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-[#FBBC05]">
                <LayoutDashboard size={14} />
                <span>01 / 04 — Command Center</span>
              </div>

              {/* Header text */}
              <div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
                  Your command center.
                </h2>
                <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
                  See your progress, streaks, XP, level, daily quote and today's priorities at a glance.
                </p>
              </div>

              {/* Visual Preview Highlight */}
              <div className="p-5 md:p-6 rounded-2xl bg-white/[0.02] border border-white/10 shadow-2xl space-y-4 relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Stat Bar Preview */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 md:p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Level & Rank</span>
                    <span className="text-sm md:text-base font-black text-white flex items-center gap-1.5">
                      <Zap size={14} className="text-[#FBBC05]" /> LVL 1 Novice
                    </span>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-[#FBBC05] h-full w-[25%]" />
                    </div>
                  </div>

                  <div className="p-3 md:p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Streak</span>
                    <span className="text-sm md:text-base font-black text-amber-400 flex items-center gap-1.5">
                      <Flame size={14} /> 1 Day Active
                    </span>
                    <span className="text-[10px] text-slate-400">Streak Active</span>
                  </div>

                  <div className="p-3 md:p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Freeze Shield</span>
                    <span className="text-sm md:text-base font-black text-blue-400 flex items-center gap-1.5">
                      <Shield size={14} /> Ready
                    </span>
                    <span className="text-[10px] text-slate-400">1 Free Freeze Available</span>
                  </div>
                </div>

                {/* Daily Quote Card Preview */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
                  <Sparkles size={18} className="text-[#FBBC05] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs md:text-sm font-medium italic text-slate-200">
                      "Discipline is choosing between what you want now and what you want most."
                    </p>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-1 block">
                      Daily Discipline Focus
                    </span>
                  </div>
                </div>

                {/* Today's Priorities Preview */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Today's Priorities</span>
                    <span className="text-[#FBBC05]">2 Remaining</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 text-xs text-slate-300 p-2 rounded-lg bg-white/[0.02]">
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <span className="line-through text-slate-500">Morning Hydration & Protocol</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-300 p-2 rounded-lg bg-white/[0.02]">
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                      <span>45-Min Deep Focus Work</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ──────────────── STEP 2: HABITS ──────────────── */}
          {step === 2 && (
            <motion.div
              key="step-2-habits"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-6"
            >
              {/* Step indicator */}
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-[#FBBC05]">
                <Target size={14} />
                <span>02 / 04 — Habit System</span>
              </div>

              {/* Header text */}
              <div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
                  Build the habits that build you.
                </h2>
                <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
                  Create habits, choose their difficulty, complete them and build your streak one day at a time.
                </p>
              </div>

              {/* XP Difficulty Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">Easy</span>
                  <span className="text-base font-black text-white">+20 XP</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-0.5">Medium</span>
                  <span className="text-base font-black text-white">+40 XP</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-0.5">Hard</span>
                  <span className="text-base font-black text-white">+60 XP</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">Elite</span>
                  <span className="text-base font-black text-white">+80 XP</span>
                </div>
              </div>

              {/* Visual Preview Highlight Card */}
              <div className="p-5 md:p-6 rounded-2xl bg-white/[0.02] border border-white/10 shadow-2xl space-y-3 relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Habit Routine Sample</span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Flame size={12} /> Daily Routine
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Daily Workout & Mobility</div>
                        <div className="text-[10px] text-slate-500">Everyday • 07:00 AM</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-md">
                      +60 XP
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                        <Clock size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-300">Read 20 Pages</div>
                        <div className="text-[10px] text-slate-500">Weekdays • Evening</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-md">
                      +40 XP
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ──────────────── STEP 3: AI COACH ──────────────── */}
          {step === 3 && (
            <motion.div
              key="step-3-coach"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-6"
            >
              {/* Step indicator */}
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-white">
                <AICoachIcon size={14} active />
                <span>03 / 04 — Personal AI Coach</span>
              </div>

              {/* Header text */}
              <div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
                  Your personal AI Coach.
                </h2>
                <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
                  Talk to your coach about your habits, progress, goals and journey. Your coach uses your OneDay profile and habit history to make conversations personal.
                </p>
              </div>

              {/* Visual Preview Highlight */}
              <div className="p-5 md:p-6 rounded-2xl bg-white/[0.02] border border-white/10 shadow-2xl space-y-4 relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <AICoachAvatar size={32} active />
                  <div>
                    <div className="text-xs font-bold text-white">OneDay AI Coach</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Context-Aware & Active
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* User Query */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-white/10 text-white text-xs md:text-sm p-3 rounded-2xl rounded-tr-xs border border-white/10">
                      How do I stay consistent with my physical training on busy days?
                    </div>
                  </div>

                  {/* Coach Response */}
                  <div className="flex justify-start items-start gap-2.5">
                    <AICoachAvatar size={24} active className="mt-1" />
                    <div className="max-w-[85%] bg-white/[0.03] text-slate-300 text-xs md:text-sm p-3.5 rounded-2xl rounded-tl-xs border border-white/10 leading-relaxed space-y-2">
                      <p>
                        "Looking at your profile, you excel when routines are structured. On heavy days, switch to a <strong className="text-white">15-minute minimum protocol</strong> instead of skipping entirely."
                      </p>
                      <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 pt-1 border-t border-white/5">
                        <Sparkles size={10} /> Calibrated to your goals
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ──────────────── STEP 4: SETTINGS ──────────────── */}
          {step === 4 && (
            <motion.div
              key="step-4-settings"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-6"
            >
              {/* Step indicator */}
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-[#FBBC05]">
                <Settings size={14} />
                <span>04 / 04 — Personal Control</span>
              </div>

              {/* Header text */}
              <div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
                  Your OneDay, your rules.
                </h2>
                <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
                  Manage your profile, preferences, privacy, terms and account settings from one place.
                </p>
              </div>

              {/* Visual Preview Highlight */}
              <div className="p-5 md:p-6 rounded-2xl bg-white/[0.02] border border-white/10 shadow-2xl space-y-3 relative overflow-hidden backdrop-blur-md">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Profile & Discipline Preferences</div>
                      <div className="text-[10px] text-slate-400">Update goals, hobbies, and sports profile</div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Calibrated</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                      <Shield size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Privacy & Legal Disclosures</div>
                      <div className="text-[10px] text-slate-400">Updated terms & minimum age policy</div>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">10+ Verified</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Toolbar */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-6 py-6 flex items-center justify-between border-t border-white/5">
        {/* Left: Back button or step dots */}
        <div>
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <div className="text-xs text-slate-600 font-mono font-bold">
              WELCOME PROTOCOL
            </div>
          )}
        </div>

        {/* Center: Step indicators */}
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-6 bg-[#FBBC05]'
                  : s < step
                  ? 'w-1.5 bg-white/40'
                  : 'w-1.5 bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Right: Next / Start OneDay button */}
        <div>
          {step === 0 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-[#FBBC05] hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-md shadow-yellow-500/10 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          ) : step < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-[#FBBC05] hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-md shadow-yellow-500/10 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 bg-[#FBBC05] hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-yellow-500/20 cursor-pointer"
            >
              <span>Start OneDay</span>
              <Sparkles size={16} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
