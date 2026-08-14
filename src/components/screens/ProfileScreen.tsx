import React, { useState, useEffect, useCallback } from "react";
import { useStore } from "../../store/useStore";
import { ArrowLeft, User as UserIcon, Edit3, AlertTriangle, Sparkles, Heart, Trophy, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { userService } from "../../services/userService";
import { OnboardingModal } from "../OnboardingModal";

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-1" id="profile-skeleton-view">
      <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6">
        <div className="w-16 h-16 rounded-2xl bg-white/10" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-white/10 rounded-md w-32" />
          <div className="h-3.5 bg-white/5 rounded-md w-48" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 space-y-2">
            <div className="h-3 bg-white/5 rounded w-16" />
            <div className="h-4.5 bg-white/10 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 space-y-3">
        <div className="h-3 bg-white/5 rounded w-24" />
        <div className="flex gap-2">
          <div className="h-7 bg-white/5 rounded-lg w-16" />
          <div className="h-7 bg-white/5 rounded-lg w-24" />
          <div className="h-7 bg-white/5 rounded-lg w-14" />
        </div>
      </div>
    </div>
  );
}

interface ProfileScreenProps {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { user } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  const fetchProfile = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoadingProfile(true);
    }
    setFetchError(null);
    try {
      console.log("[PROFILE SCREEN] Fetching latest profile from backend...");
      const data = await userService.getUserProfile();
      console.log("[PROFILE SCREEN] Successfully fetched profile from backend:", data);
      setProfileData(data);
      // Sync with global store state
      useStore.setState({ user: data });
    } catch (err: any) {
      console.error("[PROFILE SCREEN] Error fetching profile from backend:", err);
      setFetchError(err?.message || "Failed to load user profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile(true);
  }, [fetchProfile]);

  const activeUser = profileData || user;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-6 md:p-8 max-w-2xl mx-auto space-y-8 relative overflow-y-auto scrollbar-hide pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
    >
      {/* Header with back button */}
      <header className="flex items-center gap-4 pt-2 pb-1">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
          title="Back to Settings"
        >
          <ArrowLeft size={18} strokeWidth={2.5} className="text-white" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Profile</h1>
          <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold mt-0.5">
            Personal Identity Protocol
          </p>
        </div>
      </header>

      {loadingProfile ? (
        <ProfileSkeleton />
      ) : fetchError ? (
        <div className="bg-[#0C0C0C] border border-red-500/15 rounded-3xl p-8 text-center space-y-5" id="profile-screen-error">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-extrabold text-base uppercase tracking-wider">Connection Failure</h4>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
              {fetchError || "The profile database couldn't be loaded at this time."}
            </p>
          </div>
          <button
            onClick={() => fetchProfile(true)}
            className="w-full max-w-[200px] mx-auto py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer h-12 flex items-center justify-center"
          >
            Retry Connection
          </button>
        </div>
      ) : !activeUser ? (
        <div className="bg-[#0C0C0C] border border-white/10 rounded-3xl p-8 text-center space-y-4">
          <p className="text-slate-400 text-sm">No profile data available.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identity Hub Header Card */}
          <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 flex items-center gap-5 relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-purple-500/5 blur-3xl rounded-full -top-12 -left-12 w-48 h-48" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600/35 to-indigo-600/35 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-inner shrink-0 text-xl font-bold">
              {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : "C"}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-white leading-tight truncate">
                {activeUser.name || "Active Champion"}
              </h2>
              <p className="text-slate-500 text-xs mt-1 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles size={11} className="text-purple-400" />
                Level {activeUser.level || 1} Elite
              </p>
            </div>
          </div>

          {/* Personal Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <UserIcon size={12} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Name</span>
              </div>
              <p className="text-white font-extrabold text-sm mt-2">{activeUser.name || "Not specified"}</p>
            </div>

            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar size={12} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Age & DOB</span>
              </div>
              <p className="text-white font-extrabold text-sm mt-2">
                {activeUser.dob ? `${activeUser.dob} (${activeUser.age ? `${activeUser.age} yrs` : ""})` : "Not specified"}
              </p>
            </div>

            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Sparkles size={12} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Gender</span>
              </div>
              <p className="text-white font-extrabold text-sm mt-2 capitalize">{activeUser.gender || "Not specified"}</p>
            </div>

            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Heart size={12} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Reason For Joining</span>
              </div>
              {activeUser.reasonForJoining ? (
                <p className="text-slate-300 text-xs italic mt-2 leading-relaxed">
                  "{activeUser.reasonForJoining}"
                </p>
              ) : (
                <p className="text-slate-600 text-xs italic mt-2">Not specified</p>
              )}
            </div>
          </div>

          {/* Hobbies & Interests Card */}
          <div className="bg-[#0C0C0C] border border-white/5 rounded-3xl p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-2 text-slate-500">
              <Sparkles size={13} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Hobbies & Interests</span>
            </div>
            {Array.isArray(activeUser.hobbies) && activeUser.hobbies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeUser.hobbies.map((h: string, i: number) => (
                  <span key={i} className="px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs font-bold transition-all hover:bg-indigo-500/15">
                    {h}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-xs italic">No hobbies declared yet.</p>
            )}
          </div>

          {/* Favorite Sports Card */}
          <div className="bg-[#0C0C0C] border border-white/5 rounded-3xl p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-2 text-slate-500">
              <Trophy size={13} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Favorite Sports</span>
            </div>
            {Array.isArray(activeUser.favouriteSports) && activeUser.favouriteSports.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeUser.favouriteSports.map((s: string, i: number) => (
                  <span key={i} className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs font-bold transition-all hover:bg-emerald-500/15">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-xs italic">No sports selected yet.</p>
            )}
          </div>

          {/* Prominent comfortable Edit button */}
          <div className="pt-4">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsEditing(true)}
              className="w-full py-4.5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2 h-14"
              id="edit-profile-action-btn"
            >
              <Edit3 size={15} strokeWidth={2.5} />
              <span>Edit Profile Details</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Reusable Onboarding modal used as Profile Editor */}
      <OnboardingModal
        isOpen={isEditing}
        onComplete={async () => {
          setIsEditing(false);
          toast.success("Profile successfully saved to backend!");
          await fetchProfile(true);
        }}
        initialData={activeUser}
        isEditing={true}
      />
    </motion.div>
  );
}
