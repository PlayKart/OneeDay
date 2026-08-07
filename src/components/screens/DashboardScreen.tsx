import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { MotivationalQuote } from "../MotivationalQuote";
import { HabitList } from "../HabitList";
import { Target, Zap, Clock, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";

import { isHabitScheduledForToday } from "../../lib/habitUtils";

export function DashboardScreen() {
  const { user, habits, deactivateFreeze, refreshFromBackend } = useStore();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [unfreezing, setUnfreezing] = useState(false);

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
  if (!Array.isArray(habits)) {
    console.log("habits in DashboardScreen:", habits);
    console.log("typeof habits:", typeof habits);
    console.log("Array.isArray:", Array.isArray(habits));
  }
  const todaysHabits = safeHabits.filter(isHabitScheduledForToday);
  const completedToday = safeHabits.filter(h => h && h.completedToday).length; 
  const totalHabits = todaysHabits.length;
  const completionPercentage = totalHabits === 0 ? 0 : Math.round((completedToday / totalHabits) * 100);

  // Active Freeze Checking
  const isFrozen = user.freeze_until && new Date(user.freeze_until) > new Date();
  const freezeUntilDateStr = isFrozen && user.freeze_until
    ? new Date(user.freeze_until).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : "";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 relative"
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
          <h1 className="text-3xl font-extrabold tracking-tighter">Ready, {user.name}?</h1>
          <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold mt-1">
            {today}
          </p>
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
          
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between gap-6 md:grow-0 backdrop-blur-md">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Level {user.level}</div>
              <div className="text-3xl font-black text-white/90">{user.xp} <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">XP</span></div>
            </div>
            {/* Level Ring */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="20" cy="20" r="16" className="stroke-white/10" strokeWidth="4" fill="none" />
                <circle cx="20" cy="20" r="16" className="stroke-white" strokeWidth="4" fill="none" strokeDasharray="100" strokeDashoffset={100 - user.levelProgress} strokeLinecap="round" />
              </svg>
            </div>
          </div>
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
  );
}
