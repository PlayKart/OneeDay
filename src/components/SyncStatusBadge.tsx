// src/components/SyncStatusBadge.tsx

import React from "react";
import { syncService, SyncState } from "../services/syncService";
import { RefreshCw, WifiOff, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SyncStatusBadgeProps {
  className?: string;
  showAlways?: boolean;
}

export function SyncStatusBadge({ className = "", showAlways = false }: SyncStatusBadgeProps) {
  const [syncState, setSyncState] = React.useState<SyncState>(syncService.getState());

  React.useEffect(() => {
    const unsubscribe = syncService.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsubscribe;
  }, []);

  const { status, pendingCount } = syncState;

  // Don't show anything if idle or success unless showAlways is true
  if (!showAlways && status === 'idle') {
    return null;
  }

  const handleManualRetry = () => {
    if (status === 'error' || status === 'offline') {
      syncService.syncUserData(true).catch((e) => console.warn("Manual retry failed:", e));
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.9, y: -2 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -2 }}
        onClick={handleManualRetry}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide backdrop-blur-md transition-all border ${
          status === 'syncing'
            ? 'bg-purple-950/40 text-purple-300 border-purple-500/30'
            : status === 'retrying'
            ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
            : status === 'offline'
            ? 'bg-slate-900/60 text-slate-400 border-slate-700/40'
            : status === 'error'
            ? 'bg-rose-950/40 text-rose-300 border-rose-500/30 cursor-pointer hover:bg-rose-900/50'
            : 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20'
        } ${className}`}
      >
        {status === 'syncing' && (
          <>
            <RefreshCw size={11} className="animate-spin text-purple-400 shrink-0" />
            <span>Syncing…</span>
          </>
        )}

        {status === 'retrying' && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>Couldn't sync — retrying…</span>
          </>
        )}

        {status === 'offline' && (
          <>
            <WifiOff size={11} className="text-slate-400 shrink-0" />
            <span>Offline {pendingCount > 0 ? `(${pendingCount} pending)` : "— changes will retry"}</span>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={11} className="text-rose-400 shrink-0" />
            <span>Sync issue — tap to retry</span>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
            <span>Synced</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
