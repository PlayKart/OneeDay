// src/components/coach/CoachMessageItem.tsx

import React, { useState } from "react";
import Markdown from "react-markdown";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ChatMessage } from "../../types";
import { AICoachAvatar } from "../AICoachIcon";
import { CoachMessageActions } from "./CoachMessageActions";

interface CoachMessageItemProps {
  message: ChatMessage;
  isLast: boolean;
  onRegenerate?: (messageId: string) => void;
  onEditAndResend?: (messageId: string, newContent: string) => void;
}

export const CoachMessageItem: React.FC<CoachMessageItemProps> = ({
  message,
  onRegenerate,
  onEditAndResend,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const isUser = message.role === "user";
  const isError = !isUser && (message.content.startsWith("⚠️") || (message.content.includes("error") && message.content.length < 120));

  const handleSaveEdit = () => {
    if (editText.trim() && onEditAndResend) {
      onEditAndResend(message.id, editText.trim());
      setIsEditing(false);
    }
  };

  // ── USER MESSAGE (No timestamps, clean bubble, no Copy/Regenerate actions) ──
  if (isUser) {
    return (
      <div className="flex flex-col items-end w-full max-w-3xl mx-auto px-2 sm:px-4 py-2 group select-text">
        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-zinc-500 font-mono">
          <span>You</span>
        </div>

        {isEditing ? (
          <div className="w-full max-w-lg bg-[#181820] border border-white/20 rounded-2xl p-3 shadow-xl">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white resize-none min-h-[70px]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3 py-1 rounded-lg text-xs font-bold text-black bg-white hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
              >
                Save & Resend
              </button>
            </div>
          </div>
        ) : (
          <div className="relative max-w-[88%] sm:max-w-[78%]">
            <div className="p-3 sm:p-3.5 rounded-2xl rounded-tr-xs bg-[#1a1a22] border border-white/[0.12] text-white text-xs sm:text-[13px] leading-relaxed shadow-[0_4px_16px_rgba(0,0,0,0.4)] break-words [overflow-wrap:anywhere]">
              {message.content}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── ASSISTANT MESSAGE (No timestamps, Markdown content, Action Row directly underneath) ──
  return (
    <div className="flex items-start gap-2.5 sm:gap-3.5 w-full max-w-3xl mx-auto px-2 sm:px-4 py-2.5 group select-text">
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        <AICoachAvatar size="md" active={!isError} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header line - Clean, no visible timestamp */}
        <div className="flex items-center gap-2 mb-1.5 px-0.5">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300 font-mono">
            OneDay Coach
          </span>
        </div>

        {/* Message Body or Error State */}
        {isError ? (
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-200 text-xs shadow-lg flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-rose-100 mb-0.5">
                  Protocol Generation Interrupted
                </p>
                <p className="text-[11px] text-rose-300/80 leading-relaxed">
                  {message.content.replace(/^⚠️\s*/, "")}
                </p>
              </div>
            </div>

            {onRegenerate && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onRegenerate(message.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Retry Protocol</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="p-3.5 sm:p-4 rounded-2xl rounded-tl-xs bg-[#111116] border border-white/[0.08] text-slate-200 text-xs sm:text-[13px] leading-relaxed shadow-[0_4px_24px_rgba(0,0,0,0.5)] break-words [overflow-wrap:anywhere]">
              <div className="markdown-content space-y-3">
                <Markdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-sm font-black uppercase tracking-[0.16em] text-white pt-2 pb-1 border-b border-white/10 font-mono">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xs font-black uppercase tracking-[0.14em] text-zinc-100 pt-2 pb-0.5 font-mono">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pt-1">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="leading-relaxed text-slate-200 my-1.5">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-white tracking-tight">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-1.5 my-2 pl-4 list-disc marker:text-slate-400">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="space-y-1.5 my-2 pl-4 list-decimal marker:text-slate-400 marker:font-mono">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed pl-1">{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-white/20 pl-3 my-2 italic text-slate-400 bg-white/[0.02] py-1 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-black/60 text-zinc-300 px-1.5 py-0.5 rounded-md border border-white/10 font-mono text-[11px]">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {message.content}
                </Markdown>
              </div>
            </div>

            {/* MESSAGE ACTION ROW DIRECTLY UNDERNEATH COACH RESPONSE */}
            <CoachMessageActions
              message={message}
              onRegenerate={onRegenerate}
            />
          </>
        )}
      </div>
    </div>
  );
};
export default CoachMessageItem;
