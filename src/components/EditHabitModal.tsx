import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { X, Calendar, Flag, AlignLeft, Check, Trash } from "lucide-react";
import { useStore, Habit } from "../store/useStore";
import { toCanonicalDifficulty, toDisplayDifficulty } from "../utils";
import { HabitIconPicker } from "./HabitIconPicker";
import { toast } from "react-hot-toast";

interface EditHabitModalProps {
  habit: Habit;
  onClose: () => void;
}

export function EditHabitModal({ habit, onClose }: EditHabitModalProps) {
  const { editHabit, deleteHabit, refreshFromBackend } = useStore();
  const [name, setName] = useState(habit.name || "");
  const [repeatType, setRepeatType] = useState<"every_day" | "weekdays" | "weekends" | "custom_days">(habit.repeatType || "every_day");
  const [customDays, setCustomDays] = useState<string[]>(() => {
    return Array.isArray(habit.customDays) ? habit.customDays : [];
  });
  const [difficulty, setDifficulty] = useState(toDisplayDifficulty(habit.difficulty));
  const [notes, setNotes] = useState(habit.notes || "");
  const [selectedIcon, setSelectedIcon] = useState(habit.icon || "dumbbell");
  const [selectedColor, setSelectedColor] = useState(habit.category || "emerald");
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

  const handleSave = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isDeleting) return;

    // Validate fields
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Please enter a habit name.");
      return;
    }

    if (repeatType === "custom_days" && (!customDays || customDays.length === 0)) {
      toast.error("Please select at least one day for custom schedule.");
      return;
    }

    const payload = {
      name: trimmedName,
      repeatType,
      customDays: repeatType === "custom_days" ? customDays : [],
      difficulty: toCanonicalDifficulty(difficulty),
      notes: notes.trim(),
      icon: selectedIcon,
      category: selectedColor
    };

    console.log("Update Habit Request Payload:", payload);
    setIsSubmitting(true);

    try {
      await editHabit(habit.id, payload);
      await refreshFromBackend();
      toast.success("Habit updated successfully!");
      onClose();
    } catch (err: any) {
      console.error("Failed to update habit:", err);
      const errorMessage = err?.response?.data?.error 
        || err?.response?.data?.message 
        || err?.message 
        || "Failed to update habit";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this habit?")) {
      setIsDeleting(true);
      try {
        await deleteHabit(habit.id);
        await refreshFromBackend();
        toast.success("Habit deleted successfully!");
        onClose();
      } catch (err: any) {
        console.error("Failed to delete habit:", err);
        const errorMessage = err?.response?.data?.error 
          || err?.response?.data?.message 
          || err?.message 
          || "Failed to delete habit";
        toast.error(errorMessage);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const content = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.form
        onSubmit={handleSave}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl flex flex-col max-h-[85dvh]"
      >
        {/* Native sheet drag handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 block sm:hidden shrink-0" />

        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold tracking-tighter">Edit Habit</h2>
          <div className="flex gap-2">
            <button type="button" onClick={handleDelete} disabled={isDeleting} className="p-2 bg-red-500/10 rounded-full hover:bg-red-500/20 text-red-500 transition-colors disabled:opacity-50">
              <Trash size={20} />
            </button>
            <button type="button" onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto space-y-6 pb-8 scrollbar-hide flex-1">
           {/* Name */}
           <div>
             <input 
               type="text" 
               placeholder="What do you want to build?"
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full bg-transparent border-b border-white/10 p-2 text-2xl font-bold text-white focus:outline-none focus:border-white/40 placeholder-slate-600 transition-colors"
               autoFocus
             />
           </div>

           {/* Habitify Icon & Color Picker */}
           <HabitIconPicker
             selectedIcon={selectedIcon}
             selectedColor={selectedColor}
             onSelectIcon={setSelectedIcon}
             onSelectColor={setSelectedColor}
           />

           {/* Repeat Schedule */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 text-slate-400">
               <Calendar size={16} />
               <span className="text-[10px] uppercase tracking-widest font-bold">Repeat</span>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
               {(["every_day", "weekdays", "weekends", "custom_days"] as const).map(type => (
                 <button
                   type="button"
                   key={type}
                   onClick={() => setRepeatType(type)}
                   className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                     repeatType === type
                       ? 'bg-white text-black border-white'
                       : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                   }`}
                 >
                   {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                 </button>
               ))}
             </div>

             {repeatType === "custom_days" && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: "auto" }}
                 className="flex justify-between gap-2 pt-2"
               >
                 {daysOfWeek.map(({ id, label }) => {
                   const isSelected = customDays.includes(id);
                   return (
                     <button
                       type="button"
                       key={id}
                       onClick={() => handleToggleDay(id)}
                       className={`flex-1 aspect-square rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                         isSelected 
                           ? 'bg-white text-black border-white' 
                           : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                       }`}
                     >
                       {label}
                     </button>
                   );
                 })}
               </motion.div>
             )}
           </div>

           {/* Difficulty level */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 text-slate-400">
               <Flag size={16} />
               <span className="text-[10px] uppercase tracking-widest font-bold">Difficulty</span>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { level: "Easy", xp: "+20 XP", dot: "🟢", badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
                  { level: "Medium", xp: "+40 XP", dot: "🔵", badgeBg: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
                  { level: "Hard", xp: "+60 XP", dot: "🟠", badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
                  { level: "Elite", xp: "+80 XP", dot: "🔴", badgeBg: "bg-red-500/10 border-red-500/30 text-red-400" },
                ].map(({ level, xp, dot, badgeBg }) => {
                  const isSelected = difficulty === level;
                  return (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-white/15 text-white border-white/40 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span>{dot}</span>
                        <span>{level}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeBg}`}>
                        {xp}
                      </span>
                    </button>
                  );
                })}
             </div>
           </div>

           {/* Notes */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 text-slate-400">
               <AlignLeft size={16} />
               <span className="text-[10px] uppercase tracking-widest font-bold">Notes</span>
             </div>
             <textarea 
               placeholder="Why are you doing this?"
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               rows={3}
               className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder-slate-600 resize-none transition-colors"
             />
           </div>
        </div>

        <div className="mt-4 shrink-0 pt-4 border-t border-white/10 pb-8 sm:pb-0">
          <button 
            type="submit"
            onClick={handleSave}
            disabled={isSubmitting || isDeleting}
            className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
             ) : (
                <>
                  <Check size={20} />
                  <span>Save</span>
                </>
             )}
          </button>
        </div>
      </motion.form>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
