import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ScreenErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ScreenErrorBoundary] Error in screen '${this.props.name || 'Unknown'}':`, error, errorInfo);
  }

  public handleReset = () => {
    // Clear any retry flags to allow a clean reload
    sessionStorage.removeItem(`oneday_retry_${this.props.name || 'LandingScreen'}`);
    sessionStorage.removeItem('vite_chunk_reload_attempts');
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white font-sans text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-2xl">
            <AlertTriangle size={32} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">Unable to Load Screen</h2>
          <p className="text-slate-400 text-xs max-w-sm mb-6 leading-relaxed">
            A network or updates issue prevented loading this view. Tap below to reload the app seamlessly.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 bg-white text-black hover:bg-slate-200 text-xs font-bold px-6 py-3 rounded-xl transition-all uppercase tracking-wider cursor-pointer active:scale-95 shadow-lg"
          >
            <RefreshCw size={14} />
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
