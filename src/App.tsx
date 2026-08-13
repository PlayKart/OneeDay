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
  Bot,
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

// Lazy loading the heavy screen components for improved SEO, fast initial content paint (FCP), and minimal layout shift
const DashboardScreen = lazy(() => import('./components/screens/DashboardScreen').then(m => ({ default: m.DashboardScreen })));
const HabitsScreen = lazy(() => import('./components/screens/HabitsScreen').then(m => ({ default: m.HabitsScreen })));
const CoachScreen = lazy(() => import('./components/screens/CoachScreen').then(m => ({ default: m.CoachScreen })));
const SettingsScreen = lazy(() => import('./components/screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const LandingScreen = lazy(() => import('./components/screens/LandingScreen').then(m => ({ default: m.LandingScreen })));

import { MainLayout } from './components/MainLayout';
import { TitleUnlockModal } from './components/TitleUnlockModal';
import { TitleLossModal } from './components/TitleLossModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AppIntroFlow } from './components/AppIntroFlow';
import { hasCompletedOnboarding } from './utils';

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
  const { user, firebaseUser, initialized, loading, backendError, refreshFromBackend, activeTab, incrementProfileVersion } = useStore();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname;
    if (path === "/onboarding") return "/onboarding";
    if (path === "/intro") return "/intro";
    if (path === "/dashboard") return "/dashboard";
    return "/landing";
  });
  const [startupStatus, setStartupStatus] = useState<"loading" | "ready" | "error">("loading");
  const [startupError, setStartupError] = useState<string | null>(null);
  const [startupTrigger, setStartupTrigger] = useState(0);

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

  // Centralized startup orchestrator & watchdog
  useEffect(() => {
    console.log(`[BOOT] Startup began (trigger: ${startupTrigger}).`);
    setStartupStatus("loading");
    setStartupError(null);

    // Set 60-second maximum watchdog timer (Render free tier can take 50s+ to cold start)
    const watchdog = setTimeout(() => {
      console.error("[STARTUP SEQUENCE] Startup watchdog triggered after 60 seconds.");
      setStartupError("Connection timed out. Uplink took more than 60 seconds to respond.");
      setStartupStatus("error");
    }, 60000);

    let resolved = false;

    const resolveStartup = (route: string) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(watchdog);
      console.log(`[AUTH] Redirecting to: ${route}`);
      if (window.location.pathname !== route) {
        window.history.pushState({}, "", route);
      }
      setCurrentRoute(route);
      setStartupStatus("ready");
    };

    const rejectStartup = (errorMsg: string) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(watchdog);
      console.error(`[STARTUP SEQUENCE] Rejected with error: ${errorMsg}`);
      setStartupError(errorMsg);
      setStartupStatus("error");
    };

    const evaluateState = (state: ReturnType<typeof useStore.getState>) => {
      if (resolved) return;

      if (!state.initialized) {
        return;
      }

      if (!state.firebaseUser) {
        console.log("[AUTH] Firebase state: unauthenticated");
        resolveStartup("/landing");
        return;
      }

      console.log(`[AUTH] Firebase state: authenticated (UID: ${state.firebaseUser.uid})`);

      if (state.backendError) {
        rejectStartup(state.backendError);
        return;
      }

      if (!state.profileSynced) {
        console.log("[STARTUP SEQUENCE] Authenticated, waiting for backend profile sync...");
        return;
      }

      if (state.user) {
        const onboarded = hasCompletedOnboarding(state.user);
        console.log(`[ONBOARDING] status: hasCompletedOnboarding = ${onboarded}`);
        const uid = state.firebaseUser?.uid || state.user?.id || "";
        const seenIntro = hasSeenAppIntro(uid, state.user);
        const targetRoute = !onboarded ? "/onboarding" : (seenIntro ? "/dashboard" : "/intro");
        resolveStartup(targetRoute);
      } else {
        rejectStartup("Failed to load user profile data.");
      }
    };

    const unsubscribe = useStore.subscribe((state) => {
      evaluateState(state);
    });

    evaluateState(useStore.getState());

    return () => {
      clearTimeout(watchdog);
      unsubscribe();
    };
  }, [startupTrigger]);

  // Centralized Protection & Route Guard
  useEffect(() => {
    if (startupStatus !== "ready") {
      return;
    }

    if (!firebaseUser) {
      if (currentRoute !== "/landing") {
        console.log("[AUTH] Redirecting to: /landing");
        if (window.location.pathname !== "/landing") {
          window.history.pushState({}, "", "/landing");
        }
        setCurrentRoute("/landing");
      }
      return;
    }

    if (!user) {
      return;
    }

    const onboarded = hasCompletedOnboarding(user);
    console.log(`[AUTH] needsOnboarding: ${!onboarded}`);

    const uid = firebaseUser.uid || user.id || "";
    const seenIntro = hasSeenAppIntro(uid, user);
    const targetRoute = !onboarded ? "/onboarding" : (seenIntro ? "/dashboard" : "/intro");

    if (currentRoute !== targetRoute) {
      // If user is currently viewing the intro, allow them to finish or skip
      if (currentRoute === "/intro" && onboarded && !seenIntro) {
        return;
      }
      console.log(`[AUTH] Redirecting to: ${targetRoute}`);
      if (window.location.pathname !== targetRoute) {
        window.history.pushState({}, "", targetRoute);
      }
      setCurrentRoute(targetRoute);
    }
  }, [firebaseUser, user, currentRoute, startupStatus]);

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
      return;
    }
    if (startupStatus === "loading") {
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
  }, [firebaseUser, activeTab, startupStatus]);

  const [showSlowBootMessage, setShowSlowBootMessage] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (startupStatus === "loading") {
      timeout = setTimeout(() => setShowSlowBootMessage(true), 5000);
    } else {
      setShowSlowBootMessage(false);
    }
    return () => clearTimeout(timeout);
  }, [startupStatus]);

  // ── 1. Startup is loading -> Show OneDay splash/intro animation ──────────
  if (startupStatus === "loading") {
    console.log("[AUTH] Splash rendered");
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
            
            {showSlowBootMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 text-center"
              >
                <div className="flex items-center gap-3 justify-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Waking up servers</p>
                </div>
                <p className="text-slate-500 text-[10px] max-w-[200px] mx-auto">This happens if you are the first user in a while. Can take up to 60 seconds.</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── 2. Startup has failed -> Show the high-quality error screen ───────────
  if (startupStatus === "error") {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-sans gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 max-w-sm text-center px-6"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-black">Uplink Failed</p>
            <p className="text-slate-400 text-sm mt-2">{startupError || backendError || "Unknown connection error."}</p>
          </div>
          <button
            onClick={async () => {
              console.log("[STARTUP SEQUENCE] User clicked Retry.");
              setStartupStatus("loading");
              useStore.setState({ backendError: null });
              await refreshFromBackend();
              setStartupTrigger(prev => prev + 1);
            }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all text-sm uppercase tracking-widest cursor-pointer"
          >
            <RefreshCw size={14} />
            Retry
          </button>
          <button
            onClick={() => signOut(auth)}
            className="text-xs text-slate-600 hover:text-red-400 transition-colors uppercase tracking-widest font-bold cursor-pointer"
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  // ── 3. We are in ready status -> render views by path ───────────────────────

  // ── 3a. /landing view (ONLY for unauthenticated users) ─────────────────────
  if (!firebaseUser || currentRoute === "/landing") {
    if (!firebaseUser) {
      console.log("[AUTH] Landing rendered");
      return (
        <Suspense fallback={
          <div className="min-h-screen bg-[#050505] flex items-center justify-center font-sans">
            <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin" />
          </div>
        }>
          <LandingScreen onLoginSuccess={() => {
            console.log("[Landing] Sign in success. Waiting for route guard to evaluate destination...");
          }} />
        </Suspense>
      );
    }
  }

  // If authenticated but backend user is not loaded yet (e.g. active sync on sign in)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="animate-pulse">
            <MonolithLogo size={64} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Syncing Discipline...</h2>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-black">Connecting to Uplink</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── 3b. /onboarding view ───────────────────────────────────────────────────
  if (currentRoute === "/onboarding") {
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

            const currentUser = useStore.getState().user;
            const updatedUser = { 
              ...currentUser, 
              onboarded: true, 
              hasCompletedOnboarding: true, 
              onboarding_completed: true,
              onboardingCompleted: true,
              needsOnboarding: false,
              needs_onboarding: false,
              nextRoute: "/dashboard" 
            };
            useStore.setState({ user: updatedUser });

            const activeUser = useStore.getState().user || updatedUser;
            const uid = firebaseUser?.uid || activeUser?.id || "";
            const seenIntro = hasSeenAppIntro(uid, activeUser);
            const targetRoute = seenIntro ? "/dashboard" : "/intro";
            console.log(`[NAV] destination ${targetRoute}`);
            if (window.location.pathname !== targetRoute) {
              window.history.pushState({}, "", targetRoute);
            }
            setCurrentRoute(targetRoute);
          }} 
        />
      </div>
    );
  }

  // ── 3c. /intro view (Welcome & App Introduction) ──────────────────────────
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

  // ── 3d. /dashboard view (Authenticated + Onboarded + Intro completed) ────
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
        </MainLayout>
        <TitleUnlockModal />
        <TitleLossModal />
      </div>
    </div>
  );
}
