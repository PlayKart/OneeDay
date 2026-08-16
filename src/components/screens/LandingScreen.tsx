import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useStore } from "../../store/useStore";
import { 
  User, 
  Loader2, 
  Check, 
  Shield, 
  Sparkles, 
  Brain, 
  Clock, 
  BarChart3, 
  ArrowRight,
  Zap,
  Target,
  ChevronRight,
  Flame,
  Layers,
  Compass
} from "lucide-react";
import { toast } from "react-hot-toast";
import { PrivacyPage } from "../PrivacyPage";
import { TermsPage } from "../TermsPage";
import { MonolithLogo } from "../MonolithLogo";

interface LandingScreenProps {
  onLoginSuccess: () => void;
}

export function LandingScreen({ onLoginSuccess }: LandingScreenProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [view, setView] = useState<"landing" | "privacy" | "terms">("landing");
  const [isChecked, setIsChecked] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const openAuthModal = () => {
    setIsChecked(false);
    setTermsAccepted(false);
    setShowAuthModal(true);
  };

  const handleBack = () => {
    setView("landing");
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    document.title = "OneDay — AI Habit Tracker & Discipline Protocol";

    const handleScroll = () => {
      const featuresEl = document.getElementById("features");
      const aboutEl = document.getElementById("about");
      const systemEl = document.getElementById("protocol");

      if (!featuresEl || !aboutEl) return;

      const scrollPos = window.scrollY + 250;

      if (systemEl && scrollPos >= systemEl.offsetTop) {
        document.title = "Discipline Protocol — OneDay";
      } else if (scrollPos >= aboutEl.offsetTop) {
        document.title = "Team — OneDay";
      } else if (scrollPos >= featuresEl.offsetTop) {
        document.title = "Features — OneDay";
      } else {
        document.title = "OneDay — AI Habit Tracker & Discipline Protocol";
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGoogleLogin = async () => {
    if (!termsAccepted) {
      toast.error("Please agree to the Terms and Privacy Policy first.");
      return;
    }
    if (authLoading) return;

    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const credential = await signInWithPopup(auth, provider);
      if (!credential || !credential.user) {
        throw new Error("No user credential returned from Firebase.");
      }

      const fbUser = credential.user;
      localStorage.setItem("oneday_policy_accepted_v1", "true");

      useStore.getState().setFirebaseUser(fbUser);
      await useStore.getState().refreshFromBackend();

      setShowAuthModal(false);
      onLoginSuccess();
      toast.success("Welcome to OneDay!");
    } catch (error: any) {
      console.error("[AUTH Error] Google login failed:", error);
      if (error.code === "auth/unauthorized-domain") {
        toast.error(`Please add ${window.location.hostname} to your Firebase authorized domains.`);
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Popup blocked by browser. Please allow popups or try again.");
      } else if (error.code === "auth/popup-closed-by-user") {
        toast.error("Sign-in cancelled.");
      } else {
        toast.error(error.message || "Google Login failed. Please retry.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (!termsAccepted) {
      toast.error("Please agree to the Terms and Privacy Policy first.");
      return;
    }
    if (authLoading) return;

    setAuthLoading(true);
    try {
      const credential = await signInAnonymously(auth);
      if (!credential || !credential.user) {
        throw new Error("No guest user credential returned.");
      }

      const fbUser = credential.user;
      localStorage.setItem("oneday_policy_accepted_v1", "true");

      useStore.getState().setFirebaseUser(fbUser);
      await useStore.getState().refreshFromBackend();

      setShowAuthModal(false);
      onLoginSuccess();
      toast.success("Welcome, Guest!");
    } catch (error: any) {
      console.error("[Auth Error] Guest login failed:", error);
      toast.error(error.message || "Guest login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <AnimatePresence mode="wait">
      {view === "privacy" ? (
        <PrivacyPage onBack={handleBack} />
      ) : view === "terms" ? (
        <TermsPage onBack={handleBack} />
      ) : (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen bg-[#050508] text-slate-100 font-sans w-full overflow-x-hidden selection:bg-purple-500/30 selection:text-white"
        >
          {/* TOP RADIAL GLOW */}
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

          {/* STICKY HEADER */}
          <header className="sticky top-0 left-0 right-0 z-50 bg-[#08080c]/80 backdrop-blur-2xl border-b border-white/[0.08] h-16 md:h-20 flex items-center px-5 md:px-12 transition-all">
            <nav className="max-w-7xl mx-auto w-full flex justify-between items-center" aria-label="Main Navigation">
              <div 
                className="flex items-center gap-3 select-none cursor-pointer group" 
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <MonolithLogo size={28} />
                <span className="text-lg md:text-xl font-black tracking-tight text-white group-hover:text-purple-300 transition-colors">
                  OneDay
                </span>
              </div>
              
              <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-400">
                <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors cursor-pointer">Features</button>
                <button onClick={() => scrollToSection("coaching")} className="hover:text-white transition-colors cursor-pointer">AI Coach</button>
                <button onClick={() => scrollToSection("protocol")} className="hover:text-white transition-colors cursor-pointer">Protocol</button>
                <button onClick={() => scrollToSection("about")} className="hover:text-white transition-colors cursor-pointer">Team</button>
              </div>

              <button 
                onClick={openAuthModal}
                className="bg-white hover:bg-slate-200 text-black px-5 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-extrabold tracking-tight active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-1.5 group"
              >
                <span>Start Now</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </nav>
          </header>

          <main className="space-y-20 md:space-y-36">
            {/* HERO SECTION */}
            <section className="relative pt-14 md:pt-24 pb-12 px-5 max-w-5xl mx-auto flex flex-col justify-center text-center">
              <div className="space-y-6 md:space-y-8">
                {/* Micro Pill Badge */}
                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/25 px-4 py-1.5 rounded-full text-[11px] md:text-xs font-bold tracking-wider text-purple-300 uppercase mx-auto select-none shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                  <Sparkles size={13} className="text-purple-400" />
                  <span>Not another habit app. A discipline protocol.</span>
                </div>

                <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-white">
                  Build unbreakable habits.<br />
                  <span className="text-slate-400">Become impossible to stop.</span>
                </h1>

                <p className="text-sm md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                  OneDay replaces noisy habit trackers with an intelligent protocol: daily execution checklists, contextual AI coaching, streak shields, and earned progression.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4 max-w-xs sm:max-w-md mx-auto">
                  <button 
                    onClick={openAuthModal}
                    className="w-full sm:w-auto bg-white text-black px-8 py-3.5 rounded-full text-sm font-extrabold tracking-tight hover:bg-slate-200 active:scale-95 transition-all shadow-[0_4px_25px_rgba(255,255,255,0.2)] cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <span>Start Your Protocol</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => scrollToSection("features")}
                    className="w-full sm:w-auto bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 px-8 py-3.5 rounded-full text-sm font-bold tracking-tight transition-all cursor-pointer"
                  >
                    Explore Features
                  </button>
                </div>
              </div>
            </section>

            {/* 3-CARD CORE PILLAR SHOWCASE */}
            <section id="features" className="px-5 max-w-6xl mx-auto">
              <div className="text-center space-y-3 max-w-2xl mx-auto mb-12 md:mb-16">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400">Core Architecture</div>
                <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
                  Designed for execution, not distraction
                </h2>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                  Three interlocking pillars engineered to keep you consistent without cognitive overload.
                </p>
              </div>

              {/* 3 Cards Desktop (1 row) / Mobile (1 per row) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pillar 1 */}
                <div className="liquid-glass-card-interactive rounded-2xl p-7 flex flex-col justify-between space-y-6 stripe-purple relative overflow-hidden group">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                      <Target size={22} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-extrabold">Pillar 01</div>
                      <h3 className="text-lg font-black text-white tracking-tight">Structured Routine Engine</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Customize daily, weekday, or target frequency schedules with clean tap-to-complete checklists and zero friction.
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2 pt-4 border-t border-white/5 text-xs text-slate-300 font-medium">
                    <li className="flex items-center gap-2.5">
                      <Check size={14} className="text-purple-400 stroke-[2.5] shrink-0" />
                      <span>Flexible recurrence & frequency targets</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={14} className="text-purple-400 stroke-[2.5] shrink-0" />
                      <span>Instant completion with fluid micro-feedback</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={14} className="text-purple-400 stroke-[2.5] shrink-0" />
                      <span>Streak protection with freeze shields</span>
                    </li>
                  </ul>
                </div>

                {/* Pillar 2 */}
                <div className="liquid-glass-card-interactive rounded-2xl p-7 flex flex-col justify-between space-y-6 stripe-emerald relative overflow-hidden group">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                      <Brain size={22} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-extrabold">Pillar 02</div>
                      <h3 className="text-lg font-black text-white tracking-tight">Contextual AI Coach</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        A dedicated mentor grounded in your actual habits, streak states, and personal goals to provide actionable advice.
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2 pt-4 border-t border-white/5 text-xs text-slate-300 font-medium">
                    <li className="flex items-center gap-2.5">
                      <Check size={14} className="text-emerald-400 stroke-[2.5] shrink-0" />
                      <span>Real-time habit analysis & suggestions</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={14} className="text-emerald-400 stroke-[2.5] shrink-0" />
                      <span>Context-aware motivation on slump days</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={14} className="text-emerald-400 stroke-[2.5] shrink-0" />
                      <span>Multi-session memory & discipline plans</span>
                    </li>
                  </ul>
                </div>

                {/* Pillar 3 */}
                <div className="liquid-glass-card-interactive rounded-2xl p-7 flex flex-col justify-between space-y-6 stripe-sky relative overflow-hidden group">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                      <Flame size={22} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-extrabold">Pillar 03</div>
                      <h3 className="text-lg font-black text-white tracking-tight">Earned Progression</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Earn tangible XP, rank through prestige discipline tiers, and unlock titles reflecting true dedication.
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2 pt-4 border-t border-white/5 text-xs text-slate-300 font-medium">
                    <li className="flex items-center gap-2.5">
                      <Check size={14} className="text-sky-400 stroke-[2.5] shrink-0" />
                      <span>Experience gain tied to habit difficulty</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={14} className="text-sky-400 stroke-[2.5] shrink-0" />
                      <span>Dynamic level-ups & custom title unlocks</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={14} className="text-sky-400 stroke-[2.5] shrink-0" />
                      <span>Clean analytics without superficial charts</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* BENTO GRID OF ALL CAPABILITIES */}
            <section id="protocol" className="px-5 max-w-6xl mx-auto space-y-10">
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400">Feature Matrix</div>
                <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
                  Built to keep you moving forward
                </h2>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                  Every feature exists to eliminate friction and sustain long-term consistency.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { icon: Target, title: "Custom Schedules", desc: "Set habits for every day, weekdays only, or specific selected days per week.", color: "text-purple-400" },
                  { icon: Zap, title: "Streak Protection", desc: "Activate a 1 to 10 day Streak Shield to pause your counter when life gets chaotic.", color: "text-amber-400" },
                  { icon: Brain, title: "Intelligent Guidance", desc: "Chat with an AI coach that understands your daily roadblocks and routine cadence.", color: "text-emerald-400" },
                  { icon: Clock, title: "Focus Sessions", desc: "Lock in deep work blocks with distraction-free timers and focused ambient states.", color: "text-sky-400" },
                  { icon: BarChart3, title: "Discipline Analytics", desc: "Review daily completion rates, XP progression, and long-term consistency scores.", color: "text-pink-400" },
                  { icon: Shield, title: "Privacy By Design", desc: "Your personal reflection notes, habits, and profile remain securely private.", color: "text-teal-400" }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="liquid-glass-card rounded-2xl p-6 hover:border-white/15 transition-all space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Icon size={18} className={item.color} />
                      </div>
                      <h3 className="text-sm md:text-base font-extrabold text-white">{item.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* AI COACH CONVERSATION SHOWCASE */}
            <section id="coaching" className="px-5 max-w-4xl mx-auto">
              <div className="text-center space-y-3 mb-10">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400">Intelligent Mentorship</div>
                <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">Your AI coach. Built around your real habits.</h2>
                <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  OneDay connects directly with your active routine to give practical, no-BS guidance when you hit friction.
                </p>
              </div>

              {/* Chat Interface Preview */}
              <div className="liquid-glass-card rounded-3xl p-6 md:p-8 max-w-lg mx-auto space-y-5 border-purple-500/20 shadow-[0_0_50px_rgba(139,92,246,0.12)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold">OneDay Coach Protocol</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                    Active Session
                  </span>
                </div>

                <div className="space-y-4 text-xs md:text-sm">
                  {/* AI Bubble */}
                  <div className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center font-bold text-[10px] text-purple-300 shrink-0">
                      <Brain size={14} />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 max-w-[85%] text-slate-200 leading-relaxed shadow-sm">
                      "I notice your Deep Work habit has a 5-day streak, but you haven't logged today's block yet. What's standing in the way?"
                    </div>
                  </div>

                  {/* User Bubble */}
                  <div className="flex justify-end gap-2.5 items-start">
                    <div className="bg-purple-600/20 border border-purple-500/30 rounded-2xl rounded-tr-sm p-4 max-w-[85%] text-white leading-relaxed">
                      "Feeling low energy this afternoon."
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-white text-black flex items-center justify-center font-bold text-[10px] shrink-0">
                      U
                    </div>
                  </div>

                  {/* AI response */}
                  <div className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center font-bold text-[10px] text-purple-300 shrink-0">
                      <Brain size={14} />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 max-w-[85%] text-slate-200 leading-relaxed shadow-sm">
                      "Lower the barrier: do just 15 minutes without your phone. Showing up at 20% effort preserves the momentum."
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TEAM & STUDENT VISION */}
            <section id="about" className="px-5 max-w-5xl mx-auto space-y-12">
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400">Our Origin</div>
                <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">Built by students with purpose</h2>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                  OneDay was created by students who wanted a minimal, high-performance system for mastering discipline and daily consistency.
                </p>
                <div className="inline-block bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1 text-[11px] md:text-xs text-purple-300 font-semibold">
                  Students of: <strong className="text-white">Kendriya Vidyalaya Gachibowli (KVGB)</strong>
                </div>
              </div>

              {/* 3 Team Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="liquid-glass-card rounded-2xl p-7 flex flex-col items-center text-center space-y-4 hover:border-white/20 transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-black text-purple-300 text-lg shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                    K
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm md:text-base text-white tracking-tight">Kante Harsha Vardhan</h3>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">Founder — Core Idea & Vision</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Shapes the core product philosophy, discipline mechanics, and overall architecture of OneDay.
                  </p>
                </div>

                <div className="liquid-glass-card rounded-2xl p-7 flex flex-col items-center text-center space-y-4 hover:border-white/20 transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-black text-sky-300 text-lg shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                    V
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm md:text-base text-white tracking-tight">Vemuri Venkata Vikhyath</h3>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">Feature Strategy & Systems</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Translates product strategies into practical systems and orchestrates backend progression algorithms.
                  </p>
                </div>

                <div className="liquid-glass-card rounded-2xl p-7 flex flex-col items-center text-center space-y-4 hover:border-white/20 transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-300 text-lg shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                    R
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm md:text-base text-white tracking-tight">Ravuru Trinay Karthik Ram</h3>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Design & User Experience</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Directs the visual system, interaction design, dark aesthetic, and overall tactile feel of the app.
                  </p>
                </div>
              </div>
            </section>

            {/* FINAL CTA BANNER */}
            <section className="px-5 max-w-4xl mx-auto py-8">
              <div className="liquid-glass-card rounded-[2.5rem] p-8 md:p-14 text-center space-y-6 border-purple-500/30 shadow-[0_0_60px_rgba(139,92,246,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="space-y-2 relative z-10">
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">Start with one day.</h2>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                    You don't need to rebuild your whole life overnight. You just need to show up today.
                  </p>
                </div>
                <div className="relative z-10">
                  <button 
                    onClick={openAuthModal}
                    className="bg-white text-black px-10 py-4 rounded-full text-sm font-extrabold tracking-tight hover:bg-slate-200 active:scale-95 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.25)] cursor-pointer inline-flex items-center gap-2 group"
                  >
                    <span>Start Your Journey</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </section>
          </main>

          {/* FOOTER */}
          <footer className="py-12 border-t border-white/[0.08] bg-[#08080c] mt-16">
            <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
              <div className="space-y-1">
                <div className="text-base font-black text-white tracking-tight">OneDay</div>
                <p className="text-xs text-slate-500">Build better habits. One day at a time.</p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-xs text-slate-400 font-medium">
                <button 
                  onClick={() => { setView("privacy"); window.scrollTo({ top: 0 }); }} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
                <button 
                  onClick={() => { setView("terms"); window.scrollTo({ top: 0 }); }} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Terms & Conditions
                </button>
                <span className="text-slate-600 text-[10px] md:text-xs">© 2026 OneDay. All rights reserved.</span>
              </div>
            </div>
          </footer>

          {/* AUTH MODAL */}
          <AnimatePresence>
            {showAuthModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/85 backdrop-blur-xl"
                  onClick={() => {
                    if (!authLoading) {
                      setShowAuthModal(false);
                      setTermsAccepted(false);
                      setIsChecked(false);
                    }
                  }}
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.94, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 15 }}
                  className="relative bg-[#0d0d14] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-[0_0_80px_rgba(0,0,0,0.8)] space-y-6 z-10"
                >
                  <div className="flex flex-col items-center gap-3 text-center pb-2 select-none">
                    <MonolithLogo size={48} />
                    <div className="space-y-1">
                      <h3 className="text-xl font-black tracking-[0.15em] text-white">ONE DAY</h3>
                      <p className="text-purple-400 text-[10px] font-bold uppercase tracking-widest">
                        {!termsAccepted ? "Step 1: Consent & Protocol Agreement" : "Step 2: Sign In"}
                      </p>
                    </div>
                  </div>

                  {!termsAccepted ? (
                    <div className="space-y-4">
                      <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                        <p className="font-bold text-white">Terms & Privacy Agreement</p>
                        <p className="text-slate-400">
                          Before proceeding to authentication, please review and accept the OneDay platform policies.
                        </p>
                      </div>

                      <div className="flex items-start gap-3 text-left bg-white/[0.03] border border-white/10 rounded-xl p-3.5">
                        <input 
                          type="checkbox" 
                          id="agree-policies"
                          checked={isChecked}
                          onChange={(e) => setIsChecked(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded border-white/20 bg-black text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-purple-500"
                        />
                        <label htmlFor="agree-policies" className="text-[11px] text-slate-400 leading-normal cursor-pointer select-none">
                          I have read and agree to the{" "}
                          <button 
                            onClick={() => { setView("terms"); setShowAuthModal(false); window.scrollTo({ top: 0 }); }} 
                            className="text-purple-300 hover:underline font-semibold cursor-pointer inline-block"
                          >
                            Terms & Conditions
                          </button>{" "}
                          and{" "}
                          <button 
                            onClick={() => { setView("privacy"); setShowAuthModal(false); window.scrollTo({ top: 0 }); }} 
                            className="text-purple-300 hover:underline font-semibold cursor-pointer inline-block"
                          >
                            Privacy Policy
                          </button>.
                        </label>
                      </div>

                      <button
                        onClick={() => {
                          if (isChecked) {
                            setTermsAccepted(true);
                          }
                        }}
                        disabled={!isChecked}
                        className="w-full bg-white text-black font-extrabold py-3.5 rounded-xl hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-wider cursor-pointer"
                      >
                        Accept & Continue
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <button 
                          onClick={handleGoogleLogin}
                          disabled={authLoading}
                          className="w-full bg-white text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs tracking-tight cursor-pointer"
                        >
                          {authLoading ? (
                            <Loader2 size={16} className="animate-spin text-black" />
                          ) : (
                            <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#000000"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#000000"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#000000"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#000000"/>
                            </svg>
                          )}
                          {authLoading ? "Authenticating..." : "Continue with Google"}
                        </button>
                        <button 
                          onClick={handleGuestLogin}
                          disabled={authLoading}
                          className="w-full bg-white/5 border border-white/10 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs tracking-tight cursor-pointer"
                        >
                          {authLoading ? (
                            <Loader2 size={16} className="animate-spin text-white" />
                          ) : (
                            <User size={16} />
                          )}
                          {authLoading ? "Authenticating..." : "Continue as Guest"}
                        </button>
                      </div>

                      {!authLoading && (
                        <button
                          onClick={() => {
                            setTermsAccepted(false);
                          }}
                          className="w-full text-center text-[11px] text-slate-500 hover:text-white transition-colors cursor-pointer block"
                        >
                          ← Back to Terms
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
