import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Loader2, MoreVertical, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { useStore, Habit } from '../store/useStore';
import { toast } from 'react-hot-toast';
import { isHabitScheduledForToday, getScheduledDaysMessage } from '../lib/habitUtils';
import { EditHabitModal } from './EditHabitModal';
import { getHabitIconComponent, getHabitColorTheme } from '../lib/habitIcons';
import { getXpForDifficulty, extractXpAwarded, toDisplayDifficulty } from '../utils';
import { ConfirmationDialog } from './ConfirmationDialog';

export const HabitList = ({ previewMode = false, onCreateClick }: { previewMode?: boolean; onCreateClick?: () => void }) => {
  const { habits, completeHabit, undoHabit, deleteHabit, refreshFromBackend, loading, pendingHabitIds } = useStore();
  
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [deleteConfirmationHabit, setDeleteConfirmationHabit] = useState<Habit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [floatingXp, setFloatingXp] = useState<Record<string, number>>({});

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
  const displayHabits = previewMode 
    ? safeHabits.filter(h => h && !h.completedToday && isHabitScheduledForToday(h)).slice(0, 5) 
    : safeHabits;

  const guardedDisplayHabits = Array.isArray(displayHabits) ? displayHabits : [];

  return (
    <>
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2.5">
        {guardedDisplayHabits.map((habit) => {
          const isToday = isHabitScheduledForToday(habit);
          const isPending = pendingHabitIds?.has(habit.id);
          const IconComp = getHabitIconComponent(habit.icon, habit.name);
          const colorTheme = getHabitColorTheme(habit.category, habit.name);

          // Get subtle stripe class according to category
          const categoryLower = (habit.category || "").toLowerCase();
          const stripeClass = 
            categoryLower.includes("fitness") || categoryLower.includes("health") ? "stripe-emerald" :
            categoryLower.includes("focus") || categoryLower.includes("work") || categoryLower.includes("study") ? "stripe-sky" :
            categoryLower.includes("mind") || categoryLower.includes("spirit") ? "stripe-purple" :
            categoryLower.includes("creative") || categoryLower.includes("art") ? "stripe-amber" :
            "stripe-purple";

          return (
          <motion.div 
            layout
            key={habit.id}
            className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between group transition-all duration-200 liquid-glass-card ${stripeClass} ${
              habit.completedToday 
                ? 'opacity-55 bg-white/[0.02]' 
                : 'hover:bg-white/[0.06] hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className={`w-10 h-10 rounded-xl ${colorTheme.bg} border ${colorTheme.border} flex items-center justify-center ${colorTheme.text} shrink-0 transition-all duration-300 shadow-md ${habit.completedToday ? 'opacity-50 grayscale' : colorTheme.glow}`}>
                <IconComp size={18} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <h4 className={`font-black transition-all text-sm truncate ${habit.completedToday ? 'text-slate-400 line-through' : 'text-white'}`}>
                    {habit.name}
                  </h4>
                  {habit.difficulty && (
                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                      habit.difficulty.toLowerCase() === 'easy' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                      habit.difficulty.toLowerCase() === 'hard' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                      habit.difficulty.toLowerCase() === 'elite' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                      'bg-purple-500/10 border-purple-500/30 text-purple-300'
                    }`}>
                      {toDisplayDifficulty(habit.difficulty)} (+{getXpForDifficulty(habit.difficulty)} XP)
                    </span>
                  )}
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-wider truncate ${habit.completedToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isPending ? 'Updating...' : (habit.completedToday ? 'Completed' : (isToday ? 'Scheduled Today' : getScheduledDaysMessage(habit)))}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
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
                      title: "Undo habit completion?",
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
                    try {
                      const res = await completeHabit(habit.id);
                      const xpAwarded = extractXpAwarded(res, habit.difficulty);
                      setFloatingXp(prev => ({ ...prev, [habit.id]: xpAwarded }));
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
                animate={habit.completedToday ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                  isPending
                    ? 'bg-white/10 text-white cursor-wait border border-white/20'
                    : habit.completedToday 
                      ? 'bg-white text-black hover:bg-rose-500 hover:text-white border border-transparent shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                      : (isToday ? 'bg-white/5 border border-white/10 group-hover:border-purple-500/40 text-slate-400 group-hover:text-purple-300' : 'bg-white/5 border border-white/5 opacity-40 cursor-not-allowed')
                }`}
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <Check size={18} strokeWidth={habit.completedToday ? 3 : 2} className={habit.completedToday ? '' : (isToday ? 'text-slate-400 group-hover:text-purple-300' : 'text-white/20')} />
                )}
              </motion.button>

              <AnimatePresence>
                {floatingXp[habit.id] !== undefined && (
                  <motion.div
                    key={`xp-${habit.id}`}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [-10, -45, -55, -60], scale: [0.9, 1.25, 1.1, 0.8] }}
                    transition={{ duration: 1.1, times: [0, 0.2, 0.8, 1], ease: "easeOut" }}
                    onAnimationComplete={() => {
                      setFloatingXp(prev => {
                        const copy = { ...prev };
                        delete copy[habit.id];
                        return copy;
                      });
                    }}
                    className="absolute -top-4 right-14 pointer-events-none text-purple-300 font-black text-[11px] uppercase tracking-widest drop-shadow-[0_0_12px_rgba(139,92,246,0.8)] whitespace-nowrap select-none z-[60]"
                  >
                    +{floatingXp[habit.id]} XP
                  </motion.div>
                )}
              </AnimatePresence>
              
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
                  className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors rounded-xl focus:outline-none cursor-pointer"
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
                      className="absolute right-0 top-11 z-50 min-w-[170px] bg-[#101018] border border-white/10 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl"
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
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-2.5 focus:outline-none focus:bg-rose-500/10"
                      >
                        <Trash2 size={14} className="text-rose-400 shrink-0" />
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
          <div className="col-span-full py-16 px-6 text-center liquid-glass-card rounded-[2rem] border-dashed flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl mb-4 shadow-[0_0_30px_rgba(139,92,246,0.15)] select-none">
              🌱
            </div>
            <h3 className="text-white font-black uppercase tracking-[0.2em] text-xs mb-2">
              No Habits Established
            </h3>
            <p className="text-slate-400 text-xs max-w-[280px] mx-auto leading-relaxed mb-6">
              Create your daily habits to initiate your consistency protocol and start earning XP.
            </p>
            {onCreateClick && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onCreateClick}
                className="w-full max-w-[240px] py-3.5 bg-white hover:bg-slate-200 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 h-12"
              >
                <Plus size={15} strokeWidth={3} />
                <span>Create First Habit</span>
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
    <ConfirmationDialog
      isOpen={!!deleteConfirmationHabit}
      title="Delete Habit?"
      description={`Are you sure you want to delete "${deleteConfirmationHabit?.name || 'this habit'}"? All associated streak history will be permanently removed.`}
      cancelText="Cancel"
      confirmText="Delete"
      destructive={true}
      isLoading={isDeleting}
      onCancel={() => {
        if (!isDeleting) setDeleteConfirmationHabit(null);
      }}
      onConfirm={() => {
        if (deleteConfirmationHabit) handleConfirmDelete(deleteConfirmationHabit);
      }}
    />
    
    {/* Custom Undo Confirm Modal */}
    <ConfirmationDialog
      isOpen={confirmModal.isOpen}
      title={confirmModal.title}
      description="Undoing this completion will remove the XP earned for today."
      cancelText="Keep"
      confirmText="Undo"
      destructive={true}
      isLoading={isSubmittingModal}
      onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      onConfirm={async () => {
        setIsSubmittingModal(true);
        try {
          await confirmModal.action();
          setConfirmModal({ ...confirmModal, isOpen: false });
        } finally {
          setIsSubmittingModal(false);
        }
      }}
    />
    </>
  );
};
