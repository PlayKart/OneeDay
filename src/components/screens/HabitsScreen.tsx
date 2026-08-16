import { useStore } from "../../store/useStore";
import { HabitList } from "../HabitList";
import { useState } from "react";
import { CreateHabitModal } from "../CreateHabitModal";
import { Plus, Target } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function HabitsScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto min-h-screen relative space-y-6"
    >
      <header className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Habits</h1>
          <p className="text-slate-400 text-[10px] tracking-widest uppercase font-bold mt-0.5">
            Discipline Protocols & Routines
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-white hover:bg-slate-200 text-black font-extrabold px-4 sm:px-5 py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Habit</span>
        </button>
      </header>

      <section>
        <HabitList onCreateClick={() => setIsModalOpen(true)} />
      </section>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-[60] sm:hidden">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsModalOpen(true)}
          className="w-13 h-13 bg-white text-black rounded-2xl shadow-[0_8px_30px_rgba(255,255,255,0.25)] flex items-center justify-center border border-white/20 hover:bg-slate-200 transition-all cursor-pointer active:scale-95"
          title="Create New Habit"
        >
          <Plus size={22} strokeWidth={2.5} />
        </motion.button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreateHabitModal onClose={() => setIsModalOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
