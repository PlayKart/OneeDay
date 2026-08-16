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

  // Sync internal view navigation with browser history for natural back gesture
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

  // Confirmation dialogs state
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset the "Confirm" timer for settings shield deactivation after 3 seconds
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
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
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
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
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
      className="p-6 md:p-8 max-w-2xl mx-auto space-y-10 relative"
    >
      <header className="pt-4">
        <h1 className="text-3xl font-extrabold tracking-tighter">Settings</h1>
        <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold mt-1">
          System Preferences
        </p>
      </header>

      {/* PROFILE CARD */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-500 ml-2">Identity</h2>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-purple-500/5 blur-3xl rounded-full -top-12 -right-12 w-48 h-48" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <UserIcon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-black text-white">Your Profile</h3>
              <p className="text-slate-400 text-xs leading-relaxed mt-1">
                Manage your personal information, hobbies, favorite sports, and discipline goals.
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleViewChange("profile")}
            className="w-full py-4 bg-white hover:bg-slate-200 text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 h-12"
          >
            <span>View Profile</span>
            <ChevronRight size={14} strokeWidth={3} />
          </motion.button>
        </div>
      </section>

      {/* Account Section */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-500 ml-2">Account</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-slate-800 to-slate-700">
                  {firebaseUser?.photoURL ? (
                     <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                     <UserIcon className="w-full h-full p-3 text-white/50" />
                  )}
               </div>
               <div>
                 <div className="font-bold text-sm">{user?.name || "Guest"}</div>
                 <div className="text-[10px] text-slate-500">{firebaseUser?.email || "Anonymous Account"}</div>
               </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full text-slate-300">
               Level {user?.level || 1}
            </div>
          </div>
          <button 
             onClick={() => setConfirmSignOut(true)}
             className="w-full p-4 flex items-center justify-between text-slate-300 hover:bg-white/5 transition-colors group cursor-pointer"
          >
             <div className="flex items-center gap-3">
               <LogOut size={16} className="text-red-400 group-hover:text-red-300" />
               <span className="text-sm font-bold text-red-400 group-hover:text-red-300 transition-colors">Sign Out</span>
             </div>
             <ChevronRight size={16} className="text-white/20" />
          </button>
        </div>
      </section>

      {/* Protection Section */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-500 ml-2">Protection</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          <div className="p-4 flex items-center justify-between group">
             <div className="flex items-center gap-3">
               <Shield size={16} className={isFrozen ? "text-cyan-400 animate-pulse" : "text-slate-400"} />
               <div>
                 <div className="text-sm font-bold text-slate-300 flex items-center gap-2">
                   Streak Shield
                   {isFrozen && (
                     <span className="text-[9px] font-black uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full tracking-wider">
                       Active
                     </span>
                   )}
                 </div>
                 <div className="text-xs text-slate-500 mt-1">
                   {isFrozen 
                     ? `Protected until ${new Date(user?.freeze_until || "").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                     : "Temporarily pause your activity with a flexible freeze (1 to 10 days) without losing your streak."}
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
                  className={`ml-4 shrink-0 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-widest transition-all duration-300 transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${
                    confirmDeactivate
                      ? "bg-red-500/20 text-red-500 border border-red-500/40 font-black animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                      : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
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
                  className="ml-4 shrink-0 bg-white text-black font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-widest hover:bg-slate-200 transition-all transform active:scale-[0.98] cursor-pointer"
               >
                  Freeze
               </button>
             )}
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-500 ml-2">Data & Privacy</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          <SettingRow icon={Trash2} label="Reset Progress" danger onClick={() => setConfirmReset(true)} />
          <SettingRow icon={Trash2} label="Delete Account" danger onClick={() => setConfirmDelete(true)} />
        </div>
      </section>

      {/* About Section */}
      <section className="space-y-4 opacity-75">
        <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-500 ml-2">About & Legal</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          <button
            onClick={() => setSettingsView("privacy")}
            className="w-full p-4 flex items-center justify-between text-slate-300 hover:bg-white/5 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="text-sm font-bold">Privacy Policy</span>
            </div>
            <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
          </button>
          <button
            onClick={() => setSettingsView("terms")}
            className="w-full p-4 flex items-center justify-between text-slate-300 hover:bg-white/5 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="text-sm font-bold">Terms & Conditions</span>
            </div>
            <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
          </button>
        </div>
      </section>
      
      <div className="h-12" /> {/* Spacer for scroll padding */}

      {/* 1. SIGN OUT CONFIRMATION DIALOG */}
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

      {/* 2. RESET PROGRESS CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={confirmReset}
        title="Reset All Progress?"
        description="This will reset your XP, streaks, level, and statistics back to zero. This action cannot be undone."
        cancelText="Cancel"
        confirmText="Reset Progress"
        destructive={true}
        isLoading={resetting}
        icon={<AlertTriangle size={20} className="text-red-400 stroke-[2.2]" />}
        onCancel={() => {
          if (!resetting) setConfirmReset(false);
        }}
        onConfirm={handleResetConfirm}
      />

      {/* 3. DELETE ACCOUNT CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={confirmDelete}
        title="Delete Account?"
        description="This will permanently delete your account and all associated habit tracking data. This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete Account"
        destructive={true}
        isLoading={deleting}
        icon={<Trash2 size={20} className="text-red-400 stroke-[2.2]" />}
        onCancel={() => {
          if (!deleting) setConfirmDelete(false);
        }}
        onConfirm={handleDeleteAccountConfirm}
      />

      {/* Dynamic Confirmation Modal for Streak freezing */}
      <AnimatePresence>
        {showFreezeConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => { if (!activating) setShowFreezeConfirm(false); }}
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#0c0c0c] border border-cyan-500/25 rounded-t-[2rem] sm:rounded-[2rem] p-8 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.15)] space-y-6 z-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pb-8"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2 block sm:hidden shrink-0" />
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Shield size={20} className="animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest">Protocol Protection</span>
                </div>
                <button
                  disabled={activating}
                  onClick={() => setShowFreezeConfirm(false)}
                  className="p-1 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Title */}
              <div className="space-y-2 text-left">
                <h3 className="text-2xl font-black tracking-tight text-white">Activate Streak Shield</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Deep-freezes your Day Streak and protects it from decay. Choose a duration from <strong className="text-white">1 to 10 days</strong>.
                </p>
              </div>

              {/* Slider Input */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Freeze Duration</span>
                  <span className="text-sm font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
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

                {/* Quick Selection Presets */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[1, 3, 7, 10].map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={activating}
                      onClick={() => setFreezeDays(d)}
                      className={`py-1.5 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer ${
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

              {/* Date Preview */}
              <div className="bg-cyan-500/[0.02] border border-cyan-500/10 rounded-2xl p-4 flex gap-4 items-center text-left">
                <div className="text-2xl">❄️</div>
                <div>
                  <div className="text-[9px] font-black uppercase text-cyan-400 tracking-widest">Protected Until</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">{previewEndDate}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  disabled={activating}
                  onClick={handleActivateShield}
                  className="w-full bg-white text-black font-extrabold py-3.5 rounded-xl text-sm uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 h-12 cursor-pointer"
                >
                  {activating ? (
                    <div className="w-5 h-5 border-2 border-black/35 border-t-black rounded-full animate-spin" />
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
                  className="w-full bg-white/5 text-slate-400 border border-white/5 font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all h-12 cursor-pointer flex items-center justify-center"
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
    <button onClick={onClick} className={`w-full p-4 flex items-center justify-between transition-colors group cursor-pointer ${danger ? 'hover:bg-red-500/10' : 'hover:bg-white/5'}`}>
       <div className="flex items-center gap-3">
         <Icon size={16} className={danger ? 'text-red-400' : 'text-slate-400'} />
         <span className={`text-sm font-bold ${danger ? 'text-red-400' : 'text-slate-300'}`}>{label}</span>
       </div>
       <div className="flex items-center gap-2">
         {value && <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{value}</span>}
         <ChevronRight size={16} className="text-white/20" />
       </div>
    </button>
  );
}
