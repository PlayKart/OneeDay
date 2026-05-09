import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
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

import { DashboardScreen } from './components/screens/DashboardScreen';
import { HabitsScreen } from './components/screens/HabitsScreen';
import { CoachScreen } from './components/screens/CoachScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { MainLayout } from './components/MainLayout';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function App() {
  const { user, firebaseUser, initialized, loading, backendError, refreshFromBackend, activeTab } = useStore();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Show intro animation for 3.5 seconds
    const timer = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("LOGIN FAILED. RETRY.");
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Guest login failed:", error);
      toast.error("GUEST LOGIN FAILED.");
    }
  };

  // ── 0. Show Intro Animation ───────────────────────────────────────────────
  if (showIntro) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="orb w-[400px] h-[400px] bg-blue-500/5 top-[-100px] left-[-100px] absolute mix-blend-screen animate-pulse" />
        <div className="orb w-[300px] h-[300px] bg-purple-500/5 bottom-[-50px] right-[-50px] absolute mix-blend-screen animate-pulse" />
        
        <AnimatePresence>
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 1.1 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="flex flex-col items-center z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/5"
            >
              <Flame size={48} className="text-white" />
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

  // ── 1. Waiting for Firebase to resolve auth state on cold start ──────────
  if (!initialized) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center font-sans">
      <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin" />
    </div>
  );

  // ── 2. No Firebase user → show login screen ──────────────────────────────
  // Uses firebaseUser (not backend `user`) so a backend failure never
  // kicks an authenticated user back to the login screen.
  if (!firebaseUser) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#050505]">
        <div className="orb w-[400px] h-[400px] bg-blue-500/10 top-[-100px] left-[-100px]" />
        <div className="orb w-[300px] h-[300px] bg-purple-500/10 bottom-[-50px] right-[-50px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 glass p-12 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-6">
            <Flame size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">OneDay</h1>
          <p className="text-slate-400 mb-8">One day at a time. Zero excuses.</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleLogin}
              className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button 
              onClick={handleGuestLogin}
              className="w-full bg-white/5 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/10"
            >
              <UserIcon size={20} />
              Continue as Guest
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── 3. Firebase user exists but backend data not yet loaded ───────────────
  if (!user) {
    // Backend error — show retry screen instead of silently looping
    if (backendError) {
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
              <h2 className="text-xl font-bold tracking-tight">Uplink Failed</h2>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-black">Backend Unreachable</p>
              <p className="text-slate-400 text-sm mt-2">{backendError}</p>
            </div>
            <button
              onClick={refreshFromBackend}
              disabled={loading}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all text-sm uppercase tracking-widest"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Retrying...' : 'Retry'}
            </button>
            <button
              onClick={() => signOut(auth)}
              className="text-xs text-slate-600 hover:text-red-400 transition-colors uppercase tracking-widest font-bold"
            >
              Sign Out
            </button>
          </motion.div>
        </div>
      );
    }

    // Normal loading after successful auth
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center animate-pulse">
            <Flame size={32} className="text-white/50" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Syncing Discipline...</h2>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-black">Connecting to Uplink</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── 4. Fully authenticated + backend data loaded → main app ───────────────
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

      <div className="relative z-10 h-screen overflow-hidden">
        <MainLayout>
          {activeTab === "dashboard" && <DashboardScreen />}
          {activeTab === "habits" && <HabitsScreen />}
          {activeTab === "coach" && <CoachScreen />}
          {activeTab === "settings" && <SettingsScreen />}
        </MainLayout>
      </div>
    </div>
  );
}
