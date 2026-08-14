// src/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ROOT ERROR]", error);
    console.error("[ROOT ERROR MESSAGE]", error?.message);
    console.error("[ROOT ERROR STACK]", error?.stack);
    console.error("Uncaught Error Boundary catch:", error, errorInfo);

    // Check for dynamic import chunk failure
    const msg = error?.message || "";
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("error loading dynamically imported module")
    ) {
      const reloadKey = "vite_chunk_reload_attempts";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "true");
        window.location.reload();
      }
    }
  }

  public handleReset = () => {
    sessionStorage.removeItem("vite_chunk_reload_attempts");
    sessionStorage.removeItem("vite_preload_reloaded");
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white font-sans">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h2>
          <p className="text-slate-400 text-sm max-w-md text-center mb-6">
            {this.state.error?.message || "An unexpected error interrupted application runtime."}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm uppercase tracking-widest border border-white/10"
          >
            <RefreshCw size={16} />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
