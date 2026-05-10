import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";

export function TutorialOverlay() {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("oneday_tutorial");
    if (!hasSeen) {
      // Small delay so it feels like a sequence after loading
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("oneday_tutorial", "true");
      setIsVisible(false);
    }
  };

  const tutorialSteps = [
    {
      title: "Welcome to OneDay",
      text: "We believe in building discipline one day at a time. Let me show you how to use your new system.",
    },
    {
      title: "The Dashboard",
      text: "This is your command center. Check your daily tasks, view your streak, and get an AI-curated motivational quote.",
    },
    {
      title: "Habits System",
      text: "Go to the Habits tab to create your routines. You can set them for every day, weekdays, or completely custom schedules.",
    },
    {
      title: "AI Coach",
      text: "Your dedicated AI Coach is available 24/7. Use it to reflect on your progress, break down complex goals, or just get motivated.",
    },
    {
      title: "One Day At A Time",
      text: "The rules are simple. One day broke, don't let two. Let's get to work.",
    }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />
          <motion.div 
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl"
          >
            <div className="flex justify-center space-x-2 mb-4">
               {tutorialSteps.map((_, i) => (
                 <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-white' : 'bg-white/20'}`} />
               ))}
            </div>

            <h3 className="text-2xl font-black tracking-tight">{tutorialSteps[step].title}</h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              {tutorialSteps[step].text}
            </p>

            <button 
              onClick={handleNext}
              className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-sm tracking-tight active:scale-95"
            >
               {step === tutorialSteps.length - 1 ? (
                 <>
                   <Check size={18} /> Let's Go
                 </>
               ) : (
                 "Next"
               )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
