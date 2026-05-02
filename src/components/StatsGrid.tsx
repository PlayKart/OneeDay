import { motion } from 'motion/react';
import { Flame, Snowflake, Award, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

export const StatsGrid = () => {
  const { user } = useStore();
  if (!user) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
            <Flame size={20} />
          </div>
          <span className="text-slate-400 text-sm font-medium">Streak</span>
        </div>
        <div className="text-3xl font-display font-bold text-slate-100">
          {user.streak} <span className="text-xs text-slate-500 uppercase tracking-widest">days</span>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Flame size={60} className="text-orange-500" />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-4 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
            <Snowflake size={20} />
          </div>
          <span className="text-slate-400 text-sm font-medium">Freeze</span>
        </div>
        <div className="text-xl font-display font-bold text-slate-100">
          {user.freeze_until ? (
            <span className="text-blue-400">Active</span>
          ) : (
            <span className="text-slate-500">Stored (0)</span>
          )}
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Snowflake size={60} className="text-blue-500" />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-4 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500">
            <Zap size={20} />
          </div>
          <span className="text-slate-400 text-sm font-medium">Level</span>
        </div>
        <div className="text-3xl font-display font-bold text-slate-100">
          {user.level}
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${user.levelProgress}%` }}
            className="h-full bg-yellow-500"
          />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-4 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
            <Award size={20} />
          </div>
          <span className="text-slate-400 text-sm font-medium">total xp</span>
        </div>
        <div className="text-3xl font-display font-bold text-slate-100">
          {user.xp} <span className="text-xs text-slate-500 uppercase tracking-widest">xp</span>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Award size={60} className="text-purple-500" />
        </div>
      </motion.div>
    </div>
  );
};
