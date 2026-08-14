import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Loader2, MoreVertical, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { useStore, Habit } from '../store/useStore';
import { toast } from 'react-hot-toast';
import { isHabitScheduledForToday, getScheduledDaysMessage } from '../lib/habitUtils';
import { EditHabitModal } from './EditHabitModal';
import { getHabitIconComponent, getHabitColorTheme } from '../lib/habitIcons';
import { getXpForDifficulty, extractXpAwarded, toDisplayDifficulty } from '../utils';

export const HabitList = ({ previewMode = false, onCreateClick }: { previewMode?: boolean; onCreateClick?: () => void }) => {
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
                      {toDisplayDifficulty(habit.difficulty)} (+{getXpForDifficulty(habit.difficulty)} XP)
                    </span>
                  )}
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${habit.completedToday ? 'text-green-500/50' : 'text-slate-500'}`}>
                  {isPending ? 'Updating...' : (habit.completedToday ? 'Completed' : (isToday ? 'Scheduled Today' : getScheduledDaysMessage(habit)))}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <motion.button 
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
                    // Tap-and-Go Immediate completion for fluid responsiveness & game feel
                    try {
                      const res = await completeHabit(habit.id);
                      const xpAwarded = extractXpAwarded(res, habit.difficulty);
                      toast.success(`+${xpAwarded} XP`);
                      if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        navigator.vibrate([15, 30]);
                      }
                    } catch (e: any) {
                      const errorMessage = e?.response?.data?.error || e?.message || "Failed to complete habit";
                      toast.error(errorMessage);
                    }
                  }
                }}
                disabled={loading || isPending}
                whileTap={{ scale: 0.85 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isPending
                    ? 'bg-white/10 text-white cursor-wait border border-white/20'
                    : habit.completedToday 
                      ? 'bg-white text-black hover:bg-red-500 hover:text-white border border-transparent' 
                      : (isToday ? 'bg-white/5 border border-white/10 group-hover:border-white/30 text-white/30 sm:text-transparent sm:hover:text-white' : 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed')
                }`}
              >
                {isPending ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                  <Check size={18} className={habit.completedToday ? '' : (isToday ? 'text-white/40 sm:group-hover:text-white/20' : 'text-white/10')} />
                )}
              </motion.button>
              
              <div className="relative">
                <motion.button
                  type="button"
                  aria-label={`Options menu for ${habit.name}`}
                  aria-expanded={activeDropdownId === habit.id}
                  aria-haspopup="true"
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdownId(prev => prev === habit.id ? null : habit.id);
                  }}
                  className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-white transition-colors rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
                >
                  <MoreVertical size={16} />
                </motion.button>

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

        {(guardedDisplayHabits || []).length === 0 && (
          <div className="col-span-full py-16 px-6 text-center bg-white/[0.01] rounded-[2rem] border border-white/5 border-dashed flex flex-col items-center justify-center min-h-[340px]">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-4 shadow-[0_0_30px_rgba(255,255,255,0.02)] select-none">
              🌱
            </div>
            <h3 className="text-zinc-300 font-extrabold uppercase tracking-[0.25em] text-xs mb-2">
              NO ACTIVE HABITS
            </h3>
            <p className="text-slate-500 text-xs max-w-[280px] mx-auto leading-relaxed mb-8">
              Every master was once a beginner. Establish your daily discipline protocol today and build your streak, one day at a time.
            </p>
            {onCreateClick && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onCreateClick}
                className="w-full max-w-[260px] py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-xl hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2 h-14"
              >
                <Plus size={16} strokeWidth={3} />
                <span>Create your first habit</span>
              </motion.button>
            )}
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
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-habit-modal-title"
          aria-describedby="delete-habit-modal-desc"
        >
          {/* Backdrop overlay clickable to dismiss */}
          <div className="absolute inset-0" onClick={() => setDeleteConfirmationHabit(null)} />
          
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="bg-[#0c0c0c] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 rounded-t-[2rem] sm:rounded-2xl border border-white/10 w-full sm:max-w-sm shadow-2xl relative z-10"
          >
            {/* Native sheet drag handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 block sm:hidden" />

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
                className="flex-1 py-3 focus:outline-none rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all uppercase tracking-wider text-xs border border-white/10 disabled:opacity-50 cursor-pointer h-12"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleConfirmDelete(deleteConfirmationHabit)}
                className="flex-1 py-3 focus:outline-none rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-all uppercase tracking-wider text-xs shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer h-12"
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm">
          {/* Backdrop overlay clickable to dismiss */}
          <div className="absolute inset-0" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} />

          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="bg-[#0c0c0c] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 rounded-t-[2rem] sm:rounded-2xl border border-white/10 w-full sm:max-w-sm shadow-2xl relative z-10"
          >
            {/* Native sheet drag handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 block sm:hidden" />

            <h3 className="text-base font-bold mb-6 text-white text-center leading-snug px-4">{confirmModal.title}</h3>
            <div className="flex gap-3">
              <button 
                type="button"
                disabled={isSubmittingModal}
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                className="flex-1 py-3 focus:outline-none rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all uppercase tracking-wider text-xs border border-white/10 disabled:opacity-50 cursor-pointer h-12"
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
                className="flex-1 py-3 focus:outline-none rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-all uppercase tracking-wider text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer h-12"
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
