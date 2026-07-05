import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Loader2, MoreVertical } from 'lucide-react';
import { useStore, Habit } from '../store/useStore';
import { toast } from 'react-hot-toast';
import { isHabitScheduledForToday, getScheduledDaysMessage } from '../lib/habitUtils';
import { EditHabitModal } from './EditHabitModal';

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

  const validHabits = (habits || []).filter(Boolean);
  const displayHabits = previewMode 
    ? validHabits.filter(h => !h.completedToday && isHabitScheduledForToday(h)).slice(0, 5) 
    : validHabits;

  return (
    <>
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
                ? 'bg-emerald-500/[0.02] border-emerald-500/10 opacity-70' 
                : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/10 hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
            }`}
          >
            <div className="flex flex-col gap-1">
              <h4 className={`font-semibold transition-all text-sm font-sans tracking-wide ${habit.completedToday ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                {habit.name}
              </h4>
              <p className={`text-[9px] font-extrabold uppercase tracking-widest ${habit.completedToday ? 'text-emerald-500/70' : 'text-slate-500'}`}>
                {habit.completedToday ? 'Completed Today' : (isToday ? 'Scheduled Today' : getScheduledDaysMessage(habit))}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
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
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-90 cursor-pointer ${
                  habit.completedToday 
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400' 
                    : (isToday ? 'bg-white/[0.02] border border-white/10 hover:border-violet-500/40 hover:text-violet-400 hover:bg-violet-500/5' : 'bg-white/[0.01] border border-white/[0.02] opacity-40 cursor-not-allowed')
                }`}
              >
                <Check size={14} className={habit.completedToday ? 'stroke-[3px]' : (isToday ? 'opacity-20 group-hover:opacity-100 transition-opacity' : 'opacity-10')} />
              </button>
              
              <button
                onClick={() => setEditingHabit(habit)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] transition-all cursor-pointer"
              >
                <MoreVertical size={14} />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-[#0b0b10] p-6 rounded-[2rem] border border-white/[0.08] max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
          >
            {/* Ambient aesthetic glow background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-[40px] pointer-events-none" />
            
            <h3 className="text-md font-display font-light mb-8 text-slate-100 text-center leading-snug px-4">
              {confirmModal.title}
            </h3>
            
            <div className="flex gap-3 relative z-10">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                className="flex-1 py-3 focus:outline-none rounded-xl bg-white/[0.04] text-slate-300 font-bold hover:bg-white/[0.08] hover:text-white transition-all uppercase tracking-widest text-[10px] border border-white/5 cursor-pointer"
              >
                Nope
              </button>
              <button 
                onClick={async () => {
                  await confirmModal.action();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }} 
                className="flex-1 py-3 focus:outline-none rounded-xl bg-slate-200 text-black font-extrabold hover:bg-white transition-all uppercase tracking-widest text-[10px] cursor-pointer shadow-lg shadow-white/5"
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
