import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { User, Check, Shield } from "lucide-react";
import { toast } from "react-hot-toast";

interface LandingScreenProps {
  onLoginSuccess: () => void;
}

export function LandingScreen({ onLoginSuccess }: LandingScreenProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Dynamic Page Title SEO optimization: changes title as user scrolls sections
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
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLoginSuccess();
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/unauthorized-domain') {
         toast.error(`Please add ${window.location.hostname} to your Firebase authorized domains.`);
      } else {
         toast.error("LOGIN FAILED. RETRY.");
      }
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
      onLoginSuccess();
    } catch (error) {
      console.error("Guest login failed:", error);
      toast.error("GUEST LOGIN FAILED.");
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white/30 font-sans w-full overflow-x-hidden">
      {/* SEMANTIC HEADER & NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#000000]/80 backdrop-blur-xl border-b border-white/5 h-20 flex items-center px-6 md:px-12">
        <nav className="max-w-7xl mx-auto w-full flex justify-between items-center" aria-label="Main Navigation">
          <div className="text-xl font-extrabold tracking-tighter">OneDay</div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors cursor-pointer">Features</button>
            <button onClick={() => scrollToSection("about")} className="hover:text-white transition-colors cursor-pointer">About</button>
            <button onClick={() => scrollToSection("discipline-system")} className="hover:text-white transition-colors cursor-pointer">Protocol</button>
          </div>

          <button 
            onClick={() => setShowAuthModal(true)}
            className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold tracking-tight hover:bg-slate-200 transition-all transform hover:scale-105 cursor-pointer"
          >
            Start Now
          </button>
        </nav>
      </header>

      {/* SEMANTIC MAIN LANDMARKS */}
      <main>
        {/* HERO SECTION */}
        <section className="pt-48 pb-32 px-6 bg-gradient-to-b from-[#0a0a0a] to-black min-h-[90vh] flex flex-col justify-center">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6-7xl md:text-8xl font-black tracking-tighter leading-[1.1] bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/50"
            >
              Small steps.<br/>Big change.
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <p className="text-xl md:text-2xl text-slate-400 font-medium tracking-tight">
                Build your habits OneDay at a time.
              </p>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Your personal AI-powered daily growth companion.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-8"
            >
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-white text-black px-12 py-5 rounded-full text-lg font-bold tracking-tight hover:bg-slate-200 transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.15)] cursor-pointer"
              >
                Start Your Journey
              </button>
            </motion.div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-7xl mx-auto space-y-24">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
                Everything you need to build better habits
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed">
                Track your progress, stay focused, and get motivated with AI-powered insights
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-12 hover:border-white/20 transition-colors group">
                <div className="w-16 h-16 bg-white border border-white/10 rounded-2xl flex items-center justify-center mb-8 transform group-hover:scale-110 transition-transform">
                   <Check size={32} className="text-black" />
                </div>
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold tracking-tight">Systematic Progress</h3>
                  <ul className="space-y-4">
                    {["Habit tracking", "Progress tracking", "Streak system", "Daily consistency"].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <span className="text-lg">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-12 hover:border-white/20 transition-colors group">
                <div className="w-16 h-16 bg-white border border-white/10 rounded-2xl flex items-center justify-center mb-8 transform group-hover:scale-110 transition-transform">
                   <Shield size={32} className="text-black" />
                </div>
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold tracking-tight">Intelligence & Focus</h3>
                  <ul className="space-y-4">
                    {["AI Coach", "Focus system", "Smart reminders", "Discipline insights"].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <span className="text-lg">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ORGANIZED HABITS SECTION */}
        <section className="py-32 px-6 bg-[#030303]">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
                Your habits, beautifully organized
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
                See your progress at a glance with our intuitive dashboard. Track streaks, monitor consistency, and celebrate your wins.
              </p>
              <button 
                onClick={() => scrollToSection("features")}
                className="mt-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3 rounded-full text-sm font-bold tracking-tight transition-all cursor-pointer"
              >
                Explore Features
              </button>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-8 md:p-12 max-w-5xl mx-auto overflow-hidden shadow-2xl relative group">
               <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="space-y-4">
                  {[
                    { name: "Morning Protocol", days: "Every Day" },
                    { name: "Deep Work", days: "Weekdays" },
                    { name: "Physical Training", days: "Custom Days" }
                  ].map((h, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center justify-between">
                       <div>
                         <div className="font-bold text-lg">{h.name}</div>
                         <div className="text-sm font-medium text-slate-500 mt-1">{h.days}</div>
                       </div>
                       <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-white/20" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-40 px-6">
          <div className="max-w-5xl mx-auto space-y-32">
            
            <div className="text-center space-y-12">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40">
                Our story begins<br />with a simple belief
              </h2>
              <p className="text-2xl text-slate-400 font-medium leading-relaxed max-w-3xl mx-auto">
                Change happens one day at a time. We're here to make that journey more mindful, more achievable, and more rewarding.
              </p>
            </div>

            {/* FOUNDER STORY */}
            <div className="space-y-16">
              <div className="text-center space-y-4">
                 <h3 className="text-3xl font-bold tracking-tight">How OneDay was born</h3>
                 <p className="text-lg text-slate-500">The story behind our mission to simplify self-improvement</p>
              </div>

              <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-12 md:p-20 text-center space-y-12">
                 <div className="w-24 h-24 mx-auto rounded-full bg-white flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                    <User size={40} className="text-black" />
                 </div>
                 
                 <div className="space-y-8 text-xl text-slate-300 leading-relaxed font-medium max-w-3xl mx-auto text-left">
                    <p>As students, we were constantly struggling with consistency. Balancing studies, side projects, and personal goals felt impossible when every habit app out there either looked like a corporate spreadsheet or tried to gamify life with childish features.</p>
                    
                    <p>We wanted something cleaner. Something that didn't judge us for missing a day, but gave us the tools and the clear, premium environment to get back on track. We realized that true discipline isn't about perfection—it's about waking up and trying again. One day at a time.</p>
                    
                    <p>That's why we built OneDay. No clutter, no pressure, just an elite system designed to help you focus, combined with an AI coach that actually understands the struggles of building a routine. It's the app we needed, and we built it for you.</p>
                 </div>
              </div>
            </div>

            {/* TEAM SECTION */}
            <div className="space-y-16 pt-16">
              <div className="text-center space-y-4">
                 <h3 className="text-3xl font-bold tracking-tight">Built with care</h3>
                 <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                   OneDay is crafted by a small dedicated team focused on discipline, growth, and mindful technology.
                 </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 {[
                   { name: "Harsha", role: "Founder & Product Vision", desc: "Focused on building a premium self-improvement experience for students and creators." },
                   { name: "Vikhyath", role: "Development & Systems", desc: "Focused on engineering, backend systems, and making OneDay reliable and scalable." },
                   { name: "Trinay", role: "Design & Experience", desc: "Focused on creating a minimal, premium, and emotionally engaging user experience." }
                 ].map((member, i) => (
                   <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 text-center space-y-6 hover:border-white/20 transition-colors group">
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xl group-hover:bg-white group-hover:text-black transition-colors">
                         {member.name[0]}
                      </div>
                      <div>
                        <div className="text-xl font-bold">{member.name}</div>
                        <div className="text-sm text-slate-400 mt-2 font-medium">{member.role}</div>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        {member.desc}
                      </p>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </section>

        {/* SEMANTIC & PERSISTENT SEO SYSTEM DESCRIPTION SECTION (Naturally integrated keywords) */}
        <section id="discipline-system" className="py-32 px-6 border-t border-white/5 bg-[#020202]">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter">
                A Complete Productivity & Mindset System
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed font-normal">
                OneDay is more than just a checkbox grid. It is a modern, high-performance <strong>AI habit tracker</strong> that integrates advanced behavioral science to facilitate sustainable <strong>discipline building</strong> and absolute <strong>daily consistency</strong>.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                Our unique <strong>streak tracking</strong> protocol and intelligent AI coaching engine work hand-in-hand to monitor your focus. By transforming how you commit to positive routines, you scale your level of engagement, protect details of your streak from unexpected lapses with safety freezes, and unlock deeper productivity.
              </p>
            </div>
            <div className="space-y-6 bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-md">
              <h3 className="text-xl font-bold tracking-tight">The Consistency Framework</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 flex-shrink-0" />
                  <span className="text-sm text-slate-400"><strong>Advanced Streak Tracking:</strong> Real-time calculated logic that monitors active participation and rewards persistent commitment.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 flex-shrink-0" />
                  <span className="text-sm text-slate-400"><strong>Intelligent AI Habit Tracker:</strong> Contextual dialogue with your AI mentor to receive custom motivational analysis and tailored strategic feedback.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 flex-shrink-0" />
                  <span className="text-sm text-slate-400"><strong>Engineered Discipline Building:</strong> Flexible scheduling (Weekdays, Weekends, Custom Days) built on clear visual grids to make focus effortless.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 flex-shrink-0" />
                  <span className="text-sm text-slate-400"><strong>Global PWA Mobility:</strong> Native touch responsiveness, offline service worker caching, and high-performance layout rendering for instant access anywhere.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/10 text-center text-slate-600 text-sm relative z-10 bg-black">
         <p>© {new Date().getFullYear()} OneDay. All rights reserved.</p>
      </footer>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowAuthModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-8"
            >
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-extrabold tracking-tight">Welcome</h3>
                <p className="text-slate-500 font-medium">Log in to continue your journey.</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-all text-sm tracking-tight cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#000000"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#000000"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#000000"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#000000"/>
                  </svg>
                  Continue with Google
                </button>
                <button 
                  onClick={handleGuestLogin}
                  className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all text-sm tracking-tight cursor-pointer"
                >
                  <User size={20} />
                  Continue as Guest
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
