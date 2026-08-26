// src/components/coach/CoachMessageActions.tsx

import React, { useState, useCallback } from "react";
import { Copy, Check, RotateCcw, Loader2 } from "lucide-react";
import { ChatMessage } from "../../types";

interface CoachMessageActionsProps {
  message: ChatMessage;
  onRegenerate?: (messageId: string) => void;
  disabled?: boolean;
}

export const CoachMessageActions: React.FC<CoachMessageActionsProps> = ({
  message,
  onRegenerate,
  disabled = false,
}) => {
  const [copied, setCopied] = useState(false);
  const isRegenerating = Boolean(message.isRegenerating);
  const errorMessage = message.error;

  const handleCopy = useCallback(async () => {
    if (!message.content || copied) return;

    // Clean leading error marker if present
    const textToCopy = message.content.replace(/^⚠️\s*/, "").trim();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy text:", err);
    }
  }, [message.content, copied]);

  const handleRegenerate = useCallback(() => {
    if (disabled || isRegenerating || !onRegenerate) return;
    onRegenerate(message.id);
  }, [disabled, isRegenerating, onRegenerate, message.id]);

  return (
    <div
      id={`message-actions-${message.id}`}
      className="flex items-center gap-1 mt-1.5 pt-0.5 select-none"
    >
      {/* COPY BUTTON */}
      <button
        type="button"
        onClick={handleCopy}
        disabled={isRegenerating}
        aria-label={copied ? "Copied to clipboard" : "Copy response"}
        title={copied ? "Copied" : "Copy"}
        className={`group relative flex items-center justify-center p-2 sm:p-1.5 rounded-md min-w-[36px] min-h-[36px] sm:min-w-[28px] sm:min-h-[28px] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
          copied ? "text-emerald-400 hover:text-emerald-300" : ""
        } ${isRegenerating ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        {copied ? (
          <Check size={14} className="stroke-[2.2] text-emerald-400 animate-in zoom-in-50 duration-150" />
        ) : (
          <Copy size={14} className="stroke-[1.8]" />
        )}
      </button>

      {/* REGENERATE BUTTON */}
      {onRegenerate && (
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={disabled || isRegenerating}
          aria-label={isRegenerating ? "Regenerating response..." : "Regenerate response"}
          title={isRegenerating ? "Regenerating..." : "Regenerate"}
          className={`group relative flex items-center justify-center p-2 sm:p-1.5 rounded-md min-w-[36px] min-h-[36px] sm:min-w-[28px] sm:min-h-[28px] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
            isRegenerating ? "cursor-not-allowed opacity-70 text-zinc-300" : ""
          } ${disabled && !isRegenerating ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {isRegenerating ? (
            <Loader2 size={14} className="animate-spin text-zinc-300 stroke-[2]" />
          ) : (
            <RotateCcw size={14} className="stroke-[1.8] group-hover:-rotate-45 transition-transform duration-200" />
          )}
        </button>
      )}

      {/* Subtle inline non-blocking regeneration error retry notice */}
      {errorMessage && !isRegenerating && (
        <span className="ml-2 text-[11px] text-rose-400/90 font-medium flex items-center gap-1.5">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={handleRegenerate}
            className="underline underline-offset-2 hover:text-rose-200 text-[11px] cursor-pointer"
          >
            Retry
          </button>
        </span>
      )}
    </div>
  );
};
export default CoachMessageActions;
