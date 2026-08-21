import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Snowflake,
  Plus,
  Send,
  User as UserIcon,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useStore } from './store/useStore';
import { Toaster, toast } from 'react-hot-toast';
import { HabitList } from './components/HabitList';
import { AICoach } from './components/AICoach';
import { MotivationalQuote } from './components/MotivationalQuote';
import { MonolithLogo } from './components/MonolithLogo';

import { lazyWithRetry } from './utils/lazyWithRetry';
import { ScreenErrorBoundary } from './components/ScreenErrorBoundary';

// Lazy loading the screen components with resilient retry logic
const DashboardScreen = lazyWithRetry(() => import('./components/screens/DashboardScreen'), 'DashboardScreen');
const HabitsScreen = lazyWithRetry(() => import('./components/screens/HabitsScreen'), 'HabitsScreen');
const CoachScreen = lazyWithRetry(() => import('./components/screens/CoachScreen'), 'CoachScreen');
const SettingsScreen = lazyWithRetry(() => import('./components/screens/SettingsScreen'), 'SettingsScreen');
const LandingScreen = lazyWithRetry(() => import('./components/screens/LandingScreen'), 'LandingScreen');

import { MainLayout } from './components/MainLayout';
const TitleUnlockModal = lazy(() => import('./components/TitleUnlockModal').then(m => ({ default: m.TitleUnlockModal })));
const TitleLossModal = lazy(() => import('./components/TitleLossModal').then(m => ({ default: m.TitleLossModal })));
const LevelUpModal = lazy(() => import('./components/LevelUpAnimation').then(m => ({ default: m.LevelUpModal })));
const OnboardingModal = lazy(() => import('./components/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const AppIntroFlow = lazy(() => import('./components/AppIntroFlow').then(m => ({ default: m.AppIntroFlow })));
import { getOnboardingStatus, hasCompletedOnboarding } from './utils';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function hasSeenAppIntro(userId: string, u: any): boolean {
  if (!userId) return false;
  if (localStorage.getItem(`oneday_intro_seen_${userId}`) === "true") return true;
  if (u?.hasSeenAppIntroduction === true || u?.hasSeenAppIntroduction === "true") return true;
  return false;
}

export default function App() {
  const { user, firebaseUser, initialized, loading, backendError, profileSynced, refreshFromBackend, activeTab, incrementProfileVersion } = useStore();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname;
    if (path === "/onboarding") return "/onboarding";
    if (path === "/intro") return "/intro";
    if (path === "/dashboard") return "/dashboard";
    return "/landing";
  });

  // Log App mounted
  useEffect(() => {
    console.log("[BOOT] initialization started");
  }, []);

  // Listen to popstate event for native history back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/onboarding" || path === "/intro" || path === "/dashboard" || path === "/landing") {
        setCurrentRoute(path);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Centralized Protection & Route Guard for Authenticated Users
  useEffect(() => {
    if (!initialized) return;

    if (!firebaseUser) {
      if (currentRoute !== "/landing") {
        console.error("[ROUTE GUARD] Redirecting to landing", {
          firebaseUser,
          authInitialized: initialized,
          isAuthenticated: false,
          profileSynced,
          profileLoading: loading,
          profileSyncError: backendError,
          user,
          currentPath: window.location.pathname
        });
        if (window.location.pathname !== "/landing") {
          window.history.pushState({}, "", "/landing");
        }
        setCurrentRoute("/landing");
      }
      return;
    }

    // Must wait for user state (either cached or synced) to evaluate onboarding status
    if (!user) {
      return;
    }

    const onboardingStatus = getOnboardingStatus(user);
    if (onboardingStatus === null || onboardingStatus === undefined) {
      // Unknown/loading state - never interpret undefined/null as false!
      return;
    }

    console.log(`[AUTH] Authoritative onboarded status: ${onboardingStatus}`);

    if (onboardingStatus === false) {
      // onboarded === false -> Onboarding
      if (currentRoute !== "/onboarding") {
        console.log("[AUTH] Routing to Onboarding");
        if (window.location.pathname !== "/onboarding") {
          window.history.pushState({}, "", "/onboarding");
        }
        setCurrentRoute("/onboarding");
      }
      return;
    }

    if (onboardingStatus === true) {
      // onboarded === true -> Dashboard (or intro if not yet seen)
      const uid = firebaseUser.uid || user.id || "";
      const seenIntro = hasSeenAppIntro(uid, user);
      const targetRoute = seenIntro ? "/dashboard" : "/intro";

      if (currentRoute !== targetRoute) {
        if (currentRoute === "/intro" && !seenIntro) {
          return;
        }
        console.log(`[AUTH] Routing to: ${targetRoute}`);
        if (window.location.pathname !== targetRoute) {
          window.history.pushState({}, "", targetRoute);
        }
        setCurrentRoute(targetRoute);
      }
    }
  }, [initialized, firebaseUser, user, currentRoute, profileSynced, loading, backendError]);

  // Log Navigation/Route Changes
  useEffect(() => {
    console.log(`[STARTUP SEQUENCE - Navigation] Tab/Route changed to: ${activeTab}`);
  }, [activeTab]);

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
      refreshFromBackend();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [firebaseUser, refreshFromBackend]);

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

  // ── 1. Auth Initializing -> Show initialization screen ──────────
  if (!initialized) {
    console.log("[AUTH] Splash rendered - initializing auth");
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="orb w-[400px] h-[400px] bg-blue-500/5 top-[-100px] left-[-100px] absolute mix-blend-screen animate-pulse" />
        <div className="orb w-[300px] h-[300px] bg-purple-500/5 bottom-[-50px] right-[-50px] absolute mix-blend-screen animate-pulse" />
        
        <AnimatePresence>
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 1.1 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="flex flex-col items-center z-10 animate-pulse"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8"
            >
              <MonolithLogo size={96} />
            </motion.div>
            
            <motion.h1
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.6, duration: 0.8 }}
               className="text-6xl font-black tracking-tighter mb-4 text-white"
            >
              OneDay
            </motion.h1>
            
            <motion.p
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 1.2, duration: 1 }}
               className="text-[11px] text-slate-400 font-black tracking-[0.3em] uppercase text-center"
            >
              Discipline makes it all
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── 2. Unauthenticated -> Show Landing Screen ONLY ─────────────────────
  if (!firebaseUser) {
    console.log("[AUTH] Landing rendered");
    return (
      <ScreenErrorBoundary name="LandingScreen">
        <Suspense fallback={
          <div className="min-h-screen bg-[#050505] flex items-center justify-center font-sans">
            <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin" />
          </div>
        }>
          <LandingScreen onLoginSuccess={() => {
            console.log("[Landing] Sign in success. Waiting for route guard to evaluate destination...");
          }} />
        </Suspense>
      </ScreenErrorBoundary>
    );
  }


  // ── 3. Authenticated -> Show Sync Error screen if backend request failed ──
  if (backendError && !profileSynced) {
    const userFriendlyError = backendError.includes("timeout") || backendError.includes("Uplink")
      ? "Unable to connect to service. Please check your internet connection."
      : backendError;

    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-sans p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 max-w-md text-center px-6"
        >
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Sync failed. Try again.</h2>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-black">Connection Notice</p>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed max-w-sm">{userFriendlyError}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs pt-2">
            <button
              onClick={async () => {
                console.log("[AUTH] User triggered RETRY for profile sync...");
                useStore.setState({ backendError: null, loading: true });
                await refreshFromBackend();
              }}
              className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-slate-200 font-bold px-6 py-3.5 rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer shadow-lg active:scale-95"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Retrying..." : "RETRY"}
            </button>
            <button
              onClick={() => signOut(auth)}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold px-6 py-3.5 rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer border border-white/10"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── 4. Authenticated -> Show Syncing screen if user state is not yet available ──────
  const onboardingStatus = user ? getOnboardingStatus(user) : null;
  if (!user || onboardingStatus === null) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-sans p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 text-center max-w-sm"
        >
          <div className="animate-pulse">
            <MonolithLogo size={64} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Syncing Discipline...</h2>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-black">Connecting Service</p>
          </div>
          <div className="pt-4 flex flex-col items-center gap-2">
            <button
              onClick={async () => {
                console.log("[AUTH] Manual retry invoked from loading screen");
                useStore.setState({ backendError: null, loading: false });
                await refreshFromBackend();
              }}
              className="text-[11px] text-slate-500 hover:text-white transition-colors cursor-pointer uppercase tracking-wider font-semibold underline underline-offset-4"
            >
              Taking too long? Retry Sync
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── 5. /onboarding view ───────────────────────────────────────────────────
  if (onboardingStatus === false || currentRoute === "/onboarding") {
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

            const activeUser = useStore.getState().user;
            const uid = firebaseUser?.uid || activeUser?.id || "";
            const seenIntro = hasSeenAppIntro(uid, activeUser);
            const targetRoute = seenIntro ? "/dashboard" : "/intro";
            console.log(`[AUTH] Redirecting to: ${targetRoute}`);
            if (window.location.pathname !== targetRoute) {
              window.history.pushState({}, "", targetRoute);
            }
            setCurrentRoute(targetRoute);
          }} 
        />
      </div>
    );
  }

  // ── 6. /intro view (Welcome & App Introduction) ──────────────────────────
  if (currentRoute === "/intro") {
    return (
      <AppIntroFlow 
        userId={firebaseUser.uid} 
        userName={user.name} 
        onComplete={() => {
          console.log("[App Intro] Completed intro. Navigating to /dashboard");
          localStorage.setItem(`oneday_intro_seen_${firebaseUser.uid}`, "true");
          if (window.location.pathname !== "/dashboard") {
            window.history.pushState({}, "", "/dashboard");
          }
          setCurrentRoute("/dashboard");
        }} 
      />
    );
  }

  // ── 7. /dashboard view (Authenticated + Onboarded + Intro completed) ────
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
