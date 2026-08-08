import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Loader2, MoreVertical, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { useStore, Habit } from '../store/useStore';
import { toast } from 'react-hot-toast';
import { isHabitScheduledForToday, getScheduledDaysMessage } from '../lib/habitUtils';
import { EditHabitModal } from './EditHabitModal';
import { getHabitIconComponent, getHabitColorTheme } from '../lib/habitIcons';
import { getXpForDifficulty, extractXpAwarded } from '../utils';

export const HabitList = ({ previewMode = false }: { previewMode?: boolean }) => {
  const { habits, completeHabit, undoHabit, deleteHabit, refreshFromBackend, loading, pendingHabitIds } = useStore();
  
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [deleteConfirmationHabit, setDeleteConfirmationHabit] = useState<Habit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    action: async () => {}
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdownId(null);
        setDeleteConfirmationHabit(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdownId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleConfirmDelete = async (habit: Habit) => {
    setIsDeleting(true);
    try {
      await deleteHabit(habit.id);
      await refreshFromBackend();
      toast.success("Habit deleted successfully.");
      setDeleteConfirmationHabit(null);
    } catch (err: any) {
      console.error("Failed to delete habit:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete habit";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUndoCompletion = async (habit: Habit) => {
    try {
      const res = await undoHabit(habit.id);
      await refreshFromBackend();
      const xp = extractXpAwarded(res, habit.difficulty);
      toast.success(`Completion undone (-${xp} XP)`);
    } catch (err: any) {
      console.error("Failed to undo habit completion:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to undo completion";
      toast.error(errorMessage);
    }
  };

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
          const isPending = pendingHabitIds?.has(habit.id);
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
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <h4 className={`font-bold transition-all text-sm truncate ${habit.completedToday ? 'text-slate-500 line-through' : 'text-white'}`}>
                    {habit.name}
                  </h4>
                  {habit.difficulty && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                      habit.difficulty.toLowerCase() === 'easy' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                      habit.difficulty.toLowerCase() === 'hard' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                      habit.difficulty.toLowerCase() === 'elite' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    }`}>
                      {habit.difficulty} (+{getXpForDifficulty(habit.difficulty)} XP)
                    </span>
                  )}
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${habit.completedToday ? 'text-green-500/50' : 'text-slate-500'}`}>
                  {isPending ? 'Updating...' : (habit.completedToday ? 'Completed' : (isToday ? 'Scheduled Today' : getScheduledDaysMessage(habit)))}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={async () => {
                  if (isPending) return;
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
                          const res = await undoHabit(habit.id);
                          const xp = extractXpAwarded(res, habit.difficulty);
                          toast.success(`Completion undone (-${xp} XP)`);
                        } catch (e: any) {
                          const errorMessage = e?.response?.data?.error || e?.message || "Failed to undo completion";
                          toast.error(errorMessage);
                        }
                      }
                    });
                  } else if (!loading) {
                    setConfirmModal({
                      isOpen: true,
                      title: "Don't lie to yourself bro , You did it or not ?",
                      action: async () => {
                        try {
                          const res = await completeHabit(habit.id);
                          const xpAwarded = extractXpAwarded(res, habit.difficulty);
                          toast.success(`+${xpAwarded} XP`);
                        } catch (e: any) {
                          const errorMessage = e?.response?.data?.error || e?.message || "Failed to complete habit";
                          toast.error(errorMessage);
                        }
                      }
                    });
                  }
                }}
                disabled={loading || isPending}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isPending
                    ? 'bg-white/10 text-white cursor-wait border border-white/20'
                    : habit.completedToday 
                      ? 'bg-white text-black hover:bg-red-500 hover:text-white' 
                      : (isToday ? 'bg-white/5 border border-white/10 group-hover:border-white/30 text-transparent hover:text-white' : 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed')
                }`}
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <Check size={16} className={habit.completedToday ? '' : (isToday ? 'group-hover:text-white/20' : 'text-white/10')} />
                )}
              </button>
              
              <div className="relative">
                <button
                  type="button"
                  aria-label={`Options menu for ${habit.name}`}
                  aria-expanded={activeDropdownId === habit.id}
                  aria-haspopup="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdownId(prev => prev === habit.id ? null : habit.id);
                  }}
                  className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <MoreVertical size={16} />
                </button>

                <AnimatePresence>
                  {activeDropdownId === habit.id && (
                    <motion.div
                      ref={dropdownRef}
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-11 z-50 min-w-[170px] bg-[#121212] border border-white/10 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl"
                      role="menu"
                      aria-label="Habit options"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(null);
                          setEditingHabit(habit);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2.5 focus:outline-none focus:bg-white/10"
                      >
                        <Pencil size={14} className="text-slate-400 shrink-0" />
                        <span>Edit Habit</span>
                      </button>

                      {habit.completedToday && (
                        <button
                          type="button"
                          role="menuitem"
                          tabIndex={0}
                          onClick={async (e) => {
                            e.stopPropagation();
                            setActiveDropdownId(null);
                            await handleUndoCompletion(habit);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors flex items-center gap-2.5 focus:outline-none focus:bg-amber-500/10"
                        >
                          <RotateCcw size={14} className="text-amber-400 shrink-0" />
                          <span>Undo Completion</span>
                        </button>
                      )}

                      <button
                        type="button"
                        role="menuitem"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(null);
                          setDeleteConfirmationHabit(habit);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2.5 focus:outline-none focus:bg-red-500/10"
                      >
                        <Trash2 size={14} className="text-red-400 shrink-0" />
                        <span>Delete Habit</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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

    {/* Delete Habit Confirmation Modal */}
    <AnimatePresence>
      {deleteConfirmationHabit && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-habit-modal-title"
          aria-describedby="delete-habit-modal-desc"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#111] p-6 rounded-2xl border border-white/10 max-w-sm w-full shadow-2xl relative"
          >
            <h3 id="delete-habit-modal-title" className="text-lg font-bold text-white text-center leading-snug">
              Delete Habit?
            </h3>
            <p id="delete-habit-modal-desc" className="text-xs text-slate-400 text-center mt-2 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmationHabit(null)}
                className="flex-1 py-3 focus:outline-none rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all uppercase tracking-wider text-xs border border-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleConfirmDelete(deleteConfirmationHabit)}
                className="flex-1 py-3 focus:outline-none rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-all uppercase tracking-wider text-xs shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </motion.div>
        </div>
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
                type="button"
                disabled={isSubmittingModal}
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                className="flex-1 py-3 focus:outline-none rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all uppercase tracking-wider text-xs border border-white/10 disabled:opacity-50"
              >
                Nope
              </button>
              <button 
                type="button"
                disabled={isSubmittingModal}
                onClick={async () => {
                  setIsSubmittingModal(true);
                  try {
                    await confirmModal.action();
                    setConfirmModal({ ...confirmModal, isOpen: false });
                  } finally {
                    setIsSubmittingModal(false);
                  }
                }} 
                className="flex-1 py-3 focus:outline-none rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-all uppercase tracking-wider text-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingModal ? (
                  <Loader2 size={16} className="animate-spin text-black" />
                ) : (
                  "Yes"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};
