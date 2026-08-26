// src/components/coach/CoachComposer.tsx

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Habit } from "../../types";
import { getFollowUpChips } from "../../utils/coachUtils";

interface CoachComposerProps {
  onSendMessage: (text: string) => Promise<void>;
  loading: boolean;
  habits: Habit[];
  hasMessages: boolean;
}

export const CoachComposer: React.FC<CoachComposerProps> = ({
  onSendMessage,
  loading,
  habits,
  hasMessages,
}) => {
  const [inputText, setInputText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chips = getFollowUpChips(habits);

  // Auto-resize textarea based on scrollHeight
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      // Cap at ~150px
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [inputText]);

  const handleSubmit = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || loading) return;

    // Clear input optimistically
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await onSendMessage(trimmed);
    } catch (e) {
      // Restore input text on unexpected failure
      setInputText(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = async (promptText: string) => {
    if (loading) return;
    try {
      await onSendMessage(promptText);
    } catch (e) {
      console.warn("Follow-up chip send failed:", e);
    }
  };

  const canSend = inputText.trim().length > 0 && !loading;

  return (
    <div className="w-full shrink-0 border-t border-white/[0.08] bg-[#070709]/95 backdrop-blur-xl pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 select-none">
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        {/* Context-aware follow-up chips (shown when active conversation has messages) */}
        <AnimatePresence>
          {hasMessages && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide py-0.5"
            >
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono uppercase shrink-0 pl-0.5">
                <Sparkles size={11} className="text-slate-400" />
                <span>Next:</span>
              </div>
              {chips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleChipClick(chip.text)}
                  className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/20 text-[11px] font-medium text-slate-300 hover:text-white transition-all whitespace-nowrap shrink-0 active:scale-95 cursor-pointer shadow-xs"
                >
                  {chip.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar Card */}
        <div className="relative flex items-end gap-2 bg-[#121216] border border-white/[0.12] focus-within:border-white/30 rounded-2xl p-1.5 sm:p-2 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
            placeholder="Message your OneDay Coach..."
            className="flex-1 bg-transparent text-white text-xs sm:text-[13px] placeholder:text-slate-500 focus:outline-none resize-none py-1.5 px-2 max-h-36 leading-relaxed disabled:opacity-50 select-text"
          />

          {/* Send Button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!canSend}
            whileTap={{ scale: 0.92 }}
            className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              canSend
                ? "bg-white text-black shadow-[0_2px_10px_rgba(255,255,255,0.2)] hover:bg-zinc-200"
                : "bg-white/[0.05] text-slate-600 border border-white/[0.05] cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin text-slate-400" />
            ) : (
              <ArrowUp size={16} strokeWidth={2.5} />
            )}
          </motion.button>
        </div>

        {/* Footer Disclaimer */}
        <div className="flex items-center justify-between px-1.5 pt-1.5 text-[9px] sm:text-[10px] text-slate-500 font-medium">
          <span>Enter to send, Shift+Enter for new line</span>
          <span className="font-mono text-slate-400">OneDay Coach v2.5</span>
        </div>
      </div>
    </div>
  );
};
