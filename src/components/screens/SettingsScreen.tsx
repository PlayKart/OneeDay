import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut, User as UserIcon, Shield, Trash2, ShieldCheck, ChevronRight, X, Sparkles, AlertTriangle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { PrivacyPage } from "../PrivacyPage";
import { TermsPage } from "../TermsPage";
import { ProfileScreen } from "./ProfileScreen";
import { ConfirmationDialog } from "../ConfirmationDialog";

export function SettingsScreen() {
  const { user, firebaseUser, freezeStreak, deactivateFreeze, resetProgress, deleteAccount } = useStore();
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);
  const [freezeDays, setFreezeDays] = useState(7);
  const [activating, setActivating] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // In-app navigation view for Privacy Policy, Terms, and Profile
  const [settingsView, setSettingsView] = useState<"main" | "privacy" | "terms" | "profile">("main");

  const handleViewChange = (view: "main" | "privacy" | "terms" | "profile") => {
    setSettingsView(view);
    window.history.pushState({ settingsView: view }, "", "");
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.settingsView) {
        setSettingsView(event.state.settingsView);
      } else {
        setSettingsView("main");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!confirmDeactivate) return;
    const timer = setTimeout(() => {
      setConfirmDeactivate(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [confirmDeactivate]);

  if (!user && settingsView === "main") return null;

  const isFrozen = user?.freeze_until && new Date(user.freeze_until) > new Date();

  const handleActivateShield = async () => {
    try {
      setActivating(true);
      await freezeStreak(freezeDays);
      setShowFreezeConfirm(false);
      toast.success(`Streak frozen for ${freezeDays} days!`);
    } catch (e: any) {
      console.error("Streak freeze activation failed", e);
      toast.error(e?.message || "Failed to activate streak shield.");
    } finally {
      setActivating(false);
    }
  };

  const handleSignOutConfirm = async () => {
    try {
      await signOut(auth);
      setConfirmSignOut(false);
      toast.success("Successfully signed out.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to sign out.");
    }
  };

  const handleResetConfirm = async () => {
    try {
      setResetting(true);
      await resetProgress();
      setConfirmReset(false);
      toast.success("Progress reset successfully.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reset progress.");
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
      localStorage.clear();
      sessionStorage.clear();
      await signOut(auth);
      setConfirmDelete(false);
      toast.success("Account deleted successfully.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  const previewEndDate = new Date(Date.now() + freezeDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (settingsView === "privacy") {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => {
            setSettingsView("main");
            if (window.history.state?.settingsView === "privacy") {
              window.history.back();
            }
          }}
          className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold tracking-tight cursor-pointer"
        >
          <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
          Back to Settings
        </button>
        <PrivacyPage onBack={() => {
          setSettingsView("main");
          if (window.history.state?.settingsView === "privacy") {
            window.history.back();
          }
        }} />
      </div>
    );
  }

  if (settingsView === "terms") {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => {
            setSettingsView("main");
            if (window.history.state?.settingsView === "terms") {
              window.history.back();
            }
          }}
          className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold tracking-tight cursor-pointer"
        >
          <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
          Back to Settings
        </button>
        <TermsPage onBack={() => {
          setSettingsView("main");
          if (window.history.state?.settingsView === "terms") {
            window.history.back();
          }
        }} />
      </div>
    );
  }

  if (settingsView === "profile") {
    return (
      <ProfileScreen
        onBack={() => {
          setSettingsView("main");
          if (window.history.state?.settingsView === "profile") {
            window.history.back();
          }
        }}
      />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-8 relative"
    >
      <header className="pt-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Settings</h1>
        <p className="text-slate-400 text-[10px] tracking-widest uppercase font-bold mt-0.5">
          System Preferences & Account
        </p>
      </header>

      {/* PROFILE CARD */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Identity</h2>
        <div className="liquid-glass-card rounded-2xl p-5 space-y-4 relative overflow-hidden border-purple-500/20 stripe-purple">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
              <UserIcon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-black text-white">User Profile</h3>
              <p className="text-slate-400 text-xs leading-relaxed mt-0.5">
                Personalize your habits, goals, routine preferences, and coach calibration.
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleViewChange("profile")}
            className="w-full py-3 bg-white hover:bg-slate-200 text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 h-11 shadow-md"
          >
            <span>Edit Profile</span>
            <ChevronRight size={14} strokeWidth={3} />
          </motion.button>
        </div>
      </section>

      {/* Account Section */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Account</h2>
        <div className="liquid-glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
               <div className="w-11 h-11 rounded-xl overflow-hidden bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  {firebaseUser?.photoURL ? (
                     <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                     <UserIcon size={20} />
                  )}
               </div>
               <div className="min-w-0">
                 <div className="font-black text-sm text-white truncate">{user?.name || "OneDay User"}</div>
                 <div className="text-[10px] text-slate-400 font-medium truncate">{firebaseUser?.email || "Local Account"}</div>
               </div>
            </div>
            <div className="text-[9px] font-black uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 rounded-full text-purple-300 shrink-0">
               Level {user?.level || 1}
            </div>
          </div>
          <button 
             onClick={() => setConfirmSignOut(true)}
             className="w-full p-4 flex items-center justify-between text-slate-300 hover:bg-white/[0.04] transition-colors group cursor-pointer"
          >
             <div className="flex items-center gap-3">
               <LogOut size={16} className="text-rose-400 group-hover:text-rose-300" />
               <span className="text-xs font-bold text-rose-400 group-hover:text-rose-300 transition-colors">Sign Out</span>
             </div>
             <ChevronRight size={14} className="text-slate-500" />
          </button>
        </div>
      </section>

      {/* Protection Section */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Streak Shield</h2>
        <div className="liquid-glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
          <div className="p-4 flex items-center justify-between group">
             <div className="flex items-center gap-3 min-w-0">
               <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                 isFrozen ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300" : "bg-white/5 border border-white/10 text-slate-400"
               }`}>
                 <Shield size={18} />
               </div>
               <div className="min-w-0">
                 <div className="text-xs font-black text-white flex items-center gap-2">
                   Streak Shield
                   {isFrozen && (
                     <span className="text-[8px] font-black uppercase text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                       Active
                     </span>
                   )}
                 </div>
                 <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                   {isFrozen 
                     ? `Protected until ${new Date(user?.freeze_until || "").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                     : "Freeze your activity (1 to 10 days) without losing progress."}
                 </div>
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
                    } catch (e: any) {
                      toast.error(e?.message || "Failed to deactivate streak shield.");
                    } finally {
                      setDeactivating(false);
                    }
                  }}
                  disabled={deactivating}
                  className={`ml-3 shrink-0 font-extrabold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                    confirmDeactivate
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                      : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
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
                  className="ml-3 shrink-0 bg-white hover:bg-slate-200 text-black font-extrabold px-3.5 py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
               >
                  Freeze
               </button>
             )}
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Data & Storage</h2>
        <div className="liquid-glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
          <SettingRow icon={Trash2} label="Reset Progress" danger onClick={() => setConfirmReset(true)} />
          <SettingRow icon={Trash2} label="Delete Account" danger onClick={() => setConfirmDelete(true)} />
        </div>
      </section>

      {/* About Section */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Legal & Protocols</h2>
        <div className="liquid-glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
          <button
            onClick={() => setSettingsView("privacy")}
            className="w-full p-3.5 flex items-center justify-between text-slate-300 hover:bg-white/[0.04] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="text-xs font-bold">Privacy Policy</span>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300" />
          </button>
          <button
            onClick={() => setSettingsView("terms")}
            className="w-full p-3.5 flex items-center justify-between text-slate-300 hover:bg-white/[0.04] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="text-xs font-bold">Terms & Conditions</span>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300" />
          </button>
        </div>
      </section>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={confirmSignOut}
        title="Sign Out?"
        description="Are you sure you want to sign out of OneDay?"
        cancelText="Cancel"
        confirmText="Sign Out"
        destructive={false}
        icon={<LogOut size={20} className="text-white stroke-[2.2]" />}
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={handleSignOutConfirm}
      />

      <ConfirmationDialog
        isOpen={confirmReset}
        title="Reset All Progress?"
        description="This will reset your XP, streaks, level, and statistics back to zero. This action cannot be undone."
        cancelText="Cancel"
        confirmText="Reset Progress"
        destructive={true}
        isLoading={resetting}
        icon={<AlertTriangle size={20} className="text-rose-400 stroke-[2.2]" />}
        onCancel={() => {
          if (!resetting) setConfirmReset(false);
        }}
        onConfirm={handleResetConfirm}
      />

      <ConfirmationDialog
        isOpen={confirmDelete}
        title="Delete Account?"
        description="This will permanently delete your account and all associated habit tracking data. This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete Account"
        destructive={true}
        isLoading={deleting}
        icon={<Trash2 size={20} className="text-rose-400 stroke-[2.2]" />}
        onCancel={() => {
          if (!deleting) setConfirmDelete(false);
        }}
        onConfirm={handleDeleteAccountConfirm}
      />

      {/* Freeze Confirmation Sheet */}
      <AnimatePresence>
        {showFreezeConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => { if (!activating) setShowFreezeConfirm(false); }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#0c0c14] border border-cyan-500/25 rounded-t-[2rem] sm:rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.15)] space-y-6 z-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pb-8"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2 block sm:hidden shrink-0" />
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Shield size={18} className="animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest">Protocol Protection</span>
                </div>
                <button
                  disabled={activating}
                  onClick={() => setShowFreezeConfirm(false)}
                  className="p-1 rounded-full text-slate-500 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1 text-left">
                <h3 className="text-xl font-black tracking-tight text-white">Activate Streak Shield</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Deep-freezes your Day Streak and protects it from decay. Choose a duration from <strong className="text-white">1 to 10 days</strong>.
                </p>
              </div>

              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Freeze Duration</span>
                  <span className="text-xs font-black text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
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
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                />

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[1, 3, 7, 10].map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={activating}
                      onClick={() => setFreezeDays(d)}
                      className={`py-1.5 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                        freezeDays === d
                          ? "bg-white text-black border-white"
                          : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10"
                      }`}
                    >
                      {d} {d === 1 ? "Day" : "Days"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-cyan-500/[0.04] border border-cyan-500/15 rounded-xl p-3.5 flex gap-3 items-center text-left">
                <div className="text-xl">❄️</div>
                <div>
                  <div className="text-[9px] font-black uppercase text-cyan-400 tracking-wider">Protected Until</div>
                  <div className="text-xs font-bold text-slate-200">{previewEndDate}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  disabled={activating}
                  onClick={handleActivateShield}
                  className="w-full bg-white hover:bg-slate-200 text-black font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 h-11 cursor-pointer"
                >
                  {activating ? (
                    <div className="w-4 h-4 border-2 border-black/35 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Activate Shield
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={activating}
                  onClick={() => setShowFreezeConfirm(false)}
                  className="w-full bg-white/5 text-slate-400 border border-white/5 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all h-10 cursor-pointer"
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
    <button onClick={onClick} className={`w-full p-3.5 flex items-center justify-between transition-colors group cursor-pointer ${danger ? 'hover:bg-rose-500/10' : 'hover:bg-white/[0.04]'}`}>
       <div className="flex items-center gap-3">
         <Icon size={16} className={danger ? 'text-rose-400' : 'text-slate-400'} />
         <span className={`text-xs font-bold ${danger ? 'text-rose-400' : 'text-slate-300'}`}>{label}</span>
       </div>
       <div className="flex items-center gap-2">
         {value && <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{value}</span>}
         <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300" />
       </div>
    </button>
  );
}
