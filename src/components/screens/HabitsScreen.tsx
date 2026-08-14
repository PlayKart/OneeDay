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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 max-w-4xl mx-auto min-h-screen relative"
    >
      <header className="flex justify-between items-center pt-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter">Habits</h1>
          <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold mt-1">
            Build your system
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-white text-black font-bold px-5 py-2.5 rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
        >
          <Plus size={16} />
          <span>New Habit</span>
        </button>
      </header>

      <section className="mt-8">
        <HabitList onCreateClick={() => setIsModalOpen(true)} />
      </section>

      {/* Mobile Reachable Floating Action Button */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-6 z-40 sm:hidden">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-white text-black rounded-full shadow-[0_8px_30px_rgba(255,255,255,0.25)] flex items-center justify-center border border-white/20 hover:bg-slate-200 transition-all cursor-pointer active:scale-95"
          title="Create New Habit"
        >
          <Plus size={24} strokeWidth={2.5} />
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
