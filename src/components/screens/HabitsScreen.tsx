import { useStore } from "../../store/useStore";
import { HabitList } from "../HabitList";
import { useState } from "react";
import { CreateHabitModal } from "../CreateHabitModal";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function HabitsScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 md:p-8 max-w-4xl mx-auto relative"
    >
      <header className="flex justify-between items-center pt-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-light tracking-tight text-white">Habits</h1>
          <p className="text-slate-500 text-[9px] tracking-[0.25em] uppercase font-bold mt-1">
            Build your system
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-200 text-black font-extrabold px-5 py-2.5 rounded-xl hover:bg-white transition-all text-[9px] uppercase tracking-widest cursor-pointer shadow-lg shadow-white/5 active:scale-95"
        >
          <Plus size={14} />
          <span>New Habit</span>
        </button>
      </header>

      <section className="mt-8">
        <HabitList />
      </section>

      <AnimatePresence>
        {isModalOpen && (
          <CreateHabitModal onClose={() => setIsModalOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
