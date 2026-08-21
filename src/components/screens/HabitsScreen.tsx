import { useStore } from "../../store/useStore";
import { HabitList } from "../HabitList";
import { useState, lazy, Suspense } from "react";
import { Plus, ListFilter, BarChart3, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const HabitTrendsView = lazy(() =>
  import("../HabitTrendsView").then((m) => ({ default: m.HabitTrendsView }))
);

const CreateHabitModal = lazy(() =>
  import("../CreateHabitModal").then((m) => ({ default: m.CreateHabitModal }))
);

export function HabitsScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"list" | "trends">("list");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 max-w-5xl mx-auto min-h-screen relative space-y-6"
    >
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter">Habits</h1>
          <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold mt-1">
            Build your system
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* SubTab Toggle */}
          <div className="flex items-center bg-white/[0.04] border border-white/10 p-1 rounded-2xl">
            <button
              onClick={() => setActiveSubTab("list")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "list"
                  ? "bg-white text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ListFilter size={14} />
              <span>List</span>
            </button>
            <button
              onClick={() => setActiveSubTab("trends")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "trends"
                  ? "bg-white text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 size={14} />
              <span>30-Day Trends</span>
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white text-black font-bold px-4 py-2 rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest shrink-0 ml-auto sm:ml-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Habit</span>
          </button>
        </div>
      </header>

      {activeSubTab === "list" ? (
        <section className="mt-4">
          <HabitList onCreateClick={() => setIsModalOpen(true)} />
        </section>
      ) : (
        <section className="mt-4">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-slate-500">
                <Loader2 size={24} className="animate-spin text-white/40" />
              </div>
            }
          >
            <HabitTrendsView />
          </Suspense>
        </section>
      )}

      {/* Mobile Reachable Floating Action Button */}
      <div className="fixed bottom-[calc(7.2rem+env(safe-area-inset-bottom))] right-6 z-[60] sm:hidden">
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
          <Suspense fallback={null}>
            <CreateHabitModal onClose={() => setIsModalOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default HabitsScreen;


