const fs = require('fs');
let code = fs.readFileSync('src/components/screens/LandingScreen.tsx', 'utf8');

// Replace TEAM CARDS SECTION
const teamCardsStart = `            {/* DESIGNED BY STUDENTS SECTION & TEAM CARDS */}`;
const teamCardsEnd = `            {/* FINAL CTA SECTION */}`;

const newTeamSection = `            {/* DESIGNED BY STUDENTS SECTION & TEAM CARDS */}
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

`;

const ctaStart = `            {/* FINAL CTA SECTION */}`;
const ctaEnd = `          </main>`;

const newCtaSection = `            {/* FINAL CTA SECTION */}
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
`;

let startIndex = code.indexOf(teamCardsStart);
let endIndex = code.indexOf(teamCardsEnd);
if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newTeamSection + code.substring(endIndex);
}

startIndex = code.indexOf(ctaStart);
endIndex = code.indexOf(ctaEnd);
if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newCtaSection + code.substring(endIndex);
}

fs.writeFileSync('src/components/screens/LandingScreen.tsx', code);
