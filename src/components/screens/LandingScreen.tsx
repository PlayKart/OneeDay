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
  ChevronRight
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
          className="min-h-screen bg-[#030303] text-white selection:bg-white/20 font-sans w-full overflow-x-hidden pb-12"
        >
          {/* STICKY HEADER */}
          <header className="sticky top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-900 h-16 md:h-20 flex items-center px-5 md:px-12 transition-all">
            <nav className="max-w-7xl mx-auto w-full flex justify-between items-center" aria-label="Main Navigation">
              <div className="flex items-center gap-2.5 select-none cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <MonolithLogo size={28} />
                <span className="text-lg md:text-xl font-bold tracking-tighter text-white">OneDay</span>
              </div>
              
              <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors cursor-pointer">Features</button>
                <button onClick={() => scrollToSection("coaching")} className="hover:text-white transition-colors cursor-pointer">AI Coach</button>
                <button onClick={() => scrollToSection("discipline-system")} className="hover:text-white transition-colors cursor-pointer">Protocol</button>
                <button onClick={() => scrollToSection("about")} className="hover:text-white transition-colors cursor-pointer">Team</button>
              </div>

              <button 
                onClick={openAuthModal}
                className="bg-white text-black px-5 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-semibold tracking-tight hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                Start Now
              </button>
            </nav>
          </header>

          <main className="space-y-16 md:space-y-32">
            {/* HERO SECTION */}
            <section className="relative pt-10 md:pt-16 pb-12 px-5 max-w-5xl mx-auto flex flex-col justify-center text-center">
              <div className="space-y-6 md:space-y-8">
                <div className="inline-flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800/80 px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-semibold tracking-wider text-zinc-300 uppercase mx-auto select-none">
                  <Sparkles size={12} className="text-zinc-400" />
                  ONE DAY AT A TIME.
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-white">
                  Build better habits.<br />
                  <span className="text-zinc-400">Become harder to stop.</span>
                </h1>

                <p className="text-sm md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                  OneDay combines habit tracking, intelligent coaching, focus tools, streaks and progression into one personal system for building consistency.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-xs sm:max-w-md mx-auto">
                  <button 
                    onClick={openAuthModal}
                    className="w-full sm:w-auto bg-white text-black px-8 py-3.5 rounded-full text-sm font-semibold tracking-tight hover:bg-zinc-200 active:scale-95 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.08)] cursor-pointer"
                  >
                    Start Your Journey
                  </button>
                  <button 
                    onClick={() => scrollToSection("product-system")}
                    className="w-full sm:w-auto bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800/80 border border-zinc-800/80 px-8 py-3.5 rounded-full text-sm font-semibold tracking-tight transition-all cursor-pointer"
                  >
                    Explore Features
                  </button>
                </div>
              </div>
            </section>

            {/* PRODUCT VALUE SYSTEM SECTION */}
            <section id="product-system" className="px-5 max-w-5xl mx-auto">
              <div className="text-center space-y-4 max-w-2xl mx-auto mb-10 md:mb-16">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
                  A Complete Productivity<br />& Mindset System
                </h2>
                <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                  OneDay is more than a habit tracker. It is a personal system designed to help you build discipline, maintain consistency and make meaningful progress every day.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {/* CARD 1 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl md:rounded-[2rem] p-6 md:p-8 hover:border-zinc-800 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-mono text-zinc-600 font-bold">01</span>
                    <h3 className="text-base md:text-lg font-bold text-white tracking-tight">HABIT SYSTEM</h3>
                  </div>
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                    Build routines that fit your actual schedule. Establish visual, clean, and flexible daily tracking lists customized for your lifestyle.
                  </p>
                </div>

                {/* CARD 2 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl md:rounded-[2rem] p-6 md:p-8 hover:border-zinc-800 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-mono text-zinc-600 font-bold">02</span>
                    <h3 className="text-base md:text-lg font-bold text-white tracking-tight">AI COACH</h3>
                  </div>
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                    Get personalized guidance based on your goals and progress. Converse with a dedicated mentor aligned with your discipline roadmap.
                  </p>
                </div>

                {/* CARD 3 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl md:rounded-[2rem] p-6 md:p-8 hover:border-zinc-800 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-mono text-zinc-600 font-bold">03</span>
                    <h3 className="text-base md:text-lg font-bold text-white tracking-tight">PROGRESSION</h3>
                  </div>
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                    Turn consistency into XP, levels and measurable growth. Gamify consistency elegantly without childish distractions.
                  </p>
                </div>

                {/* CARD 4 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl md:rounded-[2rem] p-6 md:p-8 hover:border-zinc-800 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-mono text-zinc-600 font-bold">04</span>
                    <h3 className="text-base md:text-lg font-bold text-white tracking-tight">FOCUS</h3>
                  </div>
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                    Create focused sessions and eliminate distractions. Harness optimized intervals to keep your head in deep productive work.
                  </p>
                </div>
              </div>
            </section>

            {/* CONSISTENCY FRAMEWORK (VERTICAL TIMELINE) */}
            <section className="px-5 max-w-4xl mx-auto">
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">The Consistency Framework</h2>
                <p className="text-xs md:text-sm text-zinc-400 max-w-lg mx-auto">
                  A simplified, systematic lifecycle built to translate daily steps into permanent life habits.
                </p>
              </div>

              <div className="relative border-l border-zinc-900 ml-3 md:ml-6 space-y-8 py-2">
                {[
                  { num: "01", title: "Build the habit", desc: "Design routines that align precisely with your lifestyle, frequency, and personal ambitions." },
                  { num: "02", title: "Show up consistently", desc: "Complete checklists daily. The core objective is repeating the routine over and over." },
                  { num: "03", title: "Track your progress", desc: "Log achievements instantly inside our streamlined, distraction-free visual dashboard." },
                  { num: "04", title: "Earn XP", desc: "Transform effort into quantifiable system experience. Unlock incremental ranks as milestones." },
                  { num: "05", title: "Level up", desc: "Increase your core system tier. Establish a permanent record of personal focus and discipline." },
                  { num: "06", title: "Keep going", desc: "Protect your streak with safe freezes, adapt to hurdles, and build lifelong automation." }
                ].map((item, idx) => (
                  <div key={idx} className="relative pl-8 md:pl-12 group">
                    {/* Bullet marker */}
                    <div className="absolute -left-[13px] top-1.5 w-6 h-6 rounded-full bg-[#030303] border-2 border-zinc-800 group-hover:border-white transition-all flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 group-hover:bg-white transition-all" />
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <span className="text-xs font-mono font-bold text-zinc-600 bg-zinc-900/50 border border-zinc-800/40 px-2 py-0.5 rounded">
                        {item.num}
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm md:text-base font-bold text-zinc-200 group-hover:text-white transition-all">
                          {item.title}
                        </h4>
                        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* EVERYTHING YOU NEED TO BUILD HABITS */}
            <section id="features" className="px-5 max-w-5xl mx-auto">
              <div className="text-center space-y-4 mb-10 md:mb-16">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
                  Everything you need to build better habits
                </h2>
                <p className="text-xs md:text-sm text-zinc-400 max-w-lg mx-auto">
                  A carefully designed visual landscape with zero bloat. Engineered to help you execute.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {/* Card 1 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 hover:border-zinc-800 transition-all flex flex-col justify-between space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-white">
                    <Check size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-1.5">HABIT TRACKING</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Track daily routines and consistency. Tailor schedules easily to standard, custom, or weekdays.
                    </p>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 hover:border-zinc-800 transition-all flex flex-col justify-between space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-white">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-1.5">STREAK SYSTEM</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Build momentum without obsessing over perfection. Adapt to hurdles with supportive freeze states.
                    </p>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 hover:border-zinc-800 transition-all flex flex-col justify-between space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-white">
                    <Brain size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-1.5">AI COACH</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Get contextual guidance and motivation. Receive smart summaries of your struggles and triumphs.
                    </p>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 hover:border-zinc-800 transition-all flex flex-col justify-between space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-white">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-1.5">FOCUS SYSTEM</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Create focused work sessions. Set dedicated timers designed to isolate you from notification noise.
                    </p>
                  </div>
                </div>

                {/* Card 5 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 hover:border-zinc-800 transition-all flex flex-col justify-between space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-white">
                    <Target size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-1.5">SMART REMINDERS</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Remember what matters when it matters. Clean alerts configured to match your daily checkpoints.
                    </p>
                  </div>
                </div>

                {/* Card 6 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 hover:border-zinc-800 transition-all flex flex-col justify-between space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-white">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-1.5">DISCIPLINE INSIGHTS</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Understand your consistency over time. Identify patterns and leverage metrics to make steady changes.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* BEAUTIFULLY ORGANIZED HABITS PREVIEW */}
            <section className="px-5 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center bg-[#070707] border border-zinc-900 rounded-[2rem] p-6 md:p-10">
                <div className="md:col-span-2 space-y-4 text-center md:text-left">
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                    Your habits,<br />beautifully organized.
                  </h3>
                  <div className="space-y-1.5 text-xs text-zinc-400 leading-relaxed">
                    <p>• Track what matters.</p>
                    <p>• See your progress.</p>
                    <p>• Stay consistent.</p>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-3">
                  {[
                    { name: "Morning Protocol", days: "Every Day" },
                    { name: "Deep Work", days: "Weekdays" },
                    { name: "Physical Training", days: "Custom Days" }
                  ].map((h, i) => (
                    <div key={i} className="bg-black/40 border border-zinc-900 rounded-xl p-4 flex items-center justify-between select-none hover:border-zinc-800 transition-all">
                      <div>
                        <div className="font-semibold text-xs md:text-sm text-zinc-100">{h.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{h.days}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* AI COACH CONVERSATION PREVIEW */}
            <section id="coaching" className="px-5 max-w-4xl mx-auto">
              <div className="text-center space-y-3 mb-10">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">Your AI coach. Built around you.</h2>
                <p className="text-xs md:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  OneDay understands your goals, habits and progress to give you practical guidance when you need it.
                </p>
              </div>

              {/* Chat Interface Preview */}
              <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2rem] p-5 md:p-8 max-w-lg mx-auto space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-500 animate-pulse" />
                  <span className="text-[11px] font-mono tracking-wider text-zinc-500 uppercase font-bold">AI COACH SESSION</span>
                </div>

                <div className="space-y-4 text-xs md:text-sm">
                  {/* AI Bubble */}
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center font-bold text-[10px] text-zinc-400 border border-zinc-800 select-none">
                      AI
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] text-zinc-300">
                      "What are we conquering today?"
                    </div>
                  </div>

                  {/* User Bubble */}
                  <div className="flex justify-end gap-2">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tr-none p-3.5 max-w-[85%] text-zinc-200">
                      "Build discipline."
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-[10px] text-black select-none">
                      U
                    </div>
                  </div>

                  {/* AI response */}
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center font-bold text-[10px] text-zinc-400 border border-zinc-800 select-none">
                      AI
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] text-zinc-300">
                      "Then don't aim for perfect. Aim for showing up."
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* OUR STORY SECTION */}
            <section id="story" className="px-5 max-w-3xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white leading-tight">
                  Our story<br />begins with a simple belief.
                </h2>
                <p className="text-sm md:text-lg text-zinc-400 leading-relaxed">
                  Change happens one day at a time.
                </p>
              </div>

              <div className="bg-[#0a0a0a]/50 border border-zinc-900 rounded-[2rem] p-6 md:p-12 text-zinc-300 text-xs md:text-sm leading-relaxed text-left space-y-4 max-w-xl mx-auto">
                <p>We wanted a system that didn't overwhelm people with clutter or childish gamification.</p>
                <p className="font-semibold text-white">Something focused.</p>
                <p className="font-semibold text-white">Something disciplined.</p>
                <p>Something that helped you come back stronger after missing a day.</p>
                <p>That's why we built OneDay.</p>
                <p className="font-mono text-[10px] text-zinc-500 tracking-wider">ONE DAY AT A TIME.</p>
              </div>
            </section>

            {/* DESIGNED BY STUDENTS SECTION & TEAM CARDS */}
            <section id="about" className="px-5 max-w-5xl mx-auto space-y-12">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">Built with care.</h2>
                <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                  OneDay is built by students who wanted a cleaner, more focused way to build discipline, consistency and better habits.
                </p>
                <div className="inline-block bg-zinc-900/40 border border-zinc-800/50 rounded-full px-4 py-1 text-[11px] md:text-xs text-zinc-300 font-medium">
                  We are students of: <strong className="text-white">Kendriya Vidyalaya Gachibowli (KVGB)</strong>
                </div>
              </div>

              {/* 3 Premium Team Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Team Member 1 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[24px] p-6 md:p-8 flex flex-col items-center text-center space-y-4 hover:border-zinc-800 transition-all">
                  <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white text-lg select-none shadow-sm">
                    K
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm md:text-base text-white tracking-tight">Kante Harsha Vardhan</h3>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">Founder — Core Idea & Product Vision</p>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-[250px]">
                    Focused on the core idea, product vision and overall direction of OneDay. Responsible for shaping the product philosophy, experience and long-term vision behind OneDay.
                  </p>
                </div>

                {/* Team Member 2 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[24px] p-6 md:p-8 flex flex-col items-center text-center space-y-4 hover:border-zinc-800 transition-all">
                  <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white text-lg select-none shadow-sm">
                    V
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm md:text-base text-white tracking-tight">Vemuri Venkata Vikhyath</h3>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">Feature Strategy & Systems Planning</p>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-[250px]">
                    Focused on planning features, shaping product updates and translating ideas into practical systems. Works closely with the backend and product architecture to plan how new capabilities should evolve.
                  </p>
                </div>

                {/* Team Member 3 */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[24px] p-6 md:p-8 flex flex-col items-center text-center space-y-4 hover:border-zinc-800 transition-all">
                  <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white text-lg select-none shadow-sm">
                    R
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm md:text-base text-white tracking-tight">Ravuru Trinay Karthik Ram</h3>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">Design & User Experience</p>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-[250px]">
                    Focused on designing the pages and creating a minimal, premium and intuitive user experience. Responsible for visual consistency, layout, interaction design and the overall feel of OneDay.
                  </p>
                </div>
              </div>

              {/* Subtle school section below the team */}
              <div className="pt-6 border-t border-zinc-900 max-w-md mx-auto text-center space-y-2">
                <span className="text-[10px] font-mono tracking-widest text-zinc-600 font-bold uppercase block">BUILT BY STUDENTS</span>
                <p className="text-xs font-bold text-zinc-300">Kendriya Vidyalaya Gachibowli (KVGB)</p>
                <p className="text-[11px] text-zinc-500">Built by students. Designed for students. Created to make consistency simpler.</p>
              </div>
            </section>

            {/* FINAL CTA SECTION */}
            <section className="px-5 max-w-4xl mx-auto py-8">
              <div className="bg-gradient-to-b from-zinc-950 to-black border border-zinc-900 rounded-[2.5rem] p-8 md:p-14 text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">Start with one day.</h2>
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                    You don't need to change everything today. You just need to start.
                  </p>
                </div>
                <div>
                  <button 
                    onClick={openAuthModal}
                    className="bg-white text-black px-10 py-4 rounded-full text-sm font-semibold tracking-tight hover:bg-zinc-200 active:scale-95 transition-all shadow-[0_4px_25px_rgba(255,255,255,0.08)] cursor-pointer"
                  >
                    Start Your Journey
                  </button>
                </div>
              </div>
            </section>
          </main>

          {/* FOOTER */}
          <footer className="py-12 border-t border-zinc-900 bg-black mt-12">
            <div className="max-w-5xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
              <div className="space-y-1.5">
                <div className="text-sm font-bold text-white tracking-tight">OneDay</div>
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
                  className="relative bg-[#0a0a0a] border border-zinc-900 rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6"
                >
                  <div className="flex flex-col items-center gap-3 text-center pb-2 select-none">
                    <MonolithLogo size={48} />
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold tracking-[0.2em] text-white">ONE DAY</h3>
                      <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">
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
                      <div className="flex items-start gap-3 text-left bg-zinc-950 border border-zinc-900 rounded-xl p-3.5">
                        <input 
                          type="checkbox" 
                          id="agree-policies"
                          checked={isChecked}
                          onChange={(e) => setIsChecked(e.target.checked)}
                          className="mt-1 w-3.5 h-3.5 rounded border-zinc-800 bg-black text-white focus:ring-0 focus:ring-offset-0 cursor-pointer accent-white"
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
                        className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-wider cursor-pointer"
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
                          className="w-full bg-white text-black font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs tracking-tight cursor-pointer"
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
                          className="w-full bg-zinc-900 border border-zinc-800 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs tracking-tight cursor-pointer"
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
