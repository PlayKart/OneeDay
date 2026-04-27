import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export const HabitList = () => {
  const { habits, completeHabit, addHabit, loading } = useStore();
  const [newHabitName, setNewHabitName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    await addHabit(newHabitName);
    setNewHabitName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Today's Habits</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Consistency is key</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/10"
        >
          + New Habit
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAdd}
            className="glass p-6 mb-6 overflow-hidden bg-white/[0.02]"
          >
            <input 
              autoFocus
              placeholder="What's the mission?"
              className="w-full bg-transparent border-none outline-none text-lg font-bold text-white placeholder:text-slate-600 mb-6"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
            />
            <div className="flex justify-end gap-3 font-bold text-xs uppercase tracking-widest">
              <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-slate-300">Cancel</button>
              <button type="submit" className="text-blue-400 hover:text-blue-300">Deploy Habit</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map((habit) => (
          <motion.div 
            layout
            key={habit.id}
            className={`glass p-5 flex items-center justify-between group transition-all duration-300 ${habit.completedToday ? 'bg-green-500/5 border-green-500/20' : 'hover:bg-white/5'}`}
          >
            <div className="flex flex-col gap-1">
              <h4 className={`font-bold transition-all ${habit.completedToday ? 'text-slate-500 line-through' : 'text-white'}`}>
                {habit.name}
              </h4>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${habit.completedToday ? 'text-green-500' : 'text-slate-600'}`}>
                {habit.completedToday ? '+10 XP Earned' : 'Available for +10 XP'}
              </p>
            </div>
            
            <button 
              onClick={() => !habit.completedToday && completeHabit(habit.id)}
              disabled={habit.completedToday || loading}
              className={`habit-btn ${habit.completedToday ? 'active' : ''}`}
            >
              <Check size={20} className={habit.completedToday ? 'text-white' : 'text-transparent group-hover:text-slate-600'} />
            </button>
          </motion.div>
        ))}

        {habits.length === 0 && !isAdding && (
          <div className="col-span-full py-16 text-center">
            <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px]">No active missions.</p>
          </div>
        )}
      </div>
    </div>
  );
};
