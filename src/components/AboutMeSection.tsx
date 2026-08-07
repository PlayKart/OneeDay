import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { User as UserIcon, Edit3, Calendar, Heart, Trophy, Check, X } from 'lucide-react';
import { OnboardingModal } from './OnboardingModal';
import { toast } from 'react-hot-toast';

export function AboutMeSection() {
  const { user } = useStore();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
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
          >
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Name</span>
            <p className="text-white font-bold text-sm mt-1">{user.name || "Champion"}</p>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Age & DOB</span>
            <p className="text-white font-bold text-sm mt-1">
              {user.dob ? `${user.dob} (${user.age ? `${user.age} yrs` : ""})` : "Not specified"}
            </p>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gender</span>
            <p className="text-white font-bold text-sm mt-1 capitalize">{user.gender || "Not specified"}</p>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason For Joining</span>
            {user.reasonForJoining ? (
              <p className="text-slate-300 text-xs italic mt-1 line-clamp-2">
                "{user.reasonForJoining}"
              </p>
            ) : (
              <p className="text-slate-500 text-xs italic mt-1">Not added yet</p>
            )}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Hobbies & Interests</span>
          {user.hobbies && user.hobbies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {user.hobbies.map((h, i) => (
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
          {user.favouriteSports && user.favouriteSports.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {user.favouriteSports.map((s, i) => (
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
        onComplete={() => {
          setIsEditing(false);
          toast.success("Profile updated successfully!");
        }}
        initialData={user}
        isEditing={true}
      />
    </>
  );
}
