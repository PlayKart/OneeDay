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
  MessageSquare, 
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Target,
  ChevronRight,
  Layers,
  Activity,
  Compass,
  Lock,
  BookOpen,
  GraduationCap
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

  // Dynamic Page Title & Scroll-aware active section state
  useEffect(() => {
    document.title = "OneDay — AI Habit Tracker";

    const handleScroll = () => {
      const featuresEl = document.getElementById("features");
      const aboutEl = document.getElementById("about");
      const systemEl = document.getElementById("discipline-system");

      if (!featuresEl || !aboutEl) return;

      const scrollPos = window.scrollY + 250; // Offset for navbar & threshold

      if (systemEl && scrollPos >= systemEl.offsetTop) {
        document.title = "Discipline Protocol — OneDay";
      } else if (scrollPos >= aboutEl.offsetTop) {
        document.title = "About — OneDay";
      } else if (scrollPos >= featuresEl.offsetTop) {
        document.title = "Features — OneDay";
      } else {
        document.title = "OneDay — AI Habit Tracker";
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
    console.log("[AUTH] Google login started");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const credential = await signInWithPopup(auth, provider);
      console.log("[AUTH] Google popup completed");

      if (!credential || !credential.user) {
        throw new Error("No user credential returned from Firebase.");
      }

      const fbUser = credential.user;
      localStorage.setItem("oneday_policy_accepted_v1", "true");

      useStore.getState().setFirebaseUser(fbUser);
      await useStore.getState().refreshFromBackend();

      setShowAuthModal(false);
      onLoginSuccess();
      toast.success("Welcome!");
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
    console.log("[Auth] Initiating Guest Sign-In...");
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
          className="min-h-screen bg-[#030303] text-white selection:bg-violet-500/30 selection:text-white font-sans w-full overflow-x-hidden relative pb-12"
        >
          {/* AMBIENT PURPLE RADIAL BACKGROUND ORBS */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/10 rounded-full blur-[150px]" />
            <div className="absolute top-[35%] right-[-10%] w-[600px] h-[400px] bg-purple-900/10 rounded-full blur-[160px]" />
            <div className="absolute top-[70%] left-[-10%] w-[600px] h-[400px] bg-indigo-900/10 rounded-full blur-[160px]" />
          </div>

          {/* STICKY HEADER */}
          <header className="sticky top-0 left-0 right-0 z-50 bg-[#030303]/80 backdrop-blur-2xl border-b border-white/[0.08] h-16 md:h-20 flex items-center px-5 md:px-12 transition-all">
            <nav className="max-w-7xl mx-auto w-full flex justify-between items-center" aria-label="Main Navigation">
              <div 
                className="flex items-center gap-3 select-none cursor-pointer group" 
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <div className="p-1 rounded-xl bg-white/[0.04] border border-white/10 group-hover:border-violet-500/40 transition-colors">
                  <MonolithLogo size={26} />
                </div>
                <span className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  OneDay
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                </span>
              </div>
              
              <div className="hidden md:flex items-center gap-8 text-xs md:text-sm font-medium text-zinc-400">
                <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors cursor-pointer py-1">Features</button>
                <button onClick={() => scrollToSection("coaching")} className="hover:text-white transition-colors cursor-pointer py-1">AI Coach</button>
                <button onClick={() => scrollToSection("discipline-system")} className="hover:text-white transition-colors cursor-pointer py-1">Protocol</button>
                <button onClick={() => scrollToSection("about")} className="hover:text-white transition-colors cursor-pointer py-1">Team</button>
              </div>

              <button 
                onClick={openAuthModal}
                className="bg-white text-black px-5 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-semibold tracking-tight hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-1.5"
              >
                <span>Start Now</span>
                <ChevronRight size={14} className="text-black/60" />
              </button>
            </nav>
          </header>

          <main className="relative z-10 space-y-20 md:space-y-36 pt-4">
            {/* HERO SECTION */}
            <motion.section 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative pt-12 md:pt-20 pb-12 px-5 max-w-5xl mx-auto flex flex-col justify-center text-center"
            >
              <div className="space-y-6 md:space-y-8">
                {/* Eyebrow badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-violet-500/20 px-4 py-1.5 rounded-full text-[11px] md:text-xs font-medium tracking-wide text-violet-300 mx-auto select-none shadow-[0_2px_10px_rgba(139,92,246,0.1)] hover:shadow-[0_4px_15px_rgba(139,92,246,0.2)] transition-shadow duration-500"
                >
                  <Sparkles size={13} className="text-violet-400 animate-pulse" />
                  <span className="font-semibold tracking-wider uppercase">ONE DAY AT A TIME</span>
                  <span className="w-1 h-1 rounded-full bg-violet-400/60" />
                  <span className="text-zinc-400 font-normal">v2.0 Protocol</span>
                </motion.div>

                {/* Hero Headline */}
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                  className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.08] text-white"
                >
                  Build better habits.<br />
                  <span className="bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-500 bg-clip-text text-transparent">
                    Become harder to stop.
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                  className="text-sm md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium"
                >
                  OneDay combines habit tracking, intelligent coaching, focus tools, streaks and progression into one personal system for building consistency.
                </motion.p>

                {/* Action CTA Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4 max-w-xs sm:max-w-md mx-auto"
                >
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openAuthModal}
                    className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-full text-sm font-bold tracking-tight transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <span>Start Your Journey</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300 ease-out" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => scrollToSection("product-system")}
                    className="w-full sm:w-auto bg-white/[0.04] text-zinc-300 border border-white/10 px-8 py-4 rounded-full text-sm font-semibold tracking-tight transition-all cursor-pointer backdrop-blur-md"
                  >
                    Explore Features
                  </motion.button>
                </motion.div>
              </div>
            </motion.section>

            {/* PRODUCT VALUE SYSTEM SECTION */}
            <section id="product-system" className="px-5 max-w-5xl mx-auto scroll-mt-28">
              <div className="text-center space-y-4 max-w-2xl mx-auto mb-12 md:mb-16">
                <div className="inline-flex items-center gap-2 text-violet-400 text-xs font-mono font-semibold tracking-widest uppercase">
                  <Layers size={14} />
                  <span>CORE PRODUCT MODULES</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                  A Complete Productivity<br />& Mindset System
                </h2>
                <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto">
                  OneDay is more than a habit tracker. It is a personal system designed to help you build discipline, maintain consistency and make meaningful progress every day.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {/* CARD 1 */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl md:rounded-3xl p-6 md:p-8 hover:border-violet-500/40 hover:bg-white/[0.04] transition-all duration-300 group relative overflow-hidden shadow-2xl">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl group-hover:bg-violet-600/15 transition-all duration-500" />
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900/90 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center text-xs font-mono font-bold text-violet-400">
                      01
                    </div>
                    <Check size={18} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white tracking-tight mb-2">HABIT SYSTEM</h3>
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                    Build routines that fit your actual schedule. Establish visual, clean, and flexible daily tracking lists customized for your lifestyle.
                  </p>
                </div>

                {/* CARD 2 */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl md:rounded-3xl p-6 md:p-8 hover:border-violet-500/40 hover:bg-white/[0.04] transition-all duration-300 group relative overflow-hidden shadow-2xl">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-600/5 rounded-full blur-2xl group-hover:bg-purple-600/15 transition-all duration-500" />
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900/90 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center text-xs font-mono font-bold text-violet-400">
                      02
                    </div>
                    <Brain size={18} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white tracking-tight mb-2">AI COACH</h3>
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                    Get personalized guidance based on your goals and progress. Converse with a dedicated mentor aligned with your discipline roadmap.
                  </p>
                </div>

                {/* CARD 3 */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl md:rounded-3xl p-6 md:p-8 hover:border-violet-500/40 hover:bg-white/[0.04] transition-all duration-300 group relative overflow-hidden shadow-2xl">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/15 transition-all duration-500" />
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900/90 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center text-xs font-mono font-bold text-violet-400">
                      03
                    </div>
                    <TrendingUp size={18} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white tracking-tight mb-2">PROGRESSION</h3>
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                    Turn consistency into XP, levels and measurable growth. Gamify consistency elegantly without childish distractions.
                  </p>
                </div>

                {/* CARD 4 */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl md:rounded-3xl p-6 md:p-8 hover:border-violet-500/40 hover:bg-white/[0.04] transition-all duration-300 group relative overflow-hidden shadow-2xl">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl group-hover:bg-violet-600/15 transition-all duration-500" />
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900/90 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center text-xs font-mono font-bold text-violet-400">
                      04
                    </div>
                    <Clock size={18} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white tracking-tight mb-2">FOCUS</h3>
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                    Create focused sessions and eliminate distractions. Harness optimized intervals to keep your head in deep productive work.
                  </p>
                </div>
              </div>
            </section>

            {/* CONSISTENCY FRAMEWORK (VERTICAL TIMELINE) */}
            <section id="discipline-system" className="px-5 max-w-4xl mx-auto scroll-mt-28">
              <div className="text-center space-y-4 mb-14">
                <div className="inline-flex items-center gap-2 text-violet-400 text-xs font-mono font-semibold tracking-widest uppercase">
                  <Compass size={14} />
                  <span>STEP-BY-STEP METHODOLOGY</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-white">The Consistency Framework</h2>
                <p className="text-xs md:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                  A simplified, systematic lifecycle built to translate daily steps into permanent life habits.
                </p>
              </div>

              <div className="relative border-l border-white/10 ml-4 md:ml-8 space-y-6 md:space-y-8 py-2">
                {/* Glowing vertical connector highlight */}
                <div className="absolute top-0 bottom-0 left-[-1px] w-[2px] bg-gradient-to-b from-violet-500 via-purple-500/40 to-transparent pointer-events-none" />

                {[
                  { num: "01", title: "Build the habit", desc: "Design routines that align precisely with your lifestyle, frequency, and personal ambitions." },
                  { num: "02", title: "Show up consistently", desc: "Complete checklists daily. The core objective is repeating the routine over and over." },
                  { num: "03", title: "Track your progress", desc: "Log achievements instantly inside our streamlined, distraction-free visual dashboard." },
                  { num: "04", title: "Earn XP", desc: "Transform effort into quantifiable system experience. Unlock incremental ranks as milestones." },
                  { num: "05", title: "Level up", desc: "Increase your core system tier. Establish a permanent record of personal focus and discipline." },
                  { num: "06", title: "Keep going", desc: "Protect your streak with safe freezes, adapt to hurdles, and build lifelong automation." }
                ].map((item, idx) => (
                  <div key={idx} className="relative pl-8 md:pl-12 group">
                    {/* Neumorphic Bullet Marker */}
                    <div className="absolute -left-[13px] top-1.5 w-6 h-6 rounded-full bg-[#030303] border border-white/20 group-hover:border-violet-400 transition-all flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                      <div className="w-2 h-2 rounded-full bg-zinc-500 group-hover:bg-violet-400 transition-all group-hover:scale-125" />
                    </div>
                    
                    <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-4 md:p-5 group-hover:border-violet-500/30 group-hover:bg-white/[0.03] transition-all duration-300">
                      <div className="flex items-start gap-3.5">
                        <span className="text-[11px] font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-lg shrink-0 mt-0.5">
                          {item.num}
                        </span>
                        <div className="space-y-1">
                          <h4 className="text-sm md:text-base font-bold text-zinc-100 group-hover:text-white transition-all tracking-tight">
                            {item.title}
                          </h4>
                          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* EVERYTHING YOU NEED TO BUILD HABITS */}
            <section id="features" className="px-5 max-w-5xl mx-auto scroll-mt-28">
              <div className="text-center space-y-4 mb-12 md:mb-16">
                <div className="inline-flex items-center gap-2 text-violet-400 text-xs font-mono font-semibold tracking-widest uppercase">
                  <Zap size={14} />
                  <span>HIGH-PERFORMANCE FEATURES</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-white">
                  Everything you need to build better habits
                </h2>
                <p className="text-xs md:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                  A carefully designed visual landscape with zero bloat. Engineered to help you execute.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {/* Card 1 */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between space-y-5 group shadow-xl">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center text-violet-400 group-hover:scale-105 group-hover:text-violet-300 transition-all">
                    <Check size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-1.5 tracking-tight">HABIT TRACKING</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Track daily routines and consistency. Tailor schedules easily to standard, custom, or weekdays.
                    </p>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between space-y-5 group shadow-xl">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center text-violet-400 group-hover:scale-105 group-hover:text-violet-300 transition-all">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-1.5 tracking-tight">STREAK SYSTEM</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Build momentum without obsessing over perfection. Adapt to hurdles with supportive freeze states.
                    </p>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between space-y-5 group shadow-xl">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center text-violet-400 group-hover:scale-105 group-hover:text-violet-300 transition-all">
                    <Brain size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-1.5 tracking-tight">AI COACH</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Get contextual guidance and motivation. Receive smart summaries of your struggles and triumphs.
                    </p>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between space-y-5 group shadow-xl">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center text-violet-400 group-hover:scale-105 group-hover:text-violet-300 transition-all">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-1.5 tracking-tight">FOCUS SYSTEM</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Create focused work sessions. Set dedicated timers designed to isolate you from notification noise.
                    </p>
                  </div>
                </div>

                {/* Card 5 */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between space-y-5 group shadow-xl">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center text-violet-400 group-hover:scale-105 group-hover:text-violet-300 transition-all">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-1.5 tracking-tight">SMART REMINDERS</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Remember what matters when it matters. Clean alerts configured to match your daily checkpoints.
                    </p>
                  </div>
                </div>

                {/* Card 6 */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between space-y-5 group shadow-xl">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center text-violet-400 group-hover:scale-105 group-hover:text-violet-300 transition-all">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-1.5 tracking-tight">DISCIPLINE INSIGHTS</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Understand your consistency over time. Identify patterns and leverage metrics to make steady changes.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* BEAUTIFULLY ORGANIZED HABITS PREVIEW */}
            <section className="px-5 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-2xl border border-white/[0.08] rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="md:col-span-2 space-y-5 text-center md:text-left relative z-10">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
                    Your habits,<br />beautifully organized.
                  </h3>
                  <div className="space-y-2 text-xs md:text-sm text-zinc-400 leading-relaxed">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-300">
                      <Check size={14} className="text-violet-400" />
                      <span>Track what matters.</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-300">
                      <Check size={14} className="text-violet-400" />
                      <span>See your progress.</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-300">
                      <Check size={14} className="text-violet-400" />
                      <span>Stay consistent.</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-3 relative z-10">
                  {[
                    { name: "Morning Protocol", days: "Every Day", streak: "14 Days" },
                    { name: "Deep Work", days: "Weekdays", streak: "8 Days" },
                    { name: "Physical Training", days: "Custom Days", streak: "21 Days" }
                  ].map((h, i) => (
                    <div key={i} className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between select-none hover:border-violet-500/30 hover:bg-black/80 transition-all duration-300">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs md:text-sm text-zinc-100 flex items-center gap-2">
                          <span>{h.name}</span>
                          <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded">
                            {h.streak}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500">{h.days}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-violet-500/40 bg-violet-500/10 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                        <Check size={14} className="text-violet-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* AI COACH CONVERSATION PREVIEW */}
            <section id="coaching" className="px-5 max-w-4xl mx-auto scroll-mt-28">
              <div className="text-center space-y-3 mb-10">
                <div className="inline-flex items-center gap-2 text-violet-400 text-xs font-mono font-semibold tracking-widest uppercase">
                  <MessageSquare size={14} />
                  <span>INTELLIGENT MENTORSHIP</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-white">Your AI coach. Built around you.</h2>
                <p className="text-xs md:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  OneDay understands your goals, habits and progress to give you practical guidance when you need it.
                </p>
              </div>

              {/* Chat Interface Preview */}
              <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-5 md:p-8 max-w-lg mx-auto space-y-5 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-[11px] font-mono tracking-wider text-violet-300 uppercase font-bold">AI COACH SESSION</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">ONLINE</span>
                </div>

                <div className="space-y-4 text-xs md:text-sm">
                  {/* AI Bubble */}
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center font-bold text-[10px] text-violet-300 shrink-0 select-none">
                      AI
                    </div>
                    <div className="bg-zinc-900/80 border border-white/10 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] text-zinc-300 leading-relaxed shadow-md">
                      "What are we conquering today?"
                    </div>
                  </div>

                  {/* User Bubble */}
                  <div className="flex justify-end gap-2.5">
                    <div className="bg-white text-black font-medium rounded-2xl rounded-tr-none p-3.5 max-w-[85%] text-xs shadow-md">
                      "Build discipline."
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-[10px] text-white shrink-0 select-none">
                      U
                    </div>
                  </div>

                  {/* AI response */}
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center font-bold text-[10px] text-violet-300 shrink-0 select-none">
                      AI
                    </div>
                    <div className="bg-zinc-900/80 border border-white/10 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] text-zinc-300 leading-relaxed shadow-md">
                      "Then don't aim for perfect. Aim for showing up."
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* OUR STORY SECTION */}
            <section id="story" className="px-5 max-w-3xl mx-auto text-center space-y-8 scroll-mt-28">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-violet-400 text-xs font-mono font-semibold tracking-widest uppercase">
                  <BookOpen size={14} />
                  <span>PHILOSOPHY</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                  Our story<br />begins with a simple belief.
                </h2>
                <p className="text-sm md:text-lg text-zinc-400 leading-relaxed">
                  Change happens one day at a time.
                </p>
              </div>

              <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 md:p-12 text-zinc-300 text-xs md:text-sm leading-relaxed text-left space-y-4 max-w-xl mx-auto shadow-2xl relative">
                <div className="absolute top-4 right-6 text-zinc-800 text-5xl font-serif select-none">“</div>
                <p>We wanted a system that didn't overwhelm people with clutter or childish gamification.</p>
                <p className="font-semibold text-white">Something focused.</p>
                <p className="font-semibold text-white">Something disciplined.</p>
                <p>Something that helped you come back stronger after missing a day.</p>
                <p>That's why we built OneDay.</p>
                <p className="font-mono text-[10px] text-violet-400 tracking-widest uppercase font-bold pt-2">ONE DAY AT A TIME.</p>
              </div>
            </section>

            {/* DESIGNED BY STUDENTS SECTION & TEAM CARDS */}
            <section id="about" className="px-5 max-w-6xl mx-auto space-y-16 scroll-mt-28 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="text-center space-y-5 max-w-2xl mx-auto relative z-10">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 text-violet-400 text-xs font-mono font-semibold tracking-widest uppercase bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full"
                >
                  <GraduationCap size={14} />
                  <span>Student Creators</span>
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white"
                >
                  Built with care.
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-sm md:text-base text-zinc-400 leading-relaxed font-medium"
                >
                  We are students of Kendriya Vidyalaya Gachibowli (KVGB). OneDay is built by students who wanted a cleaner, more focused way to build discipline, consistency and better habits.
                </motion.p>
              </div>

              {/* 3 Premium Team Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {/* Team Member 1 */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ y: -6, boxShadow: "0 20px 40px -10px rgba(139, 92, 246, 0.15)" }}
                  transition={{ duration: 0.5 }}
                  className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] hover:border-violet-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-center font-bold text-white text-3xl select-none group-hover:border-violet-500/50 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300">
                    K
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base md:text-lg text-white tracking-tight">Kante Harsha Vardhan</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Founder — Core Idea & Product Vision</p>
                  </div>
                  <p className="text-[13px] text-zinc-400 leading-relaxed font-medium">
                    Focused on the core idea, product vision and overall direction of OneDay. Responsible for shaping the product philosophy, experience and long-term vision behind OneDay.
                  </p>
                </motion.div>

                {/* Team Member 2 */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ y: -6, boxShadow: "0 20px 40px -10px rgba(139, 92, 246, 0.15)" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] hover:border-violet-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-center font-bold text-white text-3xl select-none group-hover:border-violet-500/50 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300">
                    V
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base md:text-lg text-white tracking-tight">Vemuri Venkata Vikhyath</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Feature Strategy & Systems Planning</p>
                  </div>
                  <p className="text-[13px] text-zinc-400 leading-relaxed font-medium">
                    Focused on planning features, shaping product updates and translating ideas into practical systems. Works closely with the backend and product architecture to plan how new capabilities should evolve.
                  </p>
                </motion.div>

                {/* Team Member 3 */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ y: -6, boxShadow: "0 20px 40px -10px rgba(139, 92, 246, 0.15)" }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] hover:border-violet-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-center font-bold text-white text-3xl select-none group-hover:border-violet-500/50 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300">
                    R
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base md:text-lg text-white tracking-tight">Ravuru Trinay Karthik Ram</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Design & User Experience</p>
                  </div>
                  <p className="text-[13px] text-zinc-400 leading-relaxed font-medium">
                    Focused on designing the pages and creating a minimal, premium and intuitive user experience. Responsible for visual consistency, layout, interaction design and the overall feel of OneDay.
                  </p>
                </motion.div>
              </div>
            </section>

            {/* FINAL CTA SECTION */}
            <section className="px-5 max-w-5xl mx-auto py-16 md:py-24 relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative overflow-hidden bg-gradient-to-b from-white/[0.04] to-black border border-white/[0.08] rounded-[2.5rem] md:rounded-[3.5rem] p-10 md:p-20 text-center space-y-10 shadow-[0_30px_100px_-20px_rgba(139,92,246,0.2)]"
              >
                {/* Subtle Animated Background Glows */}
                <motion.div 
                  animate={{ 
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" 
                />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
                
                <div className="space-y-4 relative z-10">
                  <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/60 drop-shadow-sm">
                    Start with one day.
                  </h2>
                  <p className="text-sm md:text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto font-medium">
                    You don't need to change everything today.<br className="hidden md:block"/> You just need to start.
                  </p>
                </div>
                
                <div className="relative z-10 flex justify-center">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openAuthModal}
                    className="group bg-white text-black px-10 py-5 rounded-full text-base font-bold tracking-tight shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] cursor-pointer inline-flex items-center gap-3 transition-all duration-300"
                  >
                    <span>Start Your Journey</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-300 ease-out" />
                  </motion.button>
                </div>
              </motion.div>
            </section>
          </main>

          {/* FOOTER */}
          <footer className="py-12 border-t border-white/10 bg-black/90 relative z-10 mt-16">
            <div className="max-w-5xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
              <div className="space-y-1.5">
                <div className="text-sm font-bold text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
                  <MonolithLogo size={20} />
                  <span>OneDay</span>
                </div>
                <p className="text-xs text-zinc-500">Build better habits. One day at a time.</p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-xs text-zinc-500 font-medium">
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
                <span className="text-zinc-600 text-[10px] md:text-xs">© 2026 OneDay. All rights reserved.</span>
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
                  className="absolute inset-0 bg-black/85 backdrop-blur-md"
                  onClick={() => {
                    if (!authLoading) {
                      setShowAuthModal(false);
                      setTermsAccepted(false);
                      setIsChecked(false);
                    }
                  }}
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="relative bg-[#09090d] border border-white/10 rounded-3xl p-7 md:p-9 max-w-md w-full shadow-2xl space-y-6 z-10"
                >
                  <div className="flex flex-col items-center gap-3 text-center pb-2 select-none">
                    <div className="p-2 rounded-2xl bg-white/[0.04] border border-white/10">
                      <MonolithLogo size={42} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold tracking-[0.2em] text-white">ONE DAY</h3>
                      <p className="text-violet-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                        {!termsAccepted ? "Step 1: Consent" : "Step 2: Authenticate"}
                      </p>
                    </div>
                  </div>

                  {!termsAccepted ? (
                    <div className="space-y-4">
                      <div className="text-xs text-zinc-300 space-y-2 leading-relaxed">
                        <p className="font-semibold text-white">Terms & Conditions Consent</p>
                        <p className="text-zinc-400">
                          Before continuing to account authentication on the OneDay platform, you must explicitly read and agree to our Terms and Policies.
                        </p>
                      </div>

                      {/* CHECKBOX AND AGREEMENT */}
                      <div className="flex items-start gap-3 text-left bg-zinc-950/80 border border-white/10 rounded-xl p-3.5">
                        <input 
                          type="checkbox" 
                          id="agree-policies"
                          checked={isChecked}
                          onChange={(e) => setIsChecked(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded border-zinc-700 bg-black text-violet-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-violet-600"
                        />
                        <label htmlFor="agree-policies" className="text-[11px] text-zinc-400 leading-normal cursor-pointer select-none">
                          I have read and agree to the{" "}
                          <button 
                            onClick={() => { setView("terms"); setShowAuthModal(false); window.scrollTo({ top: 0 }); }} 
                            className="text-white hover:underline font-semibold cursor-pointer inline-block"
                          >
                            Terms & Conditions
                          </button>{" "}
                          and{" "}
                          <button 
                            onClick={() => { setView("privacy"); setShowAuthModal(false); window.scrollTo({ top: 0 }); }} 
                            className="text-white hover:underline font-semibold cursor-pointer inline-block"
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
                        className="w-full bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-wider cursor-pointer shadow-lg"
                      >
                        Accept & Continue
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2.5">
                        <button 
                          onClick={handleGoogleLogin}
                          disabled={authLoading}
                          className="w-full bg-white text-black font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs tracking-tight cursor-pointer shadow-lg"
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
                          className="w-full bg-zinc-900 border border-white/10 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs tracking-tight cursor-pointer"
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
                          className="w-full text-center text-[11px] text-zinc-500 hover:text-white transition-colors cursor-pointer block"
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

export default LandingScreen;
