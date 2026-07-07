import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { MotivationalQuote } from "../MotivationalQuote";
import { HabitList } from "../HabitList";
import { Target, Zap, Clock, ShieldAlert, Sparkles, Flame, Snowflake, Award } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";

import { isHabitScheduledForToday } from "../../lib/habitUtils";

export function DashboardScreen() {
  const { user, habits, deactivateFreeze } = useStore();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [unfreezing, setUnfreezing] = useState(false);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting("Good morning");
    else if (hr < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Automatically reset the "Confirm Unfreeze" button if not clicked again within 3 seconds
  useEffect(() => {
    if (!confirmDeactivate) return;
    const timer = setTimeout(() => {
      setConfirmDeactivate(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [confirmDeactivate]);

  if (!user) return null;

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  const validHabits = (habits || []).filter(Boolean);
  const todaysHabits = validHabits.filter(isHabitScheduledForToday);
  const completedToday = validHabits.filter(h => h.completedToday).length; 
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="px-4 py-6 md:p-8 max-w-4xl mx-auto space-y-8 relative"
    >
      {/* STREAK SHIELD ACTIVE BANNER */}
      {isFrozen && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-black border border-white/10 rounded-[1.75rem] p-6 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-lg">
              ❄️
            </div>
            <div className="text-left">
              <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                STREAK SHIELD ACTIVE <span className="text-[8px] font-black uppercase text-white bg-white/10 border border-white/20 px-1.5 py-0.5 rounded-full tracking-wider">Protected</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Your discipline progress is deep-frozen & protected until <strong className="text-white font-bold">{freezeUntilDateStr}</strong>.
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
              className={`text-[9px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl border transition-all duration-300 transform active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                confirmDeactivate
                  ? "bg-red-500/20 text-red-400 border-red-500/40 font-black"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30"
              }`}
            >
              {unfreezing ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              ) : confirmDeactivate ? (
                "Confirm Unfreeze?"
              ) : (
                "Deactivate Freeze"
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* DASHBOARD HEADER */}
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-display font-light tracking-tight text-white">
            {greeting}, <span className="font-semibold text-white">{user.name}</span>
          </h1>
          <p className="text-slate-500 text-[9px] tracking-[0.25em] uppercase font-bold">
            {today}
          </p>
        </div>

        {/* METRICS QUICK STATS CARDS */}
        <div className="flex gap-4 w-full md:w-auto relative z-10">
          {/* Day Streak Card */}
          <div className="bg-black border border-white/10 hover:border-white/20 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-6 md:grow-0 backdrop-blur-xl transition-all duration-300">
            <div className="space-y-0.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {isFrozen ? "Frozen Streak" : "Day Streak"}
              </div>
              <div className="text-2xl font-bold font-display text-white">
                {user.streak}
              </div>
            </div>
            <div className="text-xl">
              {isFrozen ? (
                <Snowflake size={18} className="text-white" />
              ) : (
                <Flame size={18} className="text-white" />
              )}
            </div>
          </div>
          
          {/* Level Progress Card */}
          <div className="bg-black border border-white/10 hover:border-white/20 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-6 md:grow-0 backdrop-blur-xl transition-all duration-300">
            <div className="space-y-0.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Level {user.level}</div>
              <div className="text-2xl font-bold text-white font-display">
                {user.xp} <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">XP</span>
              </div>
            </div>
            
            {/* Level circular meter */}
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="14" className="stroke-white/[0.04]" strokeWidth="3" fill="none" />
                <circle 
                  cx="18" 
                  cy="18" 
                  r="14" 
                  className="stroke-white" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeDasharray="88" 
                  strokeDashoffset={88 - (88 * (user.levelProgress || 0)) / 100} 
                  strokeLinecap="round" 
                />
              </svg>
              <Award size={12} className="absolute text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* MOTIVATIONAL DIRECTIVE */}
      <div className="relative z-10">
        <MotivationalQuote />
      </div>

      {/* TODAY'S HABIT PROGRESS METRICS (Grid layout) */}
      <section className="relative z-10 grid grid-cols-2 gap-4">
        <div className="brand-card p-5 rounded-[1.5rem] flex flex-col gap-2 relative overflow-hidden">
          <Target className="text-white" size={18} />
          <div className="text-2xl font-bold font-display tracking-tight text-white">{completionPercentage}%</div>
          <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Today's Progress</div>
        </div>
        
        <div className="brand-card p-5 rounded-[1.5rem] flex flex-col gap-2 relative overflow-hidden">
          <Zap className="text-white" size={18} />
          <div className="text-2xl font-bold font-display tracking-tight text-white">{completedToday} / {totalHabits}</div>
          <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Habits Done</div>
        </div>
      </section>

      {/* MAIN HABITS CONTAINER */}
      <section className="relative z-10 brand-card rounded-[1.75rem] p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-white" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Today's Agenda</h2>
          </div>
          <span className="text-[10px] text-slate-500 font-bold">{todaysHabits.length} Scheduled</span>
        </div>
        <HabitList previewMode />
      </section>

    </motion.div>
  );
}

