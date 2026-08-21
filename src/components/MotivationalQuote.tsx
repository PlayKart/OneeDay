import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";
import { useStore, apiRequest } from "../store/useStore";

const FALLBACK_MINDSETS = [
  "Discipline is the choice between what you want now and what you want most.",
  "Your potential is limitless when you stop negotiating with your excuses.",
  "The standard you walk past is the standard you accept.",
  "Focus on the process, not the outcome. The results will follow.",
  "Consistency beats intensity. Show up every single day.",
  "You do not rise to the level of your goals. You fall to the level of your systems."
];

export const MotivationalQuote = () => {
  const { user } = useStore();
  
  // Cache keys
  const CACHE_KEY_CURRENT = "oneday_mindset_current";
  const CACHE_KEY_PREVIOUS = "oneday_mindset_previous";
  const CACHE_KEY_REFRESH_TIME = "oneday_mindset_next_refresh";

  const getInitialMindset = () => {
    return localStorage.getItem(CACHE_KEY_CURRENT) || FALLBACK_MINDSETS[0];
  };

  const getInitialPrevious = () => {
    return localStorage.getItem(CACHE_KEY_PREVIOUS) || null;
  };

  const [currentMindset, setCurrentMindset] = useState<string>(getInitialMindset);
  const [previousMindset, setPreviousMindset] = useState<string | null>(getInitialPrevious);
  const [loading, setLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(600);

  // Use a ref for currentMindset to avoid stale closures in interval / async calls
  const currentMindsetRef = useRef(currentMindset);
  useEffect(() => {
    currentMindsetRef.current = currentMindset;
  }, [currentMindset]);

  const loadMindsetFromBackend = async (current: string): Promise<string> => {
    try {
      const data = await apiRequest("/api/mindset");
      let fetched = "";
      if (typeof data === "string") {
        fetched = data;
      } else if (data && typeof data === "object") {
        fetched = data.quote || data.mindset || data.text || data.content || data.message || "";
        if (!fetched) {
          const stringVal = Object.values(data).find(v => typeof v === "string");
          fetched = stringVal ? String(stringVal) : JSON.stringify(data);
        }
      }
      fetched = fetched.trim();
      
      if (!fetched) {
        throw new Error("Empty backend mindset");
      }
      
      // Ensure we never repeat the same mindset twice in a row
      if (fetched === current) {
        const filteredFallbacks = FALLBACK_MINDSETS.filter(m => m !== current);
        return filteredFallbacks[Math.floor(Math.random() * filteredFallbacks.length)];
      }

      return fetched;
    } catch (err) {
      console.error("Error fetching mindset from backend:", err);
      throw err;
    }
  };

  const triggerRefresh = async () => {
    setLoading(true);
    const prev = currentMindsetRef.current;

    try {
      const newMindset = await loadMindsetFromBackend(prev);
      
      localStorage.setItem(CACHE_KEY_PREVIOUS, prev);
      localStorage.setItem(CACHE_KEY_CURRENT, newMindset);
      setPreviousMindset(prev);
      setCurrentMindset(newMindset);
      
      const nextRefresh = Date.now() + 10 * 60 * 1000;
      localStorage.setItem(CACHE_KEY_REFRESH_TIME, nextRefresh.toString());
      setTimeLeft(600);
    } catch (err) {
      // Backend unavailable or error: Keep showing the previous (current) mindset
      console.warn("Backend unavailable, keeping current mindset as fallback");
      const nextRefresh = Date.now() + 10 * 60 * 1000;
      localStorage.setItem(CACHE_KEY_REFRESH_TIME, nextRefresh.toString());
      setTimeLeft(600);
    } finally {
      setLoading(false);
    }
  };

  // Setup the Timer and interval
  useEffect(() => {
    const nextRefreshStr = localStorage.getItem(CACHE_KEY_REFRESH_TIME);
    let initialTimeLeft = 600;

    if (nextRefreshStr) {
      const nextTime = parseInt(nextRefreshStr);
      if (!isNaN(nextTime)) {
        const diff = Math.round((nextTime - Date.now()) / 1000);
        if (diff > 0 && diff <= 600) {
          initialTimeLeft = diff;
        } else {
          // If past or invalid, trigger a refresh immediately
          triggerRefresh();
        }
      }
    } else {
      // First run, set refresh time and start countdown
      const nextRefresh = Date.now() + 10 * 60 * 1000;
      localStorage.setItem(CACHE_KEY_REFRESH_TIME, nextRefresh.toString());
    }

    setTimeLeft(initialTimeLeft);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Trigger refresh when timer hits 0
          triggerRefresh();
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!user) return null;

  return (
    <div id="mindset-component-wrapper" className="relative z-10 w-full my-1 sm:my-4">
      <div className="relative overflow-hidden bg-black text-white rounded-2xl border border-white/10 p-5 sm:p-8 shadow-2xl">
        {/* Subtle decorative glow in background */}
        <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent_65%)] pointer-events-none" />
        
        {/* Small label & Timer Row */}
        <div className="relative z-10 flex flex-row items-center justify-between mb-4 sm:mb-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500 select-none">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-zinc-400 animate-pulse" />
            <span className="text-[9px] text-zinc-400 tracking-[0.2em] font-extrabold">AI Mindset</span>
          </div>
          <div className="font-mono text-[8px] text-zinc-500 tracking-wider">
            Next in <span className="text-zinc-400 font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Mindset Content (large typography, visual focus) */}
        <div className="relative z-10 min-h-[60px] sm:min-h-[100px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="shimmer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 animate-pulse"
              >
                <div className="h-5 bg-zinc-900 rounded-md w-5/6" />
                <div className="h-5 bg-zinc-900 rounded-md w-2/3" />
                <div className="h-2.5 bg-zinc-900/50 rounded-md w-1/4 mt-4" />
              </motion.div>
            ) : (
              <motion.div
                key={currentMindset}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-sm sm:text-lg md:text-xl font-medium tracking-tight leading-relaxed text-zinc-200 font-sans">
                  "{currentMindset}"
                </h2>
                <div className="mt-4 sm:mt-6 flex items-center gap-3 text-[8px] text-zinc-500 font-bold tracking-[0.2em] uppercase select-none">
                  <span>Protocol OneDay.v1</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-800" />
                  <span>Mindset Feed</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
