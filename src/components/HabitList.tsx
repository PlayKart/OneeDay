import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Loader2, MoreVertical } from 'lucide-react';
import { useStore, Habit } from '../store/useStore';
import { toast } from 'react-hot-toast';
import { isHabitScheduledForToday, getScheduledDaysMessage } from '../lib/habitUtils';
import { EditHabitModal } from './EditHabitModal';
import { getHabitIconComponent, getHabitColorTheme } from '../lib/habitIcons';

export const HabitList = ({ previewMode = false }: { previewMode?: boolean }) => {
  const { habits, completeHabit, undoHabit, loading } = useStore();
  
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    action: async () => {}
  });

  const safeHabits = Array.isArray(habits) ? habits : [];
  if (!Array.isArray(habits)) {
    console.log("habits in HabitList:", habits);
    console.log("typeof habits:", typeof habits);
    console.log("Array.isArray:", Array.isArray(habits));
  }
  const displayHabits = previewMode 
    ? safeHabits.filter(h => h && !h.completedToday && isHabitScheduledForToday(h)).slice(0, 5) 
    : safeHabits;

  if (!Array.isArray(displayHabits)) {
    console.log("displayHabits:", displayHabits);
    console.log("typeof displayHabits:", typeof displayHabits);
    console.log("Array.isArray:", Array.isArray(displayHabits));
  }

  const guardedDisplayHabits = Array.isArray(displayHabits) ? displayHabits : [];

  return (
    <>
    <div className="space-y-4">
      {!previewMode && (
         <div className="mb-6 opacity-0 hidden">
           {/* Legacy spacing, we hide this because HabitsScreen has its own header now */}
         </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {guardedDisplayHabits.map((habit) => {
          const isToday = isHabitScheduledForToday(habit);
          const IconComp = getHabitIconComponent(habit.icon, habit.name);
          const colorTheme = getHabitColorTheme(habit.category, habit.name);

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
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className={`w-11 h-11 rounded-2xl ${colorTheme.bg} border ${colorTheme.border} flex items-center justify-center ${colorTheme.text} shrink-0 transition-all duration-300 shadow-md ${habit.completedToday ? 'opacity-50 grayscale' : colorTheme.glow}`}>
                <IconComp size={20} />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h4 className={`font-bold transition-all text-sm truncate ${habit.completedToday ? 'text-slate-500 line-through' : 'text-white'}`}>
                  {habit.name}
                </h4>
                <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${habit.completedToday ? 'text-green-500/50' : 'text-slate-500'}`}>
                  {habit.completedToday ? 'Completed' : (isToday ? 'Scheduled Today' : getScheduledDaysMessage(habit))}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={async () => {
                  if (!isToday && !habit.completedToday) {
                    toast.error(`Dude, do it on ${getScheduledDaysMessage(habit)}. Chill !!!`);
                    return;
                  }
                  
                  if (habit.completedToday) {
                    setConfirmModal({
                      isOpen: true,
                      title: "Lied to Yourself ?",
                      action: async () => {
                        try {
                          await undoHabit(habit.id);
                          toast.success("HABIT UNDONE");
                        } catch (e) {
                          toast.error("COMMUNICATIONS ERROR");
                        }
                      }
                    });
                  } else if (!loading) {
                    setConfirmModal({
                      isOpen: true,
                      title: "Don't lie to yourself bro , You did it or not ?",
                      action: async () => {
                        try {
                          await completeHabit(habit.id);
                          toast.success("HABIT COMPLETED +10 XP");
                        } catch (e) {
                          toast.error("COMMUNICATIONS ERROR");
                        }
                      }
                    });
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
              
              <button
                onClick={() => setEditingHabit(habit)}
                className="w-10 h-10 flex items-center justify-center translate-x-2 text-slate-500 hover:text-white transition-colors"
              >
                <MoreVertical size={16} />
              </button>
            </div>
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
    
    <AnimatePresence>
       {editingHabit && (
          <EditHabitModal habit={editingHabit} onClose={() => setEditingHabit(null)} />
       )}
    </AnimatePresence>
    
    {/* Custom Confirm Modal */}
    <AnimatePresence>
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#111] p-6 rounded-2xl border border-white/10 max-w-sm w-full shadow-2xl"
          >
            <h3 className="text-lg font-bold mb-8 text-white text-center leading-snug">{confirmModal.title}</h3>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                className="flex-1 py-3 focus:outline-none rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all uppercase tracking-wider text-xs border border-white/10"
              >
                Nope
              </button>
              <button 
                onClick={async () => {
                  await confirmModal.action();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }} 
                className="flex-1 py-3 focus:outline-none rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-all uppercase tracking-wider text-xs"
              >
                Yes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};
