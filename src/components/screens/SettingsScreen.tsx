import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut, User as UserIcon, Shield, Trash2, ShieldCheck, ChevronRight, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { BrandLogo } from "../BrandLogo";

export function SettingsScreen() {
  const { user, firebaseUser, freezeStreak, deactivateFreeze, selectedLogoStyle, setSelectedLogoStyle } = useStore();
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);
  const [freezeDays, setFreezeDays] = useState(7);
  const [activating, setActivating] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // Reset the "Confirm" timer for settings shield deactivation after 3 seconds
  useEffect(() => {
    if (!confirmDeactivate) return;
    const timer = setTimeout(() => {
      setConfirmDeactivate(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [confirmDeactivate]);

  if (!user) return null;

  const isFrozen = user.freeze_until && new Date(user.freeze_until) > new Date();

  const handleActivateShield = async () => {
    try {
      setActivating(true);
      await freezeStreak(freezeDays);
      setShowFreezeConfirm(false);
      toast.success(`Streak frozen for ${freezeDays} days!`);
    } catch (e: any) {
      console.error("Streak freeze activation failed", e);
      toast.error("Failed to activate streak shield.");
    } finally {
      setActivating(false);
    }
  };

  const previewEndDate = new Date(Date.now() + freezeDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 md:p-8 max-w-2xl mx-auto space-y-10 relative"
    >
      <header className="pt-4">
        <h1 className="text-3xl font-display font-light tracking-tight text-white">Settings</h1>
        <p className="text-slate-500 text-[9px] tracking-[0.25em] uppercase font-bold mt-1">
          System Preferences
        </p>
      </header>

      {/* Account Section */}
      <section className="space-y-3">
        <h2 className="text-[9px] font-black tracking-widest uppercase text-slate-500 ml-2">Account</h2>
        <div className="gemini-card rounded-[1.5rem] overflow-hidden divide-y divide-white/[0.03]">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center">
                  {firebaseUser?.photoURL ? (
                     <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                     <UserIcon className="w-5 h-5 text-white" />
                  )}
               </div>
               <div className="space-y-0.5">
                 <div className="font-bold text-sm text-slate-200">{user.name || "Guest"}</div>
                 <div className="text-[10px] text-slate-500 font-mono">{firebaseUser?.email || "Anonymous Account"}</div>
               </div>
            </div>
            <div className="text-[9px] font-extrabold uppercase tracking-widest bg-white/10 border border-white/20 px-3 py-1 rounded-full text-white">
               Level {user.level}
            </div>
          </div>
          <button 
             onClick={() => signOut(auth)}
             className="w-full p-4 flex items-center justify-between text-slate-300 hover:bg-white/[0.02] transition-all group cursor-pointer"
          >
             <div className="flex items-center gap-3">
               <LogOut size={15} className="text-red-400/80 group-hover:text-red-400 transition-colors" />
               <span className="text-xs font-bold text-red-400/80 group-hover:text-red-400 transition-colors uppercase tracking-wider">Sign Out</span>
             </div>
             <ChevronRight size={15} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
          </button>
        </div>
      </section>

      {/* Protection Section */}
      <section className="space-y-3">
        <h2 className="text-[9px] font-black tracking-widest uppercase text-slate-500 ml-2">Protection</h2>
        <div className="gemini-card rounded-[1.5rem] overflow-hidden">
          <div className="p-5 flex items-center justify-between gap-4">
             <div className="flex items-start gap-4">
               <div className="mt-0.5">
                 <Shield size={18} className={isFrozen ? "text-white animate-pulse" : "text-slate-500"} />
               </div>
               <div className="space-y-1">
                 <div className="text-xs font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-2.5">
                   Streak Shield
                   {isFrozen && (
                     <span className="text-[8px] font-black uppercase text-white bg-white/10 border border-white/20 px-1.5 py-0.5 rounded-full tracking-wider animate-pulse">
                       Active
                     </span>
                   )}
                 </div>
                 <p className="text-xs text-slate-500 leading-relaxed font-light">
                   {isFrozen 
                     ? `Protected until ${new Date(user.freeze_until || "").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                     : "Temporarily freeze your streak and preserve your discipline system during holidays or emergency breaks."}
                 </p>
               </div>
             </div>
             
             {isFrozen ? (
               <button
                  onClick={async () => {
                    if (!confirmDeactivate) {
                      setConfirmDeactivate(true);
                      return;
                    }
                    try {
                      setDeactivating(true);
                      await deactivateFreeze();
                      toast.success("Streak Shield deactivated! Progression resumed.");
                      setConfirmDeactivate(false);
                    } catch (e) {
                      toast.error("Failed to deactivate streak shield.");
                    } finally {
                      setDeactivating(false);
                    }
                  }}
                  disabled={deactivating}
                  className={`shrink-0 font-bold px-4 py-2.5 rounded-xl text-[9px] uppercase tracking-widest transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                    confirmDeactivate
                      ? "bg-red-500/25 text-red-400 border border-red-500/40 font-black animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                      : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10"
                  }`}
               >
                  {deactivating ? (
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ) : confirmDeactivate ? (
                    "Confirm?"
                  ) : (
                    "Unfreeze"
                  )}
               </button>
             ) : (
               <button
                  onClick={() => setShowFreezeConfirm(true)}
                  className="shrink-0 bg-slate-200 text-black font-extrabold px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 cursor-pointer shadow-lg shadow-white/5"
               >
                  Freeze
               </button>
             )}
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section className="space-y-3">
        <h2 className="text-[9px] font-black tracking-widest uppercase text-slate-500 ml-2">Data & Privacy</h2>
        <div className="gemini-card rounded-[1.5rem] overflow-hidden divide-y divide-white/[0.03]">
          <SettingRow icon={Trash2} label="Reset Progress" danger onClick={() => {
            if (confirm("Are you sure you want to reset all your progress?")) {
              useStore.getState().resetProgress().catch(console.error);
            }
          }} />
          <SettingRow icon={Trash2} label="Delete Account" danger onClick={() => {
            if (confirm("Are you sure you want to delete your account forever?")) {
              useStore.getState().deleteAccount().catch(console.error);
            }
          }} />
        </div>
      </section>

      {/* Brand Identity & Logo Lab */}
      <section className="space-y-4">
        <h2 className="text-[9px] font-black tracking-widest uppercase text-slate-500 ml-2">Brand Identity & Logo Lab</h2>
        <div className="gemini-card rounded-[1.75rem] p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-display font-medium text-slate-200">Interactive Website Logo Ideas</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-light">
              Select an aesthetic theme to dynamically re-brand the website's logo and overall visual identity in real-time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "monolith", title: "The Monolith", desc: "Brushed metal pillar of unbreakable focus.", color: "border-white/5 hover:border-white/20" },
              { id: "infinite", title: "The Infinite", desc: "Luxurious infinite loop of pure consistency.", color: "border-white/5 hover:border-white/20" },
              { id: "eclipse", title: "The Eclipse", desc: "Solar alignment breaking through shadows.", color: "border-white/5 hover:border-white/20" },
              { id: "zen", title: "The Zen Balance", desc: "Interlocking curves of calm daily poise.", color: "border-white/5 hover:border-white/20" }
            ].map((styleOption) => {
              const isSelected = selectedLogoStyle === styleOption.id;
              return (
                <button
                  key={styleOption.id}
                  onClick={() => setSelectedLogoStyle(styleOption.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group cursor-pointer ${
                    isSelected
                      ? "bg-white/[0.04] border-white/20 shadow-md shadow-white/5 scale-[1.02]"
                      : `bg-white/[0.01] border-white/5 ${styleOption.color}`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center border border-white/5">
                      <BrandLogo size={20} styleOverride={styleOption.id as any} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        {styleOption.title}
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{styleOption.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Premium AI Mockups Showcase */}
          <div className="space-y-3 pt-3 border-t border-white/[0.03]">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-300">AI-Generated High-Fidelity Mockups</h4>
              <p className="text-[11px] text-slate-500 font-light">
                Rendered with advanced neural visualizers for premium corporate and web placement.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group rounded-2xl overflow-hidden border border-white/5 bg-[#07070a] aspect-square">
                <img
                  src="/src/assets/images/logo_monolith_concept_1783336242999.jpg"
                  alt="Monolith Concept Mockup"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                  <span className="text-[9px] font-black tracking-wider uppercase text-slate-200">The Monolith 3D Render</span>
                </div>
              </div>

              <div className="relative group rounded-2xl overflow-hidden border border-white/5 bg-[#07070a] aspect-square">
                <img
                  src="/src/assets/images/logo_infinite_concept_1783336257298.jpg"
                  alt="Infinite Loop Concept Mockup"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                  <span className="text-[9px] font-black tracking-wider uppercase text-slate-200">The Infinite Gold Loop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
        <h2 className="text-[9px] font-black tracking-widest uppercase text-slate-500 ml-2">About</h2>
        <div className="gemini-card rounded-[1.5rem] overflow-hidden divide-y divide-white/[0.03]">
          <SettingRow icon={ShieldCheck} label="Privacy Policy" />
          <div className="p-5 flex items-center justify-between text-slate-400">
             <span className="text-xs font-bold uppercase tracking-wider">Version</span>
             <span className="text-xs font-mono text-slate-500">3.2.0</span>
          </div>
        </div>
      </section>
      
      <div className="h-12" /> {/* Spacer for scroll padding */}

      {/* Dynamic Confirmation Modal for Streak freezing */}
      <AnimatePresence>
        {showFreezeConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => { if (!activating) setShowFreezeConfirm(false); }}
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative bg-black border border-white/10 rounded-[2.25rem] p-8 max-w-md w-full shadow-[0_25px_60px_rgba(0,0,0,0.9)] space-y-6 z-10 overflow-hidden"
            >

              {/* Header */}
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 text-white">
                  <Shield size={16} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Streak Freeze Control</span>
                </div>
                <button
                  disabled={activating}
                  onClick={() => setShowFreezeConfirm(false)}
                  className="p-1.5 rounded-full text-slate-500 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1.5 text-left relative z-10">
                <h3 className="text-xl font-display font-light text-white">Activate Streak Shield</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">
                  Deep-freezes your Day Streak, putting progress rules on hold. Select a duration from <strong className="text-slate-200">1 to 10 days</strong>.
                </p>
              </div>

              {/* Slider Input */}
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-4 text-left relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Freeze Duration</span>
                  <span className="text-xs font-black text-white bg-white/10 border border-white/20 px-3 py-1 rounded-full">
                    {freezeDays} {freezeDays === 1 ? "Day" : "Days"}
                  </span>
                </div>
                
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={freezeDays}
                  onChange={(e) => setFreezeDays(parseInt(e.target.value))}
                  disabled={activating}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:bg-white/20 transition-colors"
                />

                {/* Quick Selection Presets */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[1, 3, 7, 10].map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={activating}
                      onClick={() => setFreezeDays(d)}
                      className={`py-1.5 text-[9px] font-bold rounded-lg border transition-all cursor-pointer uppercase tracking-wider ${
                        freezeDays === d
                          ? "bg-white text-black border-white font-black"
                          : "bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-200"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Preview */}
              <div className="bg-white/[0.02] border border-white/10 rounded-[1.25rem] p-4 flex gap-4 items-center text-left relative z-10">
                <div className="text-xl">❄️</div>
                <div>
                  <div className="text-[8px] font-black uppercase text-white tracking-widest">Shield Active Until</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">{previewEndDate}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2 relative z-10">
                <button
                  type="button"
                  disabled={activating}
                  onClick={handleActivateShield}
                  className="w-full bg-slate-100 text-black font-extrabold py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 h-11 cursor-pointer shadow-lg shadow-white/5"
                >
                  {activating ? (
                    <div className="w-4 h-4 border-2 border-black/35 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={12} className="text-black" />
                      Activate Shield
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={activating}
                  onClick={() => setShowFreezeConfirm(false)}
                  className="w-full bg-white/[0.02] text-slate-500 border border-white/5 font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/[0.06] hover:text-slate-300 transition-all h-10 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SettingRow({ icon: Icon, label, value, danger, onClick }: { icon: any, label: string, value?: string, danger?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full p-5 flex items-center justify-between transition-all duration-300 group cursor-pointer ${danger ? 'hover:bg-red-500/5' : 'hover:bg-white/[0.02]'}`}>
       <div className="flex items-center gap-3.5">
         <Icon size={15} className={danger ? 'text-red-400/80 group-hover:text-red-400 transition-colors' : 'text-slate-500 group-hover:text-white transition-colors'} />
         <span className={`text-xs font-bold uppercase tracking-wider ${danger ? 'text-red-400/80 group-hover:text-red-400' : 'text-slate-400 group-hover:text-slate-200'} transition-colors`}>{label}</span>
       </div>
       <div className="flex items-center gap-2">
         {value && <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">{value}</span>}
         <ChevronRight size={15} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
       </div>
    </button>
  )
}
