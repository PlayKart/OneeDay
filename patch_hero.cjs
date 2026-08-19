const fs = require('fs');
let code = fs.readFileSync('src/components/screens/LandingScreen.tsx', 'utf8');

const heroStart = `            {/* HERO SECTION */}`;
const heroEnd = `            {/* PRODUCT VALUE SYSTEM SECTION */}`;

const newHero = `            {/* HERO SECTION */}
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

`;

let startIndex = code.indexOf(heroStart);
let endIndex = code.indexOf(heroEnd);
if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newHero + code.substring(endIndex);
  fs.writeFileSync('src/components/screens/LandingScreen.tsx', code);
  console.log("Patched hero section");
} else {
  console.error("Could not find hero boundaries");
}
