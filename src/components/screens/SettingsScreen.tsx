import { useStore } from "../../store/useStore";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut, User as UserIcon, Shield, Trash2, ShieldCheck, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

export function SettingsScreen() {
  const { user, firebaseUser } = useStore();

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 max-w-2xl mx-auto space-y-10"
    >
      <header className="pt-4">
        <h1 className="text-3xl font-extrabold tracking-tighter">Settings</h1>
        <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold mt-1">
          System Preferences
        </p>
      </header>

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
                 <div className="font-bold text-sm">{user.name || "Guest"}</div>
                 <div className="text-[10px] text-slate-500">{firebaseUser?.email || "Anonymous Account"}</div>
               </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full text-slate-300">
               Level {user.level}
            </div>
          </div>
          <button 
             onClick={() => signOut(auth)}
             className="w-full p-4 flex items-center justify-between text-slate-300 hover:bg-white/5 transition-colors group"
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
               <Shield size={16} className="text-slate-400" />
               <div>
                 <div className="text-sm font-bold text-slate-300">Streak Shield</div>
                 <div className="text-xs text-slate-500 mt-1">Pause your progress for 7 days without losing your streak.</div>
               </div>
             </div>
             <button
                disabled={!!user.freeze_until && new Date(user.freeze_until) > new Date()}
                onClick={async () => {
                  try {
                    await useStore.getState().freezeStreak(7);
                  } catch (e) {
                    console.error("SHIELD FAILURE", e);
                  }
                }}
                className="ml-4 shrink-0 bg-white text-black font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-widest disabled:opacity-50 disabled:bg-white/10 disabled:text-white"
             >
                {user.freeze_until && new Date(user.freeze_until) > new Date() ? "Active" : "Activate"}
             </button>
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-500 ml-2">Data & Privacy</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
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

      {/* About Section */}
      <section className="space-y-4 opacity-60">
        <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-500 ml-2">About</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          <SettingRow icon={ShieldCheck} label="Privacy Policy" />
          <div className="p-4 flex items-center justify-between text-slate-300">
             <span className="text-sm font-bold">Version</span>
             <span className="text-xs font-mono text-slate-500">1.0.0</span>
          </div>
        </div>
      </section>
      
      <div className="h-12" /> {/* Spacer for scroll padding */}
    </motion.div>
  );
}

function SettingRow({ icon: Icon, label, value, danger, onClick }: { icon: any, label: string, value?: string, danger?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full p-4 flex items-center justify-between transition-colors group ${danger ? 'hover:bg-red-500/10' : 'hover:bg-white/5'}`}>
       <div className="flex items-center gap-3">
         <Icon size={16} className={danger ? 'text-red-400' : 'text-slate-400'} />
         <span className={`text-sm font-bold ${danger ? 'text-red-400' : 'text-slate-300'}`}>{label}</span>
       </div>
       <div className="flex items-center gap-2">
         {value && <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{value}</span>}
         <ChevronRight size={16} className="text-white/20" />
       </div>
    </button>
  )
}
