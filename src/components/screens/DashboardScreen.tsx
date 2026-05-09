import { useStore } from "../../store/useStore";
import { MotivationalQuote } from "../MotivationalQuote";
import { HabitList } from "../HabitList";
import { Snowflake, Target, Zap, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "motion/react";

export function DashboardScreen() {
  const { user, habits, freezeStreak } = useStore();

  if (!user) return null;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const completedToday = habits.filter(h => h.completedToday).length;
  const totalHabits = habits.length;
  const completionPercentage = totalHabits === 0 ? 0 : Math.round((completedToday / totalHabits) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 max-w-4xl mx-auto space-y-8"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter">Ready, {user.name}?</h1>
          <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold mt-1">
            {today}
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between gap-6 md:grow-0 backdrop-blur-md">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Day Streak</div>
              <div className="text-3xl font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{user.streak}</div>
            </div>
            <div className="text-2xl opacity-80">🔥</div>
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

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-2">
          <Snowflake className="text-slate-400" size={20} />
          <div className="flex justify-between items-end">
             <div className="text-lg font-black leading-tight">{user.freeze_until && new Date(user.freeze_until) > new Date() ? "Active" : "Ready"}</div>
          </div>
          <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Streak Shield</div>
        </div>
        <div className="bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-5 rounded-2xl flex flex-col justify-center items-center text-center cursor-pointer hover:bg-white/10 transition-colors"
          onClick={async () => {
             if (user.freeze_until && new Date(user.freeze_until) > new Date()) return;
             try {
                await freezeStreak(7);
                toast.success("STREAK SHIELD ACTIVATED");
             } catch (e) {
                toast.error("SHIELD FAILURE");
             }
          }}
        >
          <div className="text-xs font-bold uppercase tracking-widest text-white mb-1">
             {user.freeze_until && new Date(user.freeze_until) > new Date() ? "Shield is up" : "Activate Shield"}
          </div>
          <div className="text-[10px] text-slate-500">Pause 7 days</div>
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Today's Habits</h2>
        </div>
        <HabitList previewMode />
      </section>

    </motion.div>
  );
}
