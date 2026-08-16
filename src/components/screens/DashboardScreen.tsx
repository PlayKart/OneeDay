import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { MotivationalQuote } from "../MotivationalQuote";
import { HabitList } from "../HabitList";
import { Target, Zap, Activity, ArrowRight, Trophy, Plus, Shield, Sparkles } from "lucide-react";
import { AICoachIcon } from "../AICoachIcon";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";

import { isHabitScheduledForToday } from "../../lib/habitUtils";
import { getPersonalizedGreeting } from "../../utils/greetingUtils";
import { getEquippedTitle } from "../../utils/titleUtils";
import { calculateLevelProgress } from "../../utils";

export function DashboardScreen() {
  const { user, habits, deactivateFreeze, refreshFromBackend, setActiveTab } = useStore();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [unfreezing, setUnfreezing] = useState(false);
  const [isStreakSheetOpen, setIsStreakSheetOpen] = useState(false);

  // Premium XP & Level change tracking
  const [prevXp, setPrevXp] = useState<number>(user?.xp ?? 0);
  const [prevLevel, setPrevLevel] = useState<number>(user?.level ?? 1);
  const [xpPop, setXpPop] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

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
    refreshFromBackend();
  }, [refreshFromBackend]);

  useEffect(() => {
    if (!confirmDeactivate) return;
    const timer = setTimeout(() => {
      setConfirmDeactivate(false);
    }, 3000);
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
    ? new Date(user.freeze_until).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : "";

  const equippedTitle = getEquippedTitle(user);
  const greeting = getPersonalizedGreeting({
    user,
    habits,
    completedTodayCount: completedToday,
    totalHabitsCount: totalHabits,
    isFrozen: Boolean(isFrozen),
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-0">
      
      {/* MOBILE LAYOUT (< 768px) */}
      <div className="block md:hidden p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] space-y-4 w-full overflow-x-hidden">
        
        {/* Streak Shield Active Banner */}
        {isFrozen && (
          <div className="relative z-10 bg-cyan-950/25 border border-cyan-500/25 rounded-2xl p-4 overflow-hidden flex flex-col gap-3 w-full shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-lg animate-pulse shrink-0">
                ❄️
              </div>
              <div className="text-left min-w-0">
                <h2 className="text-xs font-extrabold tracking-tight text-white flex items-center gap-1.5 flex-wrap">
                  STREAK SHIELD <span className="text-[8px] font-black uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-full">Active</span>
                </h2>
                <p className="text-slate-400 text-[11px] mt-0.5 truncate">
                  Protected until <strong className="text-cyan-200">{freezeUntilDateStr}</strong>
                </p>
              </div>
            </div>
            <button
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
              className={`w-full py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                confirmDeactivate
                  ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                  : "bg-cyan-500/15 text-cyan-400 border-cyan-500/25"
              }`}
            >
              {unfreezing ? "Deactivating..." : confirmDeactivate ? "Confirm Unfreeze?" : "Deactivate Freeze"}
            </button>
          </div>
        )}

        {/* 1. Greeting & Date */}
        <div className="w-full pt-1">
          <motion.h1 
            key={greeting}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-black tracking-tight text-white"
          >
            {greeting}
          </motion.h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-400 text-[10px] tracking-widest uppercase font-bold">
              {today}
            </p>
            {equippedTitle && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  <Shield size={9} />
                  {equippedTitle}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 2. Daily Quote */}
        <div className="w-full overflow-hidden">
          <MotivationalQuote />
        </div>

        {/* 3. Bento Hero Cards: Streak & Level */}
        <div className="grid grid-cols-2 gap-3.5 w-full">
          {/* Streak Card */}
          <motion.div 
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsStreakSheetOpen(true)}
            className={`liquid-glass-card rounded-2xl p-4 flex flex-col justify-between h-[110px] select-none cursor-pointer transition-all ${
              isFrozen 
                ? "border-cyan-500/30 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]" 
                : "border-orange-500/20 bg-orange-950/10 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
            }`}
          >
            <div className="flex justify-between items-start">
              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isFrozen 
                  ? "text-cyan-300 bg-cyan-500/15 border-cyan-500/30" 
                  : "text-orange-300 bg-orange-500/15 border-orange-500/30"
              }`}>
                {isFrozen ? "Frozen Streak" : "Day Streak"}
              </span>
              <span className="text-base">{isFrozen ? "❄️" : "🔥"}</span>
            </div>
            <div>
              <div className={`text-2xl font-black ${isFrozen ? "text-cyan-200" : "text-white"}`}>
                {user.currentStreak ?? user.streak} <span className="text-xs text-slate-400 font-bold uppercase">Days</span>
              </div>
              <div className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mt-0.5 flex items-center justify-between">
                <span>Active Streak</span>
                <span className="text-purple-400 font-black">Tap</span>
              </div>
            </div>
          </motion.div>

          {/* Level Card */}
          <motion.div 
            whileTap={{ scale: 0.97 }}
            animate={xpPop ? { scale: [1, 1.02, 1] } : {}}
            className="liquid-glass-card rounded-2xl p-4 flex flex-col justify-between h-[110px] select-none border-purple-500/20 bg-purple-950/10 shadow-[0_0_20px_rgba(139,92,246,0.1)] relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <span className="text-[8px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full">
                Level {currentLevel}
              </span>
              <Trophy size={14} className="text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">
                {currentXP} <span className="text-xs text-slate-400 font-bold uppercase">XP</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* 4. Progress & Score Cards */}
        <div className="grid grid-cols-2 gap-3.5 w-full">
          <motion.div 
            whileTap={{ scale: 0.97 }}
            className="liquid-glass-card p-4 rounded-2xl flex flex-col justify-between h-[96px] select-none"
          >
            <div className="flex justify-between items-start">
              <Target className="text-slate-400" size={15} />
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 bg-white/5 px-1.5 py-0.5 rounded-full">Progress</span>
            </div>
            <div>
              <div className="text-xl font-black text-white">{completionPercentage}%</div>
              <div className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mt-0.5">
                {completedToday} of {totalHabits} completed
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileTap={{ scale: 0.97 }}
            className="liquid-glass-card p-4 rounded-2xl flex flex-col justify-between h-[96px] select-none"
          >
            <div className="flex justify-between items-start">
              <Zap className="text-slate-400" size={15} />
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 bg-white/5 px-1.5 py-0.5 rounded-full">Score</span>
            </div>
            <div>
              <div className="text-xl font-black text-white">
                {totalHabits === 0 ? "0/0" : `${completedToday}/${totalHabits}`}
              </div>
              <div className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mt-0.5">
                {totalHabits === 0 ? "0 Scheduled" : "Habits Done"}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 5. Today's Habits Section */}
        <div className="w-full liquid-glass-card rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Today's Habits</h2>
            {totalHabits > 0 && (
              <span className="text-[10px] text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                {completedToday}/{totalHabits} Done
              </span>
            )}
          </div>
          {totalHabits > 0 ? (
            <HabitList previewMode />
          ) : (
            <div className="py-6 text-center bg-white/[0.02] rounded-xl border border-white/5 border-dashed flex flex-col items-center justify-center p-4">
              <span className="text-slate-500 text-lg mb-1">📋</span>
              <p className="text-slate-300 font-black uppercase tracking-widest text-[10px] mb-1">
                No active habits scheduled
              </p>
              <p className="text-slate-500 text-[10px] max-w-[240px] mx-auto leading-relaxed mb-4">
                Set up your first habit to activate your daily execution protocol.
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab("habits")}
                className="w-full max-w-[200px] py-2.5 px-4 bg-white hover:bg-slate-200 text-black font-extrabold uppercase tracking-wider text-[10px] rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 h-10"
              >
                <Plus size={13} strokeWidth={3} />
                Create First Habit
              </motion.button>
            </div>
          )}
        </div>

        {/* 6. AI Coach Quick Access Card */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab("coach")}
          className="w-full liquid-glass-card-interactive rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer select-none border-purple-500/20 shadow-[0_0_20px_rgba(139,92,246,0.08)]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
              <AICoachIcon size={18} active />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black text-white truncate">AI Coach Session</h3>
              <p className="text-[11px] text-slate-400 truncate">Personalized strategy & discipline guidance.</p>
            </div>
          </div>
          <div className="px-3 py-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-xl text-purple-200 text-[11px] font-extrabold flex items-center gap-1 shrink-0 h-9 transition-colors">
            Consult <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* 7. Recent Activity */}
        {safeHabits.length > 0 ? (
          <div className="w-full liquid-glass-card rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-slate-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Recent Activity</h3>
            </div>
            <div className="space-y-1.5">
              {safeHabits.slice(0, 3).map(h => (
                <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 text-xs">
                  <span className="font-bold text-slate-200 truncate max-w-[170px]">{h.name}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0 ${
                    h.completedToday 
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}>
                    {h.completedToday ? 'Completed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

      </div>

      {/* DESKTOP / TABLET BENTO LAYOUT (>= 768px) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="hidden md:block p-6 md:p-8 max-w-5xl mx-auto space-y-8 relative"
      >
        {/* FROSTY GLOW IF FROZEN */}
        {isFrozen && (
          <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-cyan-500/5 via-cyan-500/[0.01] to-transparent pointer-events-none blur-[100px] rounded-full z-0" />
        )}

        {/* STREAK SHIELD BANNER */}
        {isFrozen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 bg-cyan-950/25 border border-cyan-500/25 rounded-3xl p-6 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_40px_rgba(6,182,212,0.08)]"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl animate-pulse">
                ❄️
              </div>
              <div className="text-left">
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  STREAK SHIELD ACTIVE <span className="text-[9px] font-black uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full tracking-wider">Protected</span>
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Your streak progress is frozen & preserved until <strong className="text-cyan-200 font-bold">{freezeUntilDateStr}</strong>.
                </p>
              </div>
            </div>
            
            <div className="relative z-10 flex items-center gap-2">
              <button
                onClick={async () => {
                  if (!confirmDeactivate) {
                    setConfirmDeactivate(true);
                    return;
                  }
                  try {
                    setUnfreezing(true);
                    await deactivateFreeze();
                    toast.success("Streak Shield deactivated! Progression resumed.");
                    setConfirmDeactivate(false);
                  } catch (e) {
                    toast.error("Failed to deactivate streak shield.");
                  } finally {
                    setUnfreezing(false);
                  }
                }}
                disabled={unfreezing}
                className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border transition-all duration-300 transform active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  confirmDeactivate
                    ? "bg-red-500/20 text-red-400 border-red-500/40 font-black animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    : "bg-cyan-500/15 text-cyan-400 border-cyan-500/25 hover:bg-cyan-500/25 hover:border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                }`}
              >
                {unfreezing ? "Deactivating..." : confirmDeactivate ? "Confirm Unfreeze?" : "Deactivate Freeze"}
              </button>
            </div>
          </motion.div>
        )}

        {/* HEADER */}
        <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-2">
          <div>
            <motion.h1 
              key={greeting}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-3xl md:text-4xl font-black tracking-tight"
            >
              {greeting}
            </motion.h1>
            <div className="flex items-center gap-2.5 mt-1.5">
              <p className="text-slate-400 text-xs tracking-widest uppercase font-bold">
                {today}
              </p>
              {equippedTitle && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                    <Shield size={10} />
                    {equippedTitle}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Top Quick Stats Bento */}
          <div className="flex gap-4 w-full md:w-auto relative z-10">
            {/* Streak Card */}
            <div 
              onClick={() => setIsStreakSheetOpen(true)}
              className={`liquid-glass-card rounded-2xl px-6 py-4 flex items-center justify-between gap-6 md:grow-0 cursor-pointer transition-all hover:border-white/20 ${
                isFrozen 
                  ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-200" 
                  : "border-orange-500/20 bg-orange-950/10"
              }`}
            >
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                  {isFrozen ? "Frozen Streak" : "Day Streak"}
                </div>
                <div className={`text-2xl font-black ${
                  isFrozen ? "text-cyan-200" : "text-white"
                }`}>
                  {user.currentStreak ?? user.streak} Days
                </div>
              </div>
              <div className="text-2xl">
                {isFrozen ? "❄️" : "🔥"}
              </div>
            </div>
            
            {/* Level & XP Card */}
            <motion.div 
              animate={xpPop ? { scale: [1, 1.03, 1] } : {}}
              className="liquid-glass-card rounded-2xl px-6 py-4 flex items-center justify-between gap-6 md:grow-0 border-purple-500/20 bg-purple-950/10"
            >
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-purple-300 mb-0.5 flex items-center gap-1">
                  <span>Level {currentLevel}</span>
                  {xpPop && <span className="text-[8px] font-black uppercase text-purple-300 bg-purple-500/20 px-1 rounded-full">+XP</span>}
                </div>
                <div className="text-2xl font-black text-white">
                  {currentXP} <span className="text-xs text-slate-400 font-bold uppercase">XP</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Trophy size={18} />
              </div>
            </motion.div>
          </div>
        </header>

        {/* MOTIVATIONAL QUOTE */}
        <MotivationalQuote />

        {/* BENTO STATS & HABITS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress Card */}
          <div className="liquid-glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <Target className="text-purple-400" size={22} />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">Progress</span>
            </div>
            <div>
              <div className="text-3xl font-black text-white">{completionPercentage}%</div>
              <div className="text-xs font-bold text-slate-400 mt-1">
                {completedToday} of {totalHabits} routines completed
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Daily Score Card */}
          <div className="liquid-glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <Zap className="text-emerald-400" size={22} />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">Completion</span>
            </div>
            <div>
              <div className="text-3xl font-black text-white">
                {totalHabits === 0 ? "0 / 0" : `${completedToday} / ${totalHabits}`}
              </div>
              <div className="text-xs font-bold text-slate-400 mt-1">
                {totalHabits === 0 ? "No active habits today" : "Checklist items locked in"}
              </div>
              <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase mt-3">
                {completionPercentage === 100 ? "✓ 100% Target Met" : "Execution in progress"}
              </div>
            </div>
          </div>

          {/* AI Coach Card */}
          <div 
            onClick={() => setActiveTab("coach")}
            className="liquid-glass-card-interactive p-6 rounded-2xl flex flex-col justify-between space-y-4 cursor-pointer border-purple-500/20 stripe-purple group"
          >
            <div className="flex justify-between items-start">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <AICoachIcon size={18} active />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/30">
                AI Coach
              </span>
            </div>
            <div>
              <h3 className="text-base font-black text-white">Consult Coach</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Receive personalized tactical adjustments based on your active routine.
              </p>
              <div className="flex items-center gap-1 text-xs font-bold text-purple-300 mt-3 group-hover:translate-x-1 transition-transform">
                <span>Start Session</span>
                <ArrowRight size={13} />
              </div>
            </div>
          </div>
        </div>

        {/* HABITS SECTION */}
        <section className="liquid-glass-card rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-300">Today's Habits</h2>
            {totalHabits > 0 && (
              <span className="text-xs text-purple-300 font-bold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                {completedToday} / {totalHabits} Completed
              </span>
            )}
          </div>
          <HabitList previewMode />
        </section>

      </motion.div>

      {/* Streak Details Modal */}
      <AnimatePresence>
        {isStreakSheetOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setIsStreakSheetOpen(false)} />

            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="bg-[#0c0c14] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 rounded-t-[2rem] sm:rounded-2xl border border-white/10 w-full sm:max-w-sm shadow-2xl relative z-10 text-left"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 block sm:hidden" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-lg">
                  🔥
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Streak Metrics</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Consistency Tracking</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Streak</div>
                  <div className="text-sm font-black text-white">
                    {user.currentStreak ?? user.streak ?? 0} Days
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Best Streak</div>
                  <div className="text-sm font-black text-amber-400">
                    {Math.max(user.currentStreak ?? user.streak ?? 0, 7)} Days
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Streak Shield</div>
                  <div className={`text-xs font-bold uppercase tracking-wider ${isFrozen ? "text-cyan-400 font-black" : "text-slate-400"}`}>
                    {isFrozen ? `Frozen until ${freezeUntilDateStr}` : "Inactive"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsStreakSheetOpen(false)}
                className="w-full mt-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer h-12"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Level Up Celebration */}
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
              className="relative bg-[#0d0d14] border border-purple-500/35 rounded-[2rem] p-8 max-w-sm w-full shadow-[0_0_50px_rgba(139,92,246,0.25)] space-y-6 z-10 text-center overflow-hidden"
            >
              <div className="w-16 h-16 bg-purple-500/15 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto text-purple-300 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                <Trophy size={32} strokeWidth={2.5} />
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-black tracking-widest text-purple-400 uppercase">PROTOCOL UPGRADE</div>
                <h3 className="text-2xl font-black tracking-tighter text-white uppercase">Level {user.level} Unlocked</h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-[240px] mx-auto">
                  Your discipline score has elevated your tier. Continue executing daily.
                </p>
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
