import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { User as UserIcon, Edit3, AlertTriangle } from 'lucide-react';
import { OnboardingModal } from './OnboardingModal';
import { toast } from 'react-hot-toast';
import { userService } from '../services/userService';

function ProfileSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 animate-pulse" id="profile-skeleton">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10" />
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-28" />
            <div className="h-3 bg-white/5 rounded w-48" />
          </div>
        </div>
        <div className="h-8 bg-white/10 rounded-xl w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-2">
            <div className="h-3 bg-white/5 rounded w-16" />
            <div className="h-4 bg-white/10 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-white/5 rounded w-32" />
        <div className="flex gap-1.5">
          <div className="h-6 bg-white/5 rounded-lg w-16" />
          <div className="h-6 bg-white/5 rounded-lg w-20" />
          <div className="h-6 bg-white/5 rounded-lg w-12" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-white/5 rounded w-24" />
        <div className="flex gap-1.5">
          <div className="h-6 bg-white/5 rounded-lg w-14" />
          <div className="h-6 bg-white/5 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
}

export function AboutMeSection() {
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
      console.log("[PROFILE] Fetching latest profile from backend...");
      const data = await userService.getUserProfile();
      console.log("[PROFILE] Successfully fetched profile from backend:", data);
      setProfileData(data);
      // Synchronize with store
      useStore.setState({ user: data });
    } catch (err: any) {
      console.error("[PROFILE] Error fetching profile from backend:", err);
      setFetchError(err?.message || "Failed to load user profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile(true);
  }, [fetchProfile]);

  if (loadingProfile) {
    return <ProfileSkeleton />;
  }

  if (fetchError) {
    return (
      <div className="bg-white/5 border border-red-500/15 rounded-2xl p-6 text-center space-y-4" id="profile-error">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
          <AlertTriangle size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-white font-bold text-sm">Failed to Load Profile</h4>
          <p className="text-slate-400 text-xs leading-relaxed">{fetchError}</p>
        </div>
        <button
          onClick={() => fetchProfile(true)}
          className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          id="retry-profile-btn"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeUser = profileData || user;
  if (!activeUser) return null;

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6" id="about-me-section">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">About Me & Profile</h3>
              <p className="text-slate-400 text-xs mt-0.5">Manage your personal identity, hobbies, and discipline goals.</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            id="edit-profile-btn"
          >
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Name</span>
            <p className="text-white font-bold text-sm mt-1">{activeUser.name || "Champion"}</p>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Age & DOB</span>
            <p className="text-white font-bold text-sm mt-1">
              {activeUser.dob ? `${activeUser.dob} (${activeUser.age ? `${activeUser.age} yrs` : ""})` : "Not specified"}
            </p>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gender</span>
            <p className="text-white font-bold text-sm mt-1 capitalize">{activeUser.gender || "Not specified"}</p>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason For Joining</span>
            {activeUser.reasonForJoining ? (
              <p className="text-slate-300 text-xs italic mt-1 line-clamp-2">
                "{activeUser.reasonForJoining}"
              </p>
            ) : (
              <p className="text-slate-500 text-xs italic mt-1">Not added yet</p>
            )}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Hobbies & Interests</span>
          {activeUser.hobbies && activeUser.hobbies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {activeUser.hobbies.map((h: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 text-xs font-bold">
                  {h}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-xs italic">Not added yet</p>
          )}
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Favorite Sports</span>
          {activeUser.favouriteSports && activeUser.favouriteSports.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {activeUser.favouriteSports.map((s: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs font-bold">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-xs italic">Not added yet</p>
          )}
        </div>
      </div>

      <OnboardingModal
        isOpen={isEditing}
        onComplete={async () => {
          setIsEditing(false);
          toast.success("Profile updated successfully!");
          await fetchProfile(true);
        }}
        initialData={activeUser}
        isEditing={true}
      />
    </>
  );
}
