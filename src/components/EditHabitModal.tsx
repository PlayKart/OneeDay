import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { X, Calendar, Flag, AlignLeft, Check, Trash, Sparkles } from "lucide-react";
import { useStore, Habit } from "../store/useStore";

interface EditHabitModalProps {
  habit: Habit;
  onClose: () => void;
}

export function EditHabitModal({ habit, onClose }: EditHabitModalProps) {
  const { editHabit, deleteHabit } = useStore();
  const [name, setName] = useState(habit.name || "");
  const [repeatType, setRepeatType] = useState<"every_day" | "weekdays" | "weekends" | "custom_days">(habit.repeatType || "every_day");
  const [customDays, setCustomDays] = useState<string[]>(habit.customDays || []);
  const [difficulty, setDifficulty] = useState(habit.difficulty || "Medium");
  const [notes, setNotes] = useState(habit.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const daysOfWeek = [
    { id: "Mon", label: "M" },
    { id: "Tue", label: "T" },
    { id: "Wed", label: "W" },
    { id: "Thu", label: "T" },
    { id: "Fri", label: "F" },
    { id: "Sat", label: "S" },
    { id: "Sun", label: "S" }
  ];

  const handleToggleDay = (day: string) => {
    setCustomDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await editHabit(habit.id, {
        name: name.trim(),
        repeatType,
        customDays: repeatType === "custom_days" ? customDays : [],
        difficulty,
        notes
      });
      onClose();
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this habit?")) {
      setIsDeleting(true);
      try {
        await deleteHabit(habit.id);
        onClose();
      } catch (e) {
        console.error(e);
        setIsDeleting(false);
      }
    }
  };

  const content = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="relative w-full max-w-lg bg-[#0c0c12] border border-white/[0.08] rounded-t-[2.25rem] sm:rounded-[2.25rem] p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col max-h-[85dvh] overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-violet-400 animate-pulse" />
            <h2 className="text-xl font-display font-light text-white">Edit Habit</h2>
          </div>
          <div className="flex gap-1.5">
            <button 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="p-2 bg-red-500/10 border border-red-500/20 rounded-full hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
            >
              <Trash size={15} />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 bg-white/[0.03] border border-white/5 rounded-full hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Form Body Scroll area */}
        <div className="overflow-y-auto space-y-7 pb-8 scrollbar-hide flex-1 relative z-10">
           {/* Text Entry Input */}
           <div className="pt-2">
             <input 
               type="text" 
               placeholder="What habit will you master?"
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full bg-transparent border-b border-white/5 p-2 text-xl font-display font-light text-slate-100 focus:outline-none focus:border-violet-500/40 placeholder-slate-600 transition-colors"
               autoFocus
             />
           </div>

           {/* Schedule Configuration */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 text-slate-500">
               <Calendar size={13} />
               <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold">Repeat Schedule</span>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
               {(["every_day", "weekdays", "weekends", "custom_days"] as const).map(type => (
                 <button
                   key={type}
                   type="button"
                   onClick={() => setRepeatType(type)}
                   className={`py-3.5 px-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                     repeatType === type
                       ? 'bg-violet-500/10 text-violet-300 border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                       : 'bg-white/[0.01] border-white/5 text-slate-500 hover:bg-white/[0.04] hover:border-white/10 hover:text-slate-300'
                   }`}
                 >
                   {type.split('_').join(' ')}
                 </button>
               ))}
             </div>

             {repeatType === "custom_days" && (
               <motion.div 
                 initial={{ opacity: 0, y: -5 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="flex justify-between gap-1.5 pt-2"
               >
                 {daysOfWeek.map(({ id, label }) => {
                   const isSelected = customDays.includes(id);
                   return (
                     <button
                       key={id}
                       type="button"
                       onClick={() => handleToggleDay(id)}
                       className={`flex-1 aspect-square rounded-full flex items-center justify-center text-[10px] font-extrabold border transition-all duration-300 cursor-pointer ${
                         isSelected 
                           ? 'bg-violet-400 text-black border-violet-400 shadow-md shadow-violet-500/20' 
                           : 'bg-white/[0.01] border-white/5 text-slate-500 hover:bg-white/[0.04] hover:border-white/10 hover:text-slate-300'
                       }`}
                     >
                       {label}
                     </button>
                   );
                 })}
               </motion.div>
             )}
           </div>

           {/* Difficulty Slider / Choice */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 text-slate-500">
               <Flag size={13} />
               <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold">Discipline Difficulty</span>
             </div>
             <div className="flex gap-2">
                {["Easy", "Medium", "Hard", "Elite"].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`flex-1 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      difficulty === level
                        ? 'bg-violet-500/10 text-violet-300 border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                        : 'bg-white/[0.01] border-white/5 text-slate-500 hover:bg-white/[0.04] hover:border-white/10 hover:text-slate-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
             </div>
           </div>

           {/* Notes text area */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 text-slate-500">
               <AlignLeft size={13} />
               <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold">Directive Notes</span>
             </div>
             <textarea 
               placeholder="Why is this habit a non-negotiable standard?"
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               rows={2}
               className="w-full bg-white/[0.01] border border-white/5 rounded-2xl p-4 text-xs text-slate-200 focus:outline-none focus:border-violet-500/20 placeholder-slate-600 resize-none transition-colors"
             />
           </div>
        </div>

        {/* Footer trigger button */}
        <div className="mt-4 shrink-0 pt-4 border-t border-white/[0.04] pb-6 sm:pb-0 relative z-10">
          <button 
            disabled={!name.trim() || isSubmitting || isDeleting || (repeatType === 'custom_days' && customDays.length === 0)}
            onClick={handleSave}
            className="w-full bg-slate-200 text-black font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-white/5"
          >
             {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
             ) : (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  <span className="text-xs uppercase tracking-widest">Update Habit</span>
                </>
             )}
          </button>
        </div>
      </motion.div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
