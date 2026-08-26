import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { MotivationalQuote } from "../MotivationalQuote";
import { HabitList } from "../HabitList";
import { Target, Zap, Activity, ArrowRight, Trophy, Plus, Shield, CheckCircle2 } from "lucide-react";
import { AICoachIcon } from "../AICoachIcon";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { isHabitScheduledForToday } from "../../lib/habitUtils";
import { getPersonalizedGreeting } from "../../utils/greetingUtils";
import { getEquippedTitle } from "../../utils/titleUtils";
import { calculateLevelProgress, calculateStreak } from "../../utils";
import { perfLogger } from "../../utils/perfLogger";

export function DashboardScreen() {
  const { user, habits, deactivateFreeze, setActiveTab } = useStore();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [unfreezing, setUnfreezing] = useState(false);

  const [prevXp, setPrevXp] = useState<number>(user?.xp ?? 0);
  const [prevLevel, setPrevLevel] = useState<number>(user?.level ?? 1);
  const [xpPop, setXpPop] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    const elapsed = Math.round(performance.now());
    console.log(`[PERF] dashboard-ready: ${elapsed}ms`);
    perfLogger.mark("dashboardReady", elapsed);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.xp !== prevXp) {
      setXpPop(true);
      const timer = setTimeout(() => setXpPop(false), 900);
      setPrevXp(user.xp);
    }
    if (user.level > prevLevel) {
      setShowLevelUp(true);
      setPrevLevel(user.level);
    } else if (user.level < prevLevel) {
      setPrevLevel(user.level);
    }
  }, [user?.xp, user?.level, prevXp, prevLevel]);

  useEffect(() => {
    if (!confirmDeactivate) return;
    const timer = setTimeout(() => setConfirmDeactivate(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmDeactivate]);

  if (!user) return null;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const safeHabits = Array.isArray(habits) ? habits : [];
  const todaysHabits = safeHabits.filter(isHabitScheduledForToday);
  const completedToday = todaysHabits.filter(h => h && h.completedToday).length; 
  const totalHabits = todaysHabits.length;
  const completionPercentage = totalHabits === 0 ? 0 : Math.round((completedToday / totalHabits) * 100);

  const currentXP = typeof user.xp === "number" && !isNaN(user.xp) ? Math.max(0, user.xp) : 0;
  const currentLevel = typeof user.level === "number" && !isNaN(user.level) && user.level >= 1 ? Math.floor(user.level) : 1;
  const xpRequiredForNextLevel = 100;
  const progressPercentage = calculateLevelProgress(currentXP, currentLevel, xpRequiredForNextLevel);

  const isFrozen = user.freeze_until && new Date(user.freeze_until) > new Date();
  const freezeUntilDateStr = isFrozen && user.freeze_until
    ? new Date(user.freeze_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : "";

  const equippedTitle = getEquippedTitle(user);
  const activeStreak = typeof user.currentStreak === "number" && !isNaN(user.currentStreak)
    ? user.currentStreak
    : (typeof user.streak === "number" && !isNaN(user.streak) ? user.streak : 0);

  const greeting = getPersonalizedGreeting({
    user, habits, completedTodayCount: completedToday, totalHabitsCount: totalHabits, isFrozen: Boolean(isFrozen),
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 overflow-x-hidden min-h-0 relative">
      
      {/* Subtle Radial Glows for Depth */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* STREAK SHIELD */}
      {isFrozen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-[#0c0c11]/90 border border-cyan-500/30 rounded-2xl sm:rounded-3xl p-5 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-lg shrink-0">
              ❄️
            </div>
            <div className="text-left">
              <h2 className="text-xs font-mono font-bold tracking-wider text-white flex items-center gap-2 uppercase">
                STREAK SHIELD ACTIVE <span className="text-[9px] font-mono uppercase text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded tracking-widest">Protected</span>
              </h2>
              <p className="text-zinc-400 text-xs mt-0.5">
                Your progress is protected until <strong className="text-zinc-200">{freezeUntilDateStr}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!confirmDeactivate) {
                setConfirmDeactivate(true);
                return;
              }
              try {
                setUnfreezing(true);
                await deactivateFreeze();
                toast.success("Streak Shield deactivated!");
                setConfirmDeactivate(false);
              } catch (e) {
                toast.error("Failed to deactivate streak shield.");
              } finally {
                setUnfreezing(false);
              }
            }}
            disabled={unfreezing}
            className={`text-[10px] font-mono font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl border transition-all duration-300 transform active:scale-95 cursor-pointer whitespace-nowrap z-10 ${
              confirmDeactivate
                ? "bg-red-500/20 text-red-300 border-red-500/40"
                : "bg-white/[0.04] text-zinc-300 border-white/[0.1] hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            {unfreezing ? "Deactivating..." : confirmDeactivate ? "Confirm Unfreeze?" : "Deactivate Freeze"}
          </button>
        </motion.div>
      )}

      {/* HEADER ROW */}
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
        <div>
          <motion.h1 
            key={greeting}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tighter text-white"
          >
            {greeting}
          </motion.h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-slate-500 text-[11px] tracking-widest uppercase font-bold">
              {today}
            </p>
            {equippedTitle && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  <Shield size={10} />
                  {equippedTitle}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MOTIVATIONAL QUOTE */}
      <div className="w-full">
        <MotivationalQuote />
      </div>

      {/* BENTO GRID: STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 w-full relative z-10">
        
        {/* Card 1: Today's Progress */}
        <motion.div 
          whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.18)" }}
          className="bg-[#0c0c11]/85 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between select-none relative overflow-hidden transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)] min-h-[160px]"
        >
          {/* Top Row: Icon + Pill */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <CheckCircle2 size={18} className="text-zinc-300 stroke-[2]" />
            </div>
            <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-md">
              Today
            </span>
          </div>

          {/* Bottom Content: Number + Subtitle + Thin Progress Bar */}
          <div className="relative z-10 space-y-2.5">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                {completionPercentage}%
              </div>
              <div className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider mt-1">
                {completedToday} of {totalHabits} Completed
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-200 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Card 2: Streak */}
        <motion.div 
          whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.18)" }}
          className="bg-[#0c0c11]/85 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between select-none relative overflow-hidden transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)] min-h-[160px]"
        >
          {/* Top Row: Icon + Pill */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              {isFrozen ? (
                <Target size={18} className="text-cyan-300 stroke-[2]" />
              ) : (
                <Zap size={18} className="text-zinc-300 stroke-[2]" />
              )}
            </div>
            <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-md">
              {isFrozen ? "Protected" : "Consistency"}
            </span>
          </div>

          {/* Bottom Content: Number + Subtitle + Thin Progress Bar */}
          <div className="relative z-10 space-y-2.5">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                {activeStreak} <span className="text-base sm:text-lg text-zinc-400 font-bold uppercase tracking-wider font-mono">{activeStreak === 1 ? 'Day' : 'Days'}</span>
              </div>
              <div className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider mt-1">
                {isFrozen ? "Streak Shield Active" : "Current Momentum"}
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-200 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(activeStreak > 0 ? 8 : 0, (activeStreak / 30) * 100))}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Card 3: Level & XP */}
        <motion.div 
          whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.18)" }}
          animate={xpPop ? { scale: [1, 1.015, 1], borderColor: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.3)", "rgba(255,255,255,0.08)"] } : {}}
          transition={{ duration: 0.4 }}
          className="bg-[#0c0c11]/85 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between select-none relative overflow-hidden transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)] min-h-[160px]"
        >
          {/* Top Row: Icon + Pill */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Trophy size={18} className="text-zinc-300 stroke-[2]" />
            </div>
            <div className="flex items-center gap-1.5">
              {xpPop && (
                <motion.span
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-mono font-bold text-zinc-200 bg-white/10 px-1.5 py-0.5 rounded"
                >
                  +{currentXP - prevXp} XP
                </motion.span>
              )}
              <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-md">
                Rank
              </span>
            </div>
          </div>

          {/* Bottom Content: Number & Subtitle + Circular Indicator */}
          <div className="relative z-10 space-y-2.5">
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                  Lvl {currentLevel}
                </div>
                <div className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider mt-1">
                  {currentXP} XP Total
                </div>
              </div>
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 mb-0.5">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" className="stroke-white/[0.08]" strokeWidth="2.5" fill="none" />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    className="stroke-zinc-200"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="113.1"
                    strokeDashoffset={113.1 - (113.1 * Math.min(100, Math.max(0, progressPercentage))) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[9px] font-mono font-bold text-zinc-300">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-200 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
              />
            </div>
          </div>
        </motion.div>

      </div>

      {/* BENTO GRID: CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative z-10">
        
        {/* MAIN COLUMN: Habits List */}
        <div className="md:col-span-2 space-y-6">
          <motion.div 
            whileHover={{ borderColor: "rgba(255,255,255,0.15)" }}
            className="bg-[#0c0c11]/85 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-7 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-200">Today's Protocol</h2>
              {totalHabits > 0 && (
                <span className="text-[10px] font-mono uppercase font-medium tracking-wider text-zinc-300 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.06]">
                  {completedToday}/{totalHabits} Done
                </span>
              )}
            </div>
            
            {totalHabits > 0 ? (
              <HabitList previewMode />
            ) : (
              <div className="py-12 text-center bg-white/[0.01] rounded-2xl border border-white/5 border-dashed flex flex-col items-center justify-center px-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Activity size={24} className="text-slate-500" />
                </div>
                <p className="text-slate-300 font-black uppercase tracking-[0.15em] text-xs mb-2">
                  No Active Habits
                </p>
                <p className="text-slate-500 text-[11px] max-w-xs mx-auto leading-relaxed mb-6 font-medium">
                  Establish your first tracking protocol to activate your daily discipline feed.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveTab("habits")}
                  className="py-3 px-6 bg-white text-black font-black uppercase tracking-wider text-[10px] rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus size={14} strokeWidth={3} />
                  Create Habit
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>

        {/* SIDE COLUMN: AI Coach & Activity */}
        <div className="space-y-6">
          
          {/* AI Coach Card */}
          <motion.div
            whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.18)" }}
            onClick={() => setActiveTab("coach")}
            className="group w-full bg-[#0c0c11]/85 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-6 cursor-pointer select-none transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)] relative overflow-hidden"
          >
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <AICoachIcon size={20} active />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-colors">
                  <ArrowRight size={14} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">AI Coach</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Personalized strategy, discipline checks & performance protocols.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            whileHover={{ borderColor: "rgba(255,255,255,0.15)" }}
            className="w-full bg-[#0c0c11]/85 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity size={15} className="text-zinc-400" />
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">Recent Activity</h3>
            </div>
            
            {safeHabits.length > 0 ? (
              <div className="space-y-2.5">
                {safeHabits.slice(0, 4).map(h => (
                  <div key={h.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/[0.04] transition-colors">
                    <span className="font-medium text-zinc-200 text-xs truncate max-w-[140px] sm:max-w-[160px]">{h.name}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wider shrink-0 border ${h.completedToday ? 'bg-white/[0.06] text-zinc-200 border-white/[0.1]' : 'bg-white/[0.02] text-zinc-400 border-white/[0.05]'}`}>
                      {h.completedToday ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full py-6 text-center bg-white/[0.01] rounded-xl border border-white/5 border-dashed">
                <p className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest">
                  No Activity Yet
                </p>
              </div>
            )}
          </motion.div>

        </div>
      </div>

      {/* Level Up Premium Celebration Overlay */}
      <AnimatePresence>
        {showLevelUp && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setShowLevelUp(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#0c0c0c] border border-amber-500/35 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-6 z-10 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <Trophy size={32} strokeWidth={2.5} />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase">PROTOCOL UPGRADE</div>
                <h3 className="text-2xl font-black tracking-tighter text-white uppercase">Level {user.level} Unlocked</h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-[240px] mx-auto">
                  Your commitment is registering at elite level. Keep backing up your claims with daily execution.
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Upgrade Bonus</span>
                <span className="text-xs font-black text-amber-400">+100 Max Capacity</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowLevelUp(false)}
                className="w-full bg-white hover:bg-slate-200 text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl h-12 transition-all cursor-pointer shadow-lg"
              >
                Accept Progression
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DashboardScreen;
