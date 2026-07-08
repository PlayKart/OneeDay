import { AICoach } from "../AICoach";
import { motion } from "motion/react";

export function CoachScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full bg-black text-white"
    >
      <AICoach />
    </motion.div>
  );
}

