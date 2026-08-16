import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  destructive = true,
  isLoading = false,
  icon,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  // Listen for Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-dialog-title"
          aria-describedby={description ? "confirmation-dialog-desc" : undefined}
        >
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => {
              if (!isLoading) onCancel();
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative w-full sm:max-w-md bg-[#0d0d10] border border-white/[0.12] rounded-t-[1.75rem] sm:rounded-2xl p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-10 select-none overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Drag Pill */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 block sm:hidden shrink-0" />

            {/* Top Close Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-40"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>

            {/* Icon Header */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3.5 shadow-inner ${
                  destructive
                    ? "bg-red-500/10 border border-red-500/20 text-red-400"
                    : "bg-white/[0.06] border border-white/[0.1] text-slate-200"
                }`}
              >
                {icon ? (
                  icon
                ) : destructive ? (
                  <Trash2 size={20} className="stroke-[2.2]" />
                ) : (
                  <AlertTriangle size={20} className="stroke-[2.2]" />
                )}
              </div>

              {/* Title */}
              <h3
                id="confirmation-dialog-title"
                className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug px-2"
              >
                {title}
              </h3>

              {/* Description */}
              {description && (
                <p
                  id="confirmation-dialog-desc"
                  className="text-xs sm:text-sm text-slate-300 mt-2 mb-5 leading-relaxed max-w-sm px-2"
                >
                  {description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                disabled={isLoading}
                onClick={onCancel}
                className="flex-1 order-2 sm:order-1 h-11 sm:h-12 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white border border-white/[0.08] rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center disabled:opacity-40 active:scale-[0.98]"
              >
                {cancelText}
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={onConfirm}
                className={`flex-1 order-1 sm:order-2 h-11 sm:h-12 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] ${
                  destructive
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 border border-red-500/40"
                    : "bg-white hover:bg-zinc-200 text-black shadow-md border border-white/30"
                }`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
