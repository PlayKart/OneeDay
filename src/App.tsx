import { useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useStore } from './store/useStore';
import { Toaster } from 'react-hot-toast';
import { MonolithLogo } from './components/MonolithLogo';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { ScreenErrorBoundary } from './components/ScreenErrorBoundary';
import { resolveOnboardingStatus, OnboardingLogicalStatus } from './utils';

// Lazy loading screen components with resilient retry logic
const DashboardScreen = lazyWithRetry(() => import('./components/screens/DashboardScreen'), 'DashboardScreen');
const HabitsScreen = lazyWithRetry(() => import('./components/screens/HabitsScreen'), 'HabitsScreen');
const CoachScreen = lazyWithRetry(() => import('./components/screens/CoachScreen'), 'CoachScreen');
const SettingsScreen = lazyWithRetry(() => import('./components/screens/SettingsScreen'), 'SettingsScreen');
const LandingScreen = lazyWithRetry(() => import('./components/screens/LandingScreen'), 'LandingScreen');

import { MainLayout } from './components/MainLayout';
import { OnboardingTransition } from './components/OnboardingTransition';
const TitleUnlockModal = lazy(() => import('./components/TitleUnlockModal').then(m => ({ default: m.TitleUnlockModal })));
const TitleLossModal = lazy(() => import('./components/TitleLossModal').then(m => ({ default: m.TitleLossModal })));
const LevelUpModal = lazy(() => import('./components/LevelUpAnimation').then(m => ({ default: m.LevelUpModal })));
const OnboardingModal = lazy(() => import('./components/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const AppIntroFlow = lazy(() => import('./components/AppIntroFlow').then(m => ({ default: m.AppIntroFlow })));

export type AppState =
  | "INITIALIZING"
  | "UNAUTHENTICATED"
  | "AUTHENTICATED_SYNC_ERROR"
  | "AUTHENTICATED_LOADING"
  | "AUTHENTICATED_ONBOARDING_INCOMPLETE"
  | "AUTHENTICATED_INTRO"
  | "AUTHENTICATED_READY";

function hasSeenAppIntro(userId: string, u: any): boolean {
  if (!userId) return false;
  if (localStorage.getItem(`oneday_intro_seen_${userId}`) === "true") return true;
  if (u?.hasSeenAppIntroduction === true || u?.hasSeenAppIntroduction === "true") return true;
  return false;
}

/**
 * Authoritative Pure Selector for deterministic App State transitions
 */
export function getAppState({
  initialized,
  firebaseUser,
  user,
  loading,
  profileSynced,
  backendError,
}: {
  initialized: boolean;
  firebaseUser: any;
  user: any;
  loading: boolean;
  profileSynced: boolean;
  backendError: string | null;
}): AppState {
  // 1. Auth not yet initialized
  if (!initialized) {
    return "INITIALIZING";
  }

  // 2. Unauthenticated user
  if (!firebaseUser) {
    return "UNAUTHENTICATED";
  }

  // 3. Authenticated - Check onboarding status (3-state: complete, incomplete, unknown)
  const onboardingStatus: OnboardingLogicalStatus = user ? resolveOnboardingStatus(user) : "unknown";

  // 4. Explicitly completed onboarding (Rule 14: Never redirect an onboarded user away during background loading)
  if (onboardingStatus === "complete") {
    const uid = firebaseUser.uid || user?.id || "";
    const seenIntro = hasSeenAppIntro(uid, user);
    if (!seenIntro) {
      return "AUTHENTICATED_INTRO";
    }
    return "AUTHENTICATED_READY";
  }

  // 5. If there is a backend/sync error and status is unknown
  if (backendError && !profileSynced && onboardingStatus === "unknown") {
    return "AUTHENTICATED_SYNC_ERROR";
  }

  // 6. If profile is still syncing / loading OR profile is not yet synced, and onboarding status is unknown
  if ((loading || !profileSynced) && onboardingStatus === "unknown") {
    return "AUTHENTICATED_LOADING";
  }

  // 7. Explicitly incomplete onboarding (ONLY when status is confirmed incomplete)
  if (onboardingStatus === "incomplete") {
    return "AUTHENTICATED_ONBOARDING_INCOMPLETE";
  }

  // 8. If onboarding status is unknown after sync finished
  if (onboardingStatus === "unknown") {
    return "AUTHENTICATED_LOADING";
  }

  // Fallback safe state: loading, NEVER onboarding
  return "AUTHENTICATED_LOADING";
}

export default function App() {
  const { 
    user, 
    firebaseUser, 
    initialized, 
    loading, 
    backendError, 
    profileSynced, 
    refreshFromBackend, 
    activeTab, 
    incrementProfileVersion 
  } = useStore();

  const appState = getAppState({
    initialized,
    firebaseUser,
    user,
    loading,
    profileSynced,
    backendError,
  });

  // Log App mounted
  useEffect(() => {
    console.log("[BOOT] initialization started");
  }, []);

  // Detailed Route State Logging & URL History Synchronization
  useEffect(() => {
    const onboardingLogical: OnboardingLogicalStatus = user ? resolveOnboardingStatus(user) : "unknown";
    const syncStatus = loading ? "syncing" : backendError ? "error" : profileSynced ? "success" : "idle";
    const authStatus = !initialized ? "initializing" : firebaseUser ? "authenticated" : "unauthenticated";
    const profileStatus = profileSynced ? "loaded" : loading ? "pending" : backendError ? "error" : "idle";

    const decision = 
      appState === "INITIALIZING" || appState === "AUTHENTICATED_LOADING"
        ? "render OneDay loader"
        : appState === "UNAUTHENTICATED"
        ? "render landing"
        : appState === "AUTHENTICATED_SYNC_ERROR"
        ? "render sync error"
        : appState === "AUTHENTICATED_ONBOARDING_INCOMPLETE"
        ? "render onboarding"
        : appState === "AUTHENTICATED_INTRO"
        ? "render app intro"
        : "render dashboard";

    console.log(`[ONBOARDING STATUS] resolved = ${onboardingLogical}`);
    console.log(`[APP STATE] ${appState}`);

    console.log("[ROUTE STATE]", {
      authStatus,
      firebaseUser: firebaseUser ? firebaseUser.uid : null,
      syncStatus,
      profileStatus,
      onboardingStatus: onboardingLogical,
      currentPath: window.location.pathname,
      appState,
      decision,
    });

    // Synchronize browser URL bar without unrequested redirects
    if (appState === "UNAUTHENTICATED") {
      if (window.location.pathname !== "/landing" && window.location.pathname !== "/terms" && window.location.pathname !== "/privacy") {
        window.history.replaceState({}, "", "/landing");
      }
    } else if (appState === "AUTHENTICATED_ONBOARDING_INCOMPLETE") {
      if (window.location.pathname !== "/onboarding") {
        window.history.replaceState({}, "", "/onboarding");
      }
    } else if (appState === "AUTHENTICATED_INTRO") {
      if (window.location.pathname !== "/intro") {
        window.history.replaceState({}, "", "/intro");
      }
    } else if (appState === "AUTHENTICATED_READY") {
      if (window.location.pathname === "/onboarding" || window.location.pathname === "/intro" || window.location.pathname === "/landing") {
        window.history.replaceState({}, "", "/dashboard");
      }
    }
  }, [appState, initialized, firebaseUser, user, loading, profileSynced, backendError]);

  // Log Navigation/Route Changes
  useEffect(() => {
    console.log(`[STARTUP SEQUENCE - Navigation] Tab/Route changed to: ${activeTab}`);
  }, [activeTab]);

  // Refresh on day change / focus
  useEffect(() => {
    if (!firebaseUser) return;

    let lastCheckedDate = new Date().toISOString().split("T")[0];

    const checkNewDayAndRefresh = () => {
      const currentDate = new Date().toISOString().split("T")[0];
      if (currentDate !== lastCheckedDate) {
        lastCheckedDate = currentDate;
        refreshFromBackend();
      }
    };

    const interval = setInterval(checkNewDayAndRefresh, 60000);

    const handleFocus = () => {
      checkNewDayAndRefresh();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [firebaseUser, refreshFromBackend]);

  // Document Title
  useEffect(() => {
    if (!firebaseUser) {
      document.title = "OneDay — AI Habit Tracker";
      return;
    }
    switch (activeTab) {
      case "dashboard":
        document.title = "Dashboard — OneDay";
        break;
      case "habits":
        document.title = "Habits — OneDay";
        break;
      case "coach":
        document.title = "AI Coach — OneDay";
        break;
      case "settings":
        document.title = "Settings — OneDay";
        break;
      default:
        document.title = "OneDay — AI Habit Tracker";
    }
  }, [firebaseUser, activeTab]);

  // ── BRANCH 1: INITIALIZING -> Splash Screen ──────────────────────────────
  if (appState === "INITIALIZING") {
    return (
      <OnboardingTransition
        variant="calibrating"
        status="syncing"
        persistent={true}
        buttonText="Initializing..."
        onAction={() => {}}
      />
    );
  }

  // ── BRANCH 2: UNAUTHENTICATED -> Landing Screen ──────────────────────────
  if (appState === "UNAUTHENTICATED") {
    return (
      <ScreenErrorBoundary name="LandingScreen">
        <Suspense fallback={
          <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/5 border-t-white rounded-full animate-spin" />
          </div>
        }>
          <LandingScreen />
        </Suspense>
      </ScreenErrorBoundary>
    );
  }

  // ── BRANCH 3: AUTHENTICATED_SYNC_ERROR -> Sync Error Screen ───────────────
  if (appState === "AUTHENTICATED_SYNC_ERROR") {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Sync temporarily unavailable</h2>
        <p className="text-slate-400 text-xs max-w-sm mb-6 leading-relaxed">
          {backendError || "We couldn't connect to the sync server right now. Your authenticated session is safe."}
        </p>
        <button
          onClick={async () => {
            console.log("[AUTH] Manual retry invoked from sync error screen");
            useStore.setState({ backendError: null, loading: false });
            await refreshFromBackend();
          }}
          className="flex items-center gap-2 bg-white text-black text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-slate-200 transition-all cursor-pointer shadow-lg shadow-white/5"
        >
          <RefreshCw size={14} />
          <span>Retry Sync</span>
        </button>
      </div>
    );
  }

  // ── BRANCH 4: AUTHENTICATED_LOADING -> Syncing / Resolving Profile Screen ─
  if (appState === "AUTHENTICATED_LOADING") {
    return (
      <OnboardingTransition
        variant="protocol"
        status={backendError ? "error" : "syncing"}
        errorMessage={backendError}
        persistent={true}
        buttonText="Retry Sync"
        onRetry={async () => {
          console.log("[SYNC] Retrying sync from loading screen...");
          useStore.setState({ backendError: null, loading: false });
          await refreshFromBackend();
        }}
        onAction={async () => {
          console.log("[AUTH] Manual retry invoked from loading screen");
          useStore.setState({ backendError: null, loading: false });
          await refreshFromBackend();
        }}
      />
    );
  }

  // ── BRANCH 5: AUTHENTICATED_ONBOARDING_INCOMPLETE -> Onboarding Modal ─────
  // CRITICAL: Rendered ONLY when authentication is resolved, user exists, and status is explicitly "incomplete"
  if (appState === "AUTHENTICATED_ONBOARDING_INCOMPLETE") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'rgba(5, 5, 5, 0.9)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '12px',
            }
          }} 
        />
        <OnboardingModal 
          isOpen={true} 
          onComplete={async () => {
            console.log("[ONBOARDING] Completion callback triggered.");
            localStorage.removeItem("oneday_onboarding_step");
            localStorage.removeItem("oneday_onboarding_data");

            incrementProfileVersion();
            await refreshFromBackend();
          }} 
        />
      </div>
    );
  }

  // ── BRANCH 6: AUTHENTICATED_INTRO -> App Intro Flow ──────────────────────
  if (appState === "AUTHENTICATED_INTRO") {
    return (
      <AppIntroFlow 
        userId={firebaseUser.uid} 
        userName={user?.name} 
        onComplete={() => {
          console.log("[App Intro] Completed intro. Navigating to /dashboard");
          localStorage.setItem(`oneday_intro_seen_${firebaseUser.uid}`, "true");
          if (window.location.pathname !== "/dashboard") {
            window.history.replaceState({}, "", "/dashboard");
          }
          incrementProfileVersion();
        }} 
      />
    );
  }

  // ── BRANCH 7: AUTHENTICATED_READY -> Main Protected App ──────────────────
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505]">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: 'rgba(5, 5, 5, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '12px',
          }
        }} 
      />
      {/* Background Orbs */}
      <div className="orb w-[500px] h-[500px] bg-white/5 top-[-100px] right-[-100px]" />
      <div className="orb w-[400px] h-[400px] bg-white/5 bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 h-[100dvh] overflow-hidden">
        <MainLayout>
          <ScreenErrorBoundary name="MainApp">
            <Suspense fallback={
              <div className="flex items-center justify-center h-[50vh] w-full">
                <div className="w-8 h-8 border-2 border-white/5 border-t-white rounded-full animate-spin" />
              </div>
            }>
              {activeTab === "dashboard" && <DashboardScreen />}
              {activeTab === "habits" && <HabitsScreen />}
              {activeTab === "coach" && <CoachScreen />}
              {activeTab === "settings" && <SettingsScreen />}
            </Suspense>
          </ScreenErrorBoundary>
        </MainLayout>

        <TitleUnlockModal />
        <TitleLossModal />
        <LevelUpModal />
      </div>
    </div>
  );
}
