import { AICoach } from "../AICoach";
import { motion } from "motion/react";

export function CoachScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full min-h-0 flex flex-col bg-black text-white"
    >
      <AICoach />
    </motion.div>
  );
}

