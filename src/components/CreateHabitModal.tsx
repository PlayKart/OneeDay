import { useState } from "react";
import { motion } from "motion/react";
import { X, Calendar, Flag, Bell, AlignLeft, Check } from "lucide-react";
import { useStore } from "../store/useStore";

interface CreateHabitModalProps {
  onClose: () => void;
}

export function CreateHabitModal({ onClose }: CreateHabitModalProps) {
  const { addHabit } = useStore();
  const [name, setName] = useState("");
  const [repeatType, setRepeatType] = useState<"every_day" | "weekdays" | "weekends" | "custom_days">("every_day");
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("Medium");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await addHabit({
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold tracking-tighter">New Habit</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto space-y-8 pb-8 scrollbar-hide flex-1">
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

           {/* Repeat Schedule */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 text-slate-400">
               <Calendar size={16} />
               <span className="text-[10px] uppercase tracking-widest font-bold">Repeat</span>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
               {(["every_day", "weekdays", "weekends", "custom_days"] as const).map(type => (
                 <button
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
             <div className="flex gap-2">
                {["Easy", "Medium", "Hard", "Elite"].map(level => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                      difficulty === level
                        ? 'bg-white/10 text-white border-white/30'
                        : 'bg-transparent border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-400'
                    }`}
                  >
                    {level}
                  </button>
                ))}
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

        <div className="mt-4 shrink-0 pt-4 border-t border-white/10">
          <button 
            disabled={!name.trim() || isSubmitting || (repeatType === 'custom_days' && customDays.length === 0)}
            onClick={handleSave}
            className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
             ) : (
                <>
                  <Check size={20} />
                  <span>Save System</span>
                </>
             )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
