import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { MotivationalQuote } from "../MotivationalQuote";
import { HabitList } from "../HabitList";
import { Target, Zap, Clock, ShieldAlert, Sparkles, Activity, ArrowRight, Flame, Trophy, Plus, Shield } from "lucide-react";
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

  // Refresh fresh user data from backend whenever Dashboard is opened
  useEffect(() => {
    refreshFromBackend();
  }, [refreshFromBackend]);

  // Automatically reset the "Confirm Unfreeze" button if not clicked again within 3 seconds
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

  // Authoritative Level & XP Progression calculation
  const currentXP = typeof user.xp === "number" && !isNaN(user.xp) ? Math.max(0, user.xp) : 0;
  const currentLevel = typeof user.level === "number" && !isNaN(user.level) && user.level >= 1 ? Math.floor(user.level) : 1;
  const xpRequiredForNextLevel = 100;
  const progressPercentage = calculateLevelProgress(currentXP, currentLevel, xpRequiredForNextLevel);

  // Diagnostic logging
  console.log(`[XP DEBUG]\ncurrentXP: ${currentXP}\ncurrentLevel: ${currentLevel}\nxpRequiredForNextLevel: ${xpRequiredForNextLevel}\ncalculatedProgress: ${progressPercentage}`);

  // Active Freeze Checking
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
      
      {/* MOBILE LAYOUT (< 768px): True vertical mobile stack, 100% width, no horizontal scrolling */}
      <div className="block md:hidden p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] space-y-3.5 w-full overflow-x-hidden">
        
        {/* Streak Shield Active Banner */}
        {isFrozen && (
          <div className="relative z-10 bg-gradient-to-r from-blue-950/20 via-cyan-950/30 to-blue-950/20 border border-cyan-500/20 rounded-2xl p-4 overflow-hidden flex flex-col gap-3 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-lg animate-pulse shrink-0">
                ❄️
              </div>
              <div className="text-left min-w-0">
                <h2 className="text-xs font-extrabold tracking-tight text-white flex items-center gap-1.5 flex-wrap">
                  STREAK SHIELD <span className="text-[8px] font-black uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.2 rounded-full">Protected</span>
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

        {/* 1. Greeting */}
        <div className="w-full">
          <motion.h1 
            key={greeting}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-extrabold tracking-tighter text-white"
          >
            {greeting}
          </motion.h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold">
              {today}
            </p>
            {equippedTitle && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
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

        {/* 3. Today's Progress & 4. Habits Done */}
        <div className="grid grid-cols-2 gap-3.5 w-full">
          <motion.div 
            whileTap={{ scale: 0.97 }}
            className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between h-[100px] w-full select-none"
          >
            <div className="flex justify-between items-start">
              <Target className="text-slate-400" size={16} />
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-full">Progress</span>
            </div>
            <div>
              <div className="text-xl font-black text-white">{completionPercentage}%</div>
              <div className="text-[9px] font-bold uppercase text-slate-500 tracking-wider mt-0.5">
                {completedToday} of {totalHabits} completed
              </div>
            </div>
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.97 }}
            className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between h-[100px] w-full select-none"
          >
            <div className="flex justify-between items-start">
              <Zap className="text-slate-400" size={16} />
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-full">Score</span>
            </div>
            <div>
              <div className="text-xl font-black text-white">
                {totalHabits === 0 ? "0/0" : `${completedToday}/${totalHabits}`}
              </div>
              <div className="text-[9px] font-bold uppercase text-slate-500 tracking-wider mt-0.5">
                {totalHabits === 0 ? "0 Habits Scheduled" : "Habits Done"}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 5. Current Streak */}
        <motion.div 
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsStreakSheetOpen(true)}
          className={`w-full border rounded-2xl p-4 flex items-center justify-between gap-4 backdrop-blur-md select-none transition-all duration-300 cursor-pointer ${
            isFrozen 
              ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-200 hover:border-cyan-500/50" 
              : "bg-white/5 border border-white/10 text-white hover:border-white/20"
          }`}
        >
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 flex items-center gap-1">
              <span>{isFrozen ? "Frozen Streak" : "Current Streak"}</span>
              <span className="text-[8px] font-black uppercase tracking-wider bg-white/5 text-slate-400 px-1.5 py-0.2 rounded-full">Tap Details</span>
            </div>
            <div className={`text-xl font-black ${isFrozen ? "text-cyan-200" : "text-white"}`}>
              {user.currentStreak ?? user.streak} Days
            </div>
          </div>
          <div className="text-xl animate-pulse">
            {isFrozen ? "❄️" : "🔥"}
          </div>
        </motion.div>

        {/* 6. Level & XP Progress */}
        <motion.div 
          whileTap={{ scale: 0.98 }}
          animate={xpPop ? { scale: [1, 1.02, 1], borderColor: ["rgba(255,255,255,0.1)", "rgba(245,158,11,0.4)", "rgba(255,255,255,0.1)"] } : {}}
          transition={{ duration: 0.4 }}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md select-none relative overflow-hidden"
        >
          {xpPop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.12, 0] }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-amber-500 rounded-2xl pointer-events-none filter blur-xl"
            />
          )}
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                <span>Level Progression</span>
                {xpPop && <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="text-[8px] font-black uppercase text-amber-300 bg-amber-500/20 px-1 rounded-full">XP UP</motion.span>}
              </div>
              <div className="text-lg font-black text-white mt-0.5">Level {currentLevel}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Current XP</div>
              <motion.div 
                animate={xpPop ? { scale: [1, 1.15, 1], color: ["#fff", "#fbbf24", "#fff"] } : {}}
                className="text-sm font-black text-white mt-0.5"
              >
                {currentXP} <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">XP</span>
              </motion.div>
            </div>
          </div>
          <div className="space-y-1.5 relative z-10">
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full" 
              />
            </div>
            <div className="flex items-center justify-between text-[8px] font-bold text-slate-500 uppercase tracking-widest select-none">
              <span>{Math.round(progressPercentage)}% Completed</span>
              <span>100 XP to next level</span>
            </div>
          </div>
        </motion.div>

        {/* 7. Today's Habits */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Today's Habits</h2>
            {totalHabits > 0 && (
              <span className="text-[11px] text-slate-400 font-semibold">{completedToday}/{totalHabits} Done</span>
            )}
          </div>
          {totalHabits > 0 ? (
            <HabitList previewMode />
          ) : (
            <div className="py-6 text-center bg-white/[0.01] rounded-xl border border-white/5 border-dashed flex flex-col items-center justify-center p-4">
              <span className="text-slate-500 text-lg mb-1">📋</span>
              <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-1">
                NO ACTIVE HABITS
              </p>
              <p className="text-slate-500 text-[10px] max-w-[240px] mx-auto leading-relaxed mb-4">
                Establish your first tracking protocol to activate your daily discipline feed.
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab("habits")}
                className="w-full max-w-[200px] py-2 px-4 bg-white text-black font-black uppercase tracking-wider text-[10px] rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 h-10"
              >
                <Plus size={12} strokeWidth={3} />
                Create your first habit
              </motion.button>
            </div>
          )}
        </div>

        {/* 8. AI Coach Card */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab("coach")}
          className="w-full bg-[#111114] hover:bg-[#151519] border border-white/[0.08] hover:border-white/[0.18] rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition-all duration-200 shadow-md"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white shrink-0 shadow-inner">
              <AICoachIcon size={18} active />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white truncate">AI Coach</h3>
              <p className="text-[11px] text-slate-400 truncate">Personalized strategy & performance protocols.</p>
            </div>
          </div>
          <div className="px-3 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-white text-[11px] font-bold flex items-center gap-1 shrink-0 h-9 transition-colors">
            Consult <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* 9. Recent Activity */}
        {safeHabits.length > 0 ? (
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={15} className="text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent Activity</h3>
            </div>
            <div className="space-y-2">
              {safeHabits.slice(0, 3).map(h => (
                <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 text-xs">
                  <span className="font-semibold text-slate-200 truncate max-w-[170px]">{h.name}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${h.completedToday ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                    {h.completedToday ? 'Completed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full py-4 text-center bg-white/[0.01] rounded-2xl border border-white/5 border-dashed">
            <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[9px]">
              No activity logged yet
            </p>
          </div>
        )}

      </div>

      {/* Streak Details Bottom Sheet */}
      <AnimatePresence>
        {isStreakSheetOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm">
            {/* Backdrop overlay clickable to dismiss */}
            <div className="absolute inset-0" onClick={() => setIsStreakSheetOpen(false)} />

            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.1, bottom: 0.8 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) {
                  setIsStreakSheetOpen(false);
                }
              }}
              className="bg-[#0c0c0c] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 rounded-t-[2rem] sm:rounded-2xl border border-white/10 w-full sm:max-w-sm shadow-2xl relative z-10 text-left touch-none"
            >
              {/* Native sheet drag handle */}
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 block sm:hidden" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                  🔥
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Streak Details</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Discipline Metrics</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Streak</div>
                  <div className="text-sm font-black text-white">
                    {user.currentStreak ?? user.streak ?? 0} Days
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Best Streak</div>
                  <div className="text-sm font-black text-amber-400">
                    {Math.max(user.currentStreak ?? user.streak ?? 0, 7)} Days
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Activity</div>
                  <div className="text-sm font-semibold text-slate-200">
                    {user.lastActiveDate 
                      ? new Date(user.lastActiveDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) 
                      : "Today"
                    }
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Streak Shield</div>
                  <div className={`text-xs font-bold uppercase tracking-wider ${isFrozen ? "text-cyan-400" : "text-slate-500"}`}>
                    {isFrozen ? `Frozen until ${freezeUntilDateStr}` : "Inactive"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsStreakSheetOpen(false)}
                className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-[11px] font-extrabold uppercase tracking-widest transition-all cursor-pointer h-12"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* DESKTOP / TABLET LAYOUT (>= 768px): Unchanged existing layout */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="hidden md:block p-6 md:p-8 max-w-4xl mx-auto space-y-8 relative"
      >
        {/* Background frosty glow effect if frozen */}
        {isFrozen && (
          <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-cyan-500/5 via-cyan-500/[0.01] to-transparent pointer-events-none blur-[100px] rounded-full z-0" />
        )}

        {/* STREAK SHIELD ACTIVE BANNER */}
        {isFrozen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 bg-gradient-to-r from-blue-950/20 via-cyan-950/30 to-blue-950/20 border border-cyan-500/20 rounded-3xl p-6 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_50px_rgba(6,182,212,0.05)]"
          >
            <div className="absolute top-0 right-1/4 w-92 h-92 bg-cyan-500/10 rounded-full blur-[70px] pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl animate-pulse">
                ❄️
              </div>
              <div className="text-left">
                <h2 className="text-md font-extrabold tracking-tight text-white flex items-center gap-2">
                  STREAK SHIELD ACTIVE <span className="text-[9px] font-black uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full tracking-wider">Protected</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Your discipline progress is deep-frozen & protected until <strong className="text-cyan-200 font-bold">{freezeUntilDateStr}</strong>.
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
                {unfreezing ? (
                  <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block" />
                ) : confirmDeactivate ? (
                  "Confirm Unfreeze?"
                ) : (
                  "Deactivate Freeze"
                )}
              </button>
            </div>
          </motion.div>
        )}

        <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
          <div>
            <motion.h1 
              key={greeting}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-extrabold tracking-tighter"
            >
              {greeting}
            </motion.h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold">
                {today}
              </p>
              {equippedTitle && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                    <Shield size={10} />
                    {equippedTitle}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto relative z-10">
            {/* Day Streak Card - Dynamic color based on freeze */}
            <div className={`transition-all duration-300 border rounded-2xl px-6 py-4 flex items-center justify-between gap-6 md:grow-0 backdrop-blur-md ${
              isFrozen 
                ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-200 shadow-[0_0_30px_rgba(6,182,212,0.1)]" 
                : "bg-white/5 border border-white/10"
            }`}>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  {isFrozen ? "Frozen Streak" : "Streak"}
                </div>
                <div className={`text-3xl font-black ${
                  isFrozen 
                    ? "text-cyan-200 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                    : "drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                }`}>
                  {user.currentStreak ?? user.streak} Day Streak
                </div>
              </div>
              <div className="text-2xl opacity-90 animate-pulse-slow">
                {isFrozen ? "❄️" : "🔥"}
              </div>
            </div>
            
            <motion.div 
              animate={xpPop ? { scale: [1, 1.03, 1], borderColor: ["rgba(255,255,255,0.1)", "rgba(245,158,11,0.4)", "rgba(255,255,255,0.1)"] } : {}}
              transition={{ duration: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between gap-6 md:grow-0 backdrop-blur-md relative overflow-hidden"
            >
              {xpPop && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.1, 0] }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 bg-amber-500 rounded-2xl pointer-events-none filter blur-lg"
                />
              )}
              <div className="relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1">
                  <span>Level {currentLevel}</span>
                  {xpPop && <span className="text-[8px] font-black uppercase text-amber-400 bg-amber-500/10 px-1 rounded-full border border-amber-500/20">+{currentXP - prevXp} XP</span>}
                </div>
                <motion.div 
                  animate={xpPop ? { scale: [1, 1.15, 1], color: ["#fff", "#fbbf24", "#fff"] } : {}}
                  className="text-3xl font-black text-white/90"
                >
                  {currentXP} <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">XP</span>
                </motion.div>
              </div>
              {/* Level Ring */}
              <div className="relative w-10 h-10 flex items-center justify-center relative z-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="20" cy="20" r="16" className="stroke-white/10" strokeWidth="4" fill="none" />
                  <circle cx="20" cy="20" r="16" className="stroke-white" strokeWidth="4" fill="none" strokeDasharray="100" strokeDashoffset={100 - progressPercentage} strokeLinecap="round" />
                </svg>
              </div>
            </motion.div>
          </div>
        </header>

        <MotivationalQuote />

        <section className="relative z-10 grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-2">
            <Target className="text-slate-400" size={20} />
            <div className="text-2xl font-black">{completionPercentage}%</div>
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Today's Progress</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-2">
            <Zap className="text-slate-400" size={20} />
            <div className="text-2xl font-black">{completedToday}/{totalHabits}</div>
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Habits Done</div>
          </div>
        </section>

        <section className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Today's Habits</h2>
          </div>
          <HabitList previewMode />
        </section>

      </motion.div>

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
              className="relative bg-[#0c0c0c] border border-amber-500/35 rounded-[2rem] p-8 max-w-sm w-full shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-6 z-10 text-center overflow-hidden"
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

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center justify-between">
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
