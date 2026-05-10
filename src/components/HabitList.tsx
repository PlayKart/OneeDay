import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from 'react-hot-toast';
import { isHabitScheduledForToday, getScheduledDaysMessage } from '../lib/habitUtils';

export const HabitList = ({ previewMode = false }: { previewMode?: boolean }) => {
  const { habits, completeHabit, undoHabit, loading } = useStore();

  const displayHabits = previewMode 
    ? habits.filter(h => !h.completedToday && isHabitScheduledForToday(h)).slice(0, 5) 
    : habits;

  return (
    <div className="space-y-4">
      {!previewMode && (
         <div className="mb-6 opacity-0 hidden">
           {/* Legacy spacing, we hide this because HabitsScreen has its own header now */}
         </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {(displayHabits || []).map((habit) => {
          const isToday = isHabitScheduledForToday(habit);
          return (
          <motion.div 
            layout
            key={habit.id}
            className={`p-4 rounded-2xl flex items-center justify-between group transition-all duration-300 border ${
              habit.completedToday 
                ? 'bg-white/5 border-white/10 opacity-60' 
                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/20'
            }`}
          >
            <div className="flex flex-col gap-1.5">
              <h4 className={`font-bold transition-all text-sm ${habit.completedToday ? 'text-slate-500' : 'text-white'}`}>
                {habit.name}
              </h4>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${habit.completedToday ? 'text-green-500/50' : 'text-slate-600'}`}>
                {habit.completedToday ? 'Completed' : (isToday ? 'Scheduled Today' : getScheduledDaysMessage(habit))}
              </p>
            </div>
            
            <button 
              onClick={async () => {
                if (!isToday && !habit.completedToday) {
                  toast.error(`Dude, do it on ${getScheduledDaysMessage(habit)}. Chill !!!`);
                  return;
                }
                
                if (habit.completedToday) {
                  if (window.confirm("Lied to Yourself ?")) {
                    try {
                      await undoHabit(habit.id);
                      toast.success("HABIT UNDONE");
                    } catch (e) {
                      toast.error("COMMUNICATIONS ERROR");
                    }
                  }
                } else if (!loading) {
                  if (window.confirm("Don't lie to yourself bro , You did it or not ?")) {
                    try {
                      await completeHabit(habit.id);
                      toast.success("HABIT COMPLETED +10 XP");
                    } catch (e) {
                      toast.error("COMMUNICATIONS ERROR");
                    }
                  }
                }
              }}
              disabled={loading}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                habit.completedToday 
                  ? 'bg-white text-black hover:bg-red-500 hover:text-white' 
                  : (isToday ? 'bg-white/5 border border-white/10 group-hover:border-white/30 text-transparent hover:text-white' : 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed')
              }`}
            >
              <Check size={16} className={habit.completedToday ? '' : (isToday ? 'group-hover:text-white/20' : 'text-white/10')} />
            </button>
          </motion.div>
        )})}

        {(displayHabits || []).length === 0 && (
          <div className="col-span-full py-12 text-center bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
            <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px]">
              {previewMode ? "All caught up for today" : "No active habits"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
