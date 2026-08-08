import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { X, Calendar, Flag, AlignLeft, Check } from "lucide-react";
import { useStore } from "../store/useStore";
import { toCanonicalDifficulty } from "../utils";
import { HabitIconPicker } from "./HabitIconPicker";
import { toast } from "react-hot-toast";

interface CreateHabitModalProps {
  onClose: () => void;
}

export function CreateHabitModal({ onClose }: CreateHabitModalProps) {
  const { addHabit, refreshFromBackend } = useStore();
  const [name, setName] = useState("");
  const [repeatType, setRepeatType] = useState<"every_day" | "weekdays" | "weekends" | "custom_days">("every_day");
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("Medium");
  const [notes, setNotes] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("dumbbell");
  const [selectedColor, setSelectedColor] = useState("emerald");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (isSubmitting) return;

    // Requirement 2: Validate all required fields before submitting
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

    // Requirement 3: Log the request payload before sending
    console.log("Create Habit Request Payload:", payload);

    // Requirement 5: Show loading state
    setIsSubmitting(true);

    try {
      // Requirement 4 & 10: Call backend endpoint via store
      await addHabit(payload);

      // Requirement 8: Refresh habits list after successful save
      await refreshFromBackend();

      // Requirement 6: Success toast notification
      toast.success("Habit saved successfully!");

      // Requirement 9: Close modal only after successful response
      onClose();
    } catch (err: any) {
      console.error("Failed to create habit:", err);
      // Requirement 7: Display exact backend error message
      const errorMessage = err?.response?.data?.error 
        || err?.response?.data?.message 
        || err?.message 
        || "Failed to create habit";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[85dvh]"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold tracking-tighter">New Habit</h2>
          <button type="button" onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
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
          {/* Requirement 1: Verify Save button's onClick calls handleSave */}
          <button 
            type="submit"
            onClick={handleSave}
            disabled={isSubmitting}
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
                  <span>Save System</span>
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
