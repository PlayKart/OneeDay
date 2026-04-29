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
  Bot
} from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useStore } from './store/useStore';
import { Toaster, toast } from 'react-hot-toast';
import { HabitList } from './components/HabitList';
import { AICoach } from './components/AICoach';
import { MotivationalQuote } from './components/MotivationalQuote';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function App() {
  const { user, initialized } = useStore();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  if (!initialized) return null;

  if (!user) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
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
          
          <button 
            onClick={handleLogin}
            className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505]">
      <Toaster 
        position="top-right" 
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
      <div className="orb w-[500px] h-[500px] bg-orange-500/5 top-[-100px] right-[-100px]" />
      <div className="orb w-[400px] h-[400px] bg-cyan-500/5 bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 grid lg:grid-cols-[280px_1fr] gap-8 p-6 lg:p-8 max-w-[1600px] mx-auto h-screen overflow-hidden">
        
        {/* Sidebar: Profile & Memories */}
        <aside className="hidden lg:flex flex-col gap-6 overflow-y-auto pr-2">
          <div className="glass p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 border-2 border-white/10 overflow-hidden">
                <img src={auth.currentUser?.photoURL || ""} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-bold text-sm truncate max-w-[140px]">{user.name}</h2>
                <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-widest text-nowrap">Level {user.level} Architect</p>
              </div>
            </div>

            <div className="flex justify-between text-[11px] mb-2 font-bold uppercase text-slate-500 tracking-wider">
              <span>XP Progress</span>
              <span>{user.levelProgress}%</span>
            </div>
            <div className="progress-bg">
              <div className="progress-fill" style={{ width: `${user.levelProgress}%` }} />
            </div>
          </div>

          <div className="glass flex-1 p-6 flex flex-col gap-4">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Coach Intelligence</h3>
            
            <div className="bg-white/5 p-4 rounded-2xl border-l-2 border-orange-500/50">
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "Discipline is not a state of mind, it's a series of actions. Keep your streak alive."
              </p>
              <span className="text-[9px] text-slate-500 mt-2 block">System • Just Now</span>
            </div>

            <div className="mt-auto space-y-4">
              <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20">
                <p className="text-[10px] font-black uppercase text-orange-500 mb-1">PWA Protocol</p>
                <p className="text-[10px] text-slate-400">Install via browser for full-screen discipline.</p>
              </div>
              <button 
                onClick={() => signOut(auth)}
                className="w-full py-3 glass hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all border-red-500/10"
              >
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Area */}
        <main className="overflow-y-auto pr-2 space-y-8 pb-12">
          {/* Header Stats */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tighter">OneDay</h1>
              <p className="text-slate-500 text-sm tracking-widest uppercase font-bold text-[10px] mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <div className="glass grow md:grow-0 px-6 py-3 flex items-center gap-4 glow-fire">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="text-xl font-black">{user.streak}</div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Day Streak</div>
                </div>
              </div>
              <div className="glass grow md:grow-0 px-6 py-3 flex items-center gap-4 glow-ice">
                <span className="text-2xl">❄️</span>
                <div>
                  <div className="text-xl font-black">{user.freeze_until ? "Active" : "Ready"}</div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Streak Shield</div>
                </div>
              </div>
            </div>
          </header>

          {/* Motivational Quote */}
          <MotivationalQuote />

          <section className="glass p-8">
            <HabitList />
          </section>

          <section className="grid md:grid-cols-2 gap-8">
            <AICoach />
            <div className="glass p-8 flex flex-col justify-center items-center text-center gap-6">
               <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Snowflake className="text-blue-400" />
               </div>
               <div>
                  <h3 className="font-bold text-lg mb-2">Streak Protection</h3>
                  <p className="text-sm text-slate-500 mb-6">Pause your progress for 7 days if you need a break without losing your streak.</p>
                  <button 
                    disabled={!!user.freeze_until}
                    onClick={async () => {
                      try {
                        await useStore.getState().freezeStreak(7);
                        toast.success("STREAK SHIELD ACTIVATED");
                      } catch (e) {
                        toast.error("SHIELD FAILURE");
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-white/[0.05] disabled:text-slate-600 text-white font-bold px-10 py-4 rounded-xl transition-all uppercase tracking-widest text-xs"
                  >
                    {user.freeze_until ? "Shield Active" : "Activate Shield"}
                  </button>
               </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
