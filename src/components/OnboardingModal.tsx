import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, ArrowLeft, Check, Sparkles, User as UserIcon, 
  Calendar, Heart, Trophy, Search, X, ShieldAlert, AlertCircle 
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { User } from '../types';
import { toast } from 'react-hot-toast';
import { VALID_GENDERS, normalizeGenderValue, countWords, getOnboardingStatus, resolveOnboardingStatus } from '../utils';
import { OnboardingTransition, TransitionVariant, TransitionStatus } from './OnboardingTransition';

const HOBBIES_LIST = [
  "Reading", "Coding", "Fitness", "Writing", "Meditation", 
  "Photography", "Gaming", "Hiking", "Cooking", "Music", 
  "Art", "Traveling", "Investing", "Running", "Yoga", 
  "Chess", "Cycling", "Swimming", "Languages", "Philosophy", 
  "Design", "Gardening", "Filmmaking", "Podcasting", "Surfing"
];

const OUTDOOR_SPORTS = [
  "Football", "Basketball", "Tennis", "Cricket", "Running", 
  "Cycling", "Swimming", "Surfing", "Golf", "Baseball", 
  "Rugby", "Volleyball", "Hiking", "Rock Climbing", "Skiing", 
  "Snowboarding", "Skateboarding", "Track & Field", "Rowing", "Sailing", 
  "Triathlon", "Mountain Biking", "Kayaking", "Equestrian", "Polo"
];

const INDOOR_SPORTS = [
  "Table Tennis", "Badminton", "Squash", "Fencing", "Billiards"
];

const ALL_SPORTS = [...OUTDOOR_SPORTS, ...INDOOR_SPORTS];

const GENDER_OPTIONS = [
  { id: "Male", label: "Male", icon: "👨", value: "Male" },
  { id: "Female", label: "Female", icon: "👩", value: "Female" },
  { id: "Prefer not to say", label: "Prefer not to say", icon: "🔒", value: "Prefer not to say" },
  { id: "Other", label: "Other", icon: "✨", value: "Other" },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  initialData?: any;
  isEditing?: boolean;
  transitionVariant?: TransitionVariant;
}

function parseStepNumber(val: any): number | null {
  if (typeof val === "number" && !isNaN(val) && val >= 1 && val <= 6) {
    return val;
  }
  if (typeof val === "string") {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
      return parsed;
    }
  }
  return null;
}

function getInitialOnboardingStep(user: User | null, isEditing: boolean): number {
  if (isEditing) return 1;

  // 1. Backend value takes priority over localStorage
  const backendStep = parseStepNumber(user?.onboardingStep);
  if (backendStep !== null) {
    return backendStep;
  }

  // 2. localStorage temporary cache/fallback
  try {
    const saved = localStorage.getItem("oneday_onboarding_step");
    if (saved) {
      const trimmed = saved.trim();
      if (trimmed.startsWith("{")) {
        const parsed = JSON.parse(trimmed);
        const stepNum = parseStepNumber(parsed?.step);
        if (stepNum !== null) return stepNum;
      } else {
        const stepNum = parseStepNumber(trimmed);
        if (stepNum !== null) return stepNum;
      }
    }
  } catch (e) {
    console.warn("[Onboarding] Error reading saved step:", e);
  }

  // 3. Default fallback
  return 1;
}

function getSavedDraftData(isEditing: boolean) {
  if (isEditing) return null;
  try {
    const raw = localStorage.getItem("oneday_onboarding_data");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("[Onboarding] Error reading saved draft data:", e);
  }
  return null;
}

export function OnboardingModal({ isOpen, onComplete, initialData, isEditing = false, transitionVariant = "calibrating" }: OnboardingModalProps) {
  const { user, updateProfile, refreshFromBackend } = useStore();
  const [activeVariant, setActiveVariant] = useState<TransitionVariant>(transitionVariant);

  const draftData = useMemo(() => getSavedDraftData(isEditing), [isEditing]);

  const [step, setStep] = useState<number>(() => getInitialOnboardingStep(user, isEditing));
  const totalSteps = 6;

  // Track if backend step has synced
  const hasSyncedBackendStep = React.useRef<boolean>(parseStepNumber(user?.onboardingStep) !== null);

  // Sync step from backend user if backend step becomes available or updates
  useEffect(() => {
    if (isEditing) return;

    const backendStep = parseStepNumber(user?.onboardingStep);
    if (backendStep !== null) {
      if (!hasSyncedBackendStep.current || backendStep > step) {
        setStep(backendStep);
        hasSyncedBackendStep.current = true;
        try {
          localStorage.setItem("oneday_onboarding_step", JSON.stringify({ step: backendStep }));
        } catch (_) {}
      }
    }
  }, [user?.onboardingStep, isEditing]);

  // Form state initialized with draftData fallback, initialData, or user
  const [name, setName] = useState(draftData?.name || initialData?.name || user?.name || "");
  const [dob, setDob] = useState(draftData?.dob || initialData?.dob || "");
  const [gender, setGender] = useState<string>(() => 
    normalizeGenderValue(draftData?.gender || initialData?.gender || user?.gender)
  );
  const [hobbies, setHobbies] = useState<string[]>(draftData?.hobbies || initialData?.hobbies || []);
  const [hobbySearch, setHobbySearch] = useState("");
  const [customHobbyInput, setCustomHobbyInput] = useState("");
  const [sports, setSports] = useState<string[]>(draftData?.favouriteSports || draftData?.sports || initialData?.favouriteSports || initialData?.sports || []);
  const [sportSearch, setSportSearch] = useState("");
  const [whyOneday, setWhyOneday] = useState<string>(() => {
    return (
      draftData?.why_oneday ||
      draftData?.whyOneday ||
      draftData?.reasonForJoining ||
      draftData?.reason ||
      initialData?.why_oneday ||
      initialData?.whyOneday ||
      initialData?.reasonForJoining ||
      initialData?.reason ||
      user?.why_oneday ||
      user?.whyOneday ||
      user?.reasonForJoining ||
      ""
    );
  });
  const [isCompletedState, setIsCompletedState] = useState(false);
  const [transitionStatus, setTransitionStatus] = useState<TransitionStatus>("syncing");
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Real-time character count for Why OneDay question
  const nonSpaceCharCount = useMemo(() => whyOneday.replace(/\s/g, '').length, [whyOneday]);
  const totalCharCount = useMemo(() => whyOneday.length, [whyOneday]);

  // Save current step to localStorage
  useEffect(() => {
    if (!isEditing && step >= 1 && step <= 6) {
      try {
        localStorage.setItem("oneday_onboarding_step", JSON.stringify({ step }));
      } catch (e) {
        console.warn("[Onboarding] Failed to save step to localStorage:", e);
      }
    }
  }, [step, isEditing]);

  // Save form state draft to localStorage
  useEffect(() => {
    if (!isEditing) {
      try {
        localStorage.setItem("oneday_onboarding_data", JSON.stringify({
          name,
          dob,
          gender,
          hobbies,
          favouriteSports: sports,
          why_oneday: whyOneday,
          whyOneday: whyOneday,
          reasonForJoining: whyOneday,
        }));
      } catch (e) {
        console.warn("[Onboarding] Failed to save draft data to localStorage:", e);
      }
    }
  }, [name, dob, gender, hobbies, sports, whyOneday, isEditing]);

  // Accurate calendar-aware age calculation considering exact birthday occurrence this year
  const age = useMemo(() => {
    if (!dob || typeof dob !== "string") return null;
    const trimmed = dob.trim();
    if (!trimmed) return null;

    let birthYear: number;
    let birthMonth: number; // 0-indexed: 0 = Jan, 11 = Dec
    let birthDay: number;

    if (trimmed.includes("-")) {
      const parts = trimmed.split("-");
      if (parts.length < 3) return null;
      birthYear = parseInt(parts[0], 10);
      birthMonth = parseInt(parts[1], 10) - 1;
      birthDay = parseInt(parts[2], 10);
    } else if (trimmed.includes("/")) {
      const parts = trimmed.split("/");
      if (parts.length < 3) return null;
      if (parts[0].length === 4) {
        birthYear = parseInt(parts[0], 10);
        birthMonth = parseInt(parts[1], 10) - 1;
        birthDay = parseInt(parts[2], 10);
      } else {
        birthMonth = parseInt(parts[0], 10) - 1;
        birthDay = parseInt(parts[1], 10);
        birthYear = parseInt(parts[2], 10);
      }
    } else {
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) return null;
      birthYear = parsed.getFullYear();
      birthMonth = parsed.getMonth();
      birthDay = parsed.getDate();
    }

    if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return null;
    if (birthMonth < 0 || birthMonth > 11 || birthDay < 1 || birthDay > 31) return null;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    let calculatedAge = currentYear - birthYear;
    // If birthday hasn't occurred yet in the current year, decrement age by 1
    if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
      calculatedAge--;
    }

    return isNaN(calculatedAge) || calculatedAge < 0 ? null : calculatedAge;
  }, [dob]);

  // Specific user-facing validation message for Date of Birth
  const dobValidationError = useMemo(() => {
    if (!dob) return null;
    if (age === null) {
      return "Please enter a date of birth for someone older than 10 years.";
    }
    if (age < 10) {
      return "Please enter a date of birth for someone older than 10 years.";
    }
    if (age > 70) {
      return "Please enter a date of birth for someone younger than 70 years.";
    }
    return null;
  }, [dob, age]);

  if (!isOpen) return null;

  // Real-time validation per step
  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return name.trim().length >= 2;
      case 2:
        return Boolean(dob && age !== null && age >= 10 && age <= 70);
      case 3:
        return VALID_GENDERS.includes(gender as any);
      case 4:
        // Optional step
        return true;
      case 5:
        // Optional step but has a limit
        return sports.length <= 5;
      case 6: {
        const nonSpaceCount = (whyOneday || "").replace(/\s/g, '').length;
        const totalCount = (whyOneday || "").length;
        return nonSpaceCount >= 5 && totalCount <= 500;
      }
      default:
        return true;
    }
  };

  const updateAndSaveStep = (nextStep: number) => {
    if (nextStep < 1 || nextStep > totalSteps) return;
    setStep(nextStep);
    if (!isEditing) {
      try {
        localStorage.setItem("oneday_onboarding_step", JSON.stringify({ step: nextStep }));
      } catch (e) {
        console.warn("[Onboarding] Failed to save step to localStorage:", e);
      }
      if (updateProfile) {
        updateProfile({ onboardingStep: nextStep }).catch((err) => {
          console.warn("[Onboarding] Error persisting step to backend:", err);
        });
      }
    }
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      if (step === 1) toast.error("Please enter a valid name (at least 2 characters).");
      if (step === 2) {
        if (!dob) {
          toast.error("Please select a date of birth.");
        } else if (age === null || age < 10) {
          toast.error("Please enter a date of birth for someone older than 10 years.");
        } else if (age > 70) {
          toast.error("Please enter a date of birth for someone younger than 70 years.");
        } else {
          toast.error("Please enter a valid date of birth.");
        }
      }
      if (step === 3) toast.error("Please select a gender option.");
      if (step === 5) toast.error("Maximum 5 favorite sports allowed.");
      if (step === 6) {
        const nonSpaceCount = whyOneday.replace(/\s/g, '').length;
        const totalCount = whyOneday.length;
        if (nonSpaceCount < 5) {
          toast.error("Please enter at least 5 characters.");
        } else if (totalCount > 500) {
          toast.error("Please keep your response under 500 characters.");
        }
      }
      return;
    }

    if (step < totalSteps) {
      updateAndSaveStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    // Clear field on skip if user wants
    if (step === 4) {
      setHobbies([]);
    } else if (step === 5) {
      setSports([]);
    }

    if (step < totalSteps) {
      updateAndSaveStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      updateAndSaveStep(step - 1);
    }
  };

  const executeOnboardingPersistence = async (cleanWhyOneday: string, finalGender: string) => {
    if (saving) return; // Prevent duplicate onboarding writes (Rule 12)

    try {
      setSaving(true);
      setTransitionStatus("syncing");
      setTransitionError(null);
      setIsCompletedState(true);

      console.log("[ONBOARDING] Starting onboarding persistence flow...");

      const payload = {
        name: name.trim(),
        full_name: name.trim(),
        dob,
        date_of_birth: dob,
        age,
        gender: finalGender,
        hobbies,
        favouriteSports: sports,
        sports,
        why_oneday: cleanWhyOneday,
        whyOneday: cleanWhyOneday,
        reasonForJoining: cleanWhyOneday,
        reason: cleanWhyOneday,
        onboarded: true,
        hasCompletedOnboarding: true,
        onboarding_completed: true,
        onboardingCompleted: true,
        needsOnboarding: false,
        needs_onboarding: false,
        onboardingStep: totalSteps,
      };

      // 1. Persist user profile to backend database (Rules 1, 3, 4, 6)
      if (updateProfile) {
        await updateProfile(payload);
      }
      console.log("[PROFILE] Backend updateProfile succeeded.");

      // 2. Perform authoritative synchronization re-fetch (Rules 7, 10)
      console.log("[SYNC] Re-fetching profile from backend...");
      if (refreshFromBackend) {
        await refreshFromBackend();
      }
      console.log("[SYNC] Re-fetch completed.");

      // 3. Confirm authoritative status strictly from refreshed backend profile (Rules 1, 6, 7)
      const refreshedUser = useStore.getState().user;
      const resolvedStatus = resolveOnboardingStatus(refreshedUser);
      console.log(`[ONBOARDING STATUS] Authoritative backend status resolved = ${resolvedStatus}`);

      if (resolvedStatus !== "complete") {
        throw new Error("Backend did not confirm onboarding completion. Please tap retry.");
      }

      // 4. On successful confirmation: remove local draft keys, mark transition success (Rule 8)
      if (!isEditing) {
        localStorage.removeItem("oneday_onboarding_step");
        localStorage.removeItem("oneday_onboarding_data");
      }

      setTransitionStatus("success");
      setTransitionError(null);
    } catch (e: any) {
      console.error("[ONBOARDING] Persistence error:", e);
      const errorMessage =
        e?.response?.data?.error?.message ||
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Backend did not confirm onboarding completion. Please tap retry.";

      setTransitionError(errorMessage);
      setTransitionStatus("error");
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    const finalGender = normalizeGenderValue(gender);
    if (!VALID_GENDERS.includes(finalGender as any)) {
      toast.error("Valid gender is required (Male, Female, Prefer not to say, Other).");
      return;
    }

    const cleanWhyOneday = (whyOneday || "").trim();
    const nonSpaceCount = cleanWhyOneday.replace(/\s/g, '').length;
    const totalCount = cleanWhyOneday.length;

    if (nonSpaceCount < 5) {
      toast.error("Please enter at least 5 characters.");
      return;
    }

    if (totalCount > 500) {
      toast.error("Please keep your response under 500 characters.");
      return;
    }

    await executeOnboardingPersistence(cleanWhyOneday, finalGender);
  };

  const toggleHobby = (hobby: string) => {
    if (hobbies.includes(hobby)) {
      setHobbies(hobbies.filter(h => h !== hobby));
    } else {
      setHobbies([...hobbies, hobby]);
    }
  };

  const toggleSport = (sport: string) => {
    if (sports.includes(sport)) {
      setSports(sports.filter(s => s !== sport));
    } else {
      if (sports.length >= 5) {
        toast.error("Maximum 5 favorite sports allowed.");
        return;
      }
      setSports([...sports, sport]);
    }
  };

  const filteredHobbies = HOBBIES_LIST.filter(h => h.toLowerCase().includes(hobbySearch.toLowerCase()));
  const filteredSports = ALL_SPORTS.filter(s => s.toLowerCase().includes(sportSearch.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/20 via-black to-blue-950/20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="relative w-full max-w-xl bg-[#0d0d0d] border border-white/10 rounded-3xl p-8 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col min-h-[580px]"
      >
        {/* Top Header / Progress */}
        {!isCompletedState && (
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white font-black text-xs">
                {step}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Step {step} of {totalSteps}
              </span>
            </div>
            {!isEditing && (
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                OneDay Onboarding
              </span>
            )}
          </div>
        )}

        {/* Success Screen */}
        {isCompletedState ? (
          isEditing ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-12"
            >
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                <Trophy size={40} className="animate-bounce" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                Profile Updated Successfully
              </h2>
              <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
                Your changes have been saved instantly.
              </p>
              <button
                onClick={() => {
                  onComplete();
                  refreshFromBackend();
                }}
                className="w-full max-w-xs bg-white text-black font-extrabold py-4 rounded-2xl hover:bg-slate-200 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.2)] active:scale-95 cursor-pointer text-sm uppercase tracking-wider"
              >
                Done
              </button>
            </motion.div>
          ) : (
            <div className="absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-4">
              <OnboardingTransition
                variant={activeVariant}
                status={transitionStatus}
                errorMessage={transitionError}
                userName={name || "Champion"}
                onRetry={() => {
                  const cleanWhy = (whyOneday || "").trim();
                  executeOnboardingPersistence(cleanWhy, gender);
                }}
                onComplete={() => {
                  console.log("[NAVIGATION] dashboard");
                  onComplete();
                  refreshFromBackend();
                }}
              />
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* STEP 1: Welcome / Name */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">Identity</span>
                    <h2 className="text-2xl font-black text-white tracking-tight">What shall we call you?</h2>
                    <p className="text-slate-400 text-xs">Enter your preferred name or champion title.</p>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Vance"
                      className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-5 py-4 text-white text-sm font-semibold outline-none transition-all placeholder:text-slate-600"
                      autoFocus
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 2: DOB & Age */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">Chronology</span>
                    <h2 className="text-2xl font-black text-white tracking-tight">When was your journey initiated?</h2>
                    <p className="text-slate-400 text-xs">Select your date of birth. Age is calculated automatically.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Date of Birth</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white text-sm font-semibold outline-none transition-all color-scheme-dark ${
                          dobValidationError
                            ? "border-rose-500/50 focus:border-rose-500 bg-rose-500/[0.04]"
                            : "border-white/10 focus:border-white/30"
                        }`}
                      />
                      <AnimatePresence>
                        {dobValidationError && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1.5 text-xs font-medium text-rose-400 mt-2.5 px-1"
                          >
                            <AlertCircle size={13} className="shrink-0 text-rose-400" />
                            <span>{dobValidationError}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className={`border rounded-2xl p-4 flex items-center justify-between transition-colors ${
                      dobValidationError
                        ? "bg-rose-500/[0.04] border-rose-500/20"
                        : "bg-white/5 border-white/10"
                    }`}>
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Calculated Age</span>
                      <span className={`text-xl font-black ${
                        dobValidationError ? "text-rose-400" : "text-white"
                      }`}>
                        {age !== null ? `${age} Years` : "—"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Gender */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">Profile</span>
                    <h2 className="text-2xl font-black text-white tracking-tight">How do you identify?</h2>
                    <p className="text-slate-400 text-xs">Select the radio card that best represents you.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {GENDER_OPTIONS.map(opt => {
                      const isSelected = gender === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setGender(opt.id)}
                          className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-white/15 border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-2xl">{opt.icon}</span>
                          <span className="text-xs font-bold uppercase tracking-wider">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Hobbies */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 flex flex-col h-full"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">Interests</span>
                    <h2 className="text-2xl font-black text-white tracking-tight">What fuels your mind?</h2>
                    <p className="text-slate-400 text-xs">Select hobbies that reflect your lifestyle ({hobbies.length} selected).</p>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium italic">You can always add these later from Settings.</p>
                  </div>

                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={hobbySearch}
                      onChange={(e) => setHobbySearch(e.target.value)}
                      placeholder="Search hobbies or type custom..."
                      className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl pl-11 pr-4 py-3 text-white text-xs outline-none transition-all"
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customHobbyInput}
                      onChange={(e) => setCustomHobbyInput(e.target.value)}
                      placeholder="Add custom hobby..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customHobbyInput.trim() && !hobbies.includes(customHobbyInput.trim())) {
                          setHobbies([...hobbies, customHobbyInput.trim()]);
                          setCustomHobbyInput("");
                        }
                      }}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      Add
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto pr-1 flex flex-wrap gap-2 custom-scrollbar">
                    {filteredHobbies.map(hobby => {
                      const isSelected = hobbies.includes(hobby);
                      return (
                        <button
                          key={hobby}
                          type="button"
                          onClick={() => toggleHobby(hobby)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isSelected 
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                          }`}
                        >
                          {isSelected && <Check size={12} className="inline mr-1" />}
                          {hobby}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 5: Favourite Sports */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 flex flex-col h-full"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">Athletics</span>
                    <h2 className="text-2xl font-black text-white tracking-tight">Favorite Sports</h2>
                    <p className="text-slate-400 text-xs">Choose up to 5 favorite sports ({sports.length}/5 selected).</p>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium italic">You can always add these later from Settings.</p>
                  </div>

                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={sportSearch}
                      onChange={(e) => setSportSearch(e.target.value)}
                      placeholder="Search outdoor & indoor sports..."
                      className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl pl-11 pr-4 py-3 text-white text-xs outline-none transition-all"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto pr-1 flex flex-wrap gap-2 custom-scrollbar">
                    {filteredSports.map(sport => {
                      const isSelected = sports.includes(sport);
                      return (
                        <button
                          key={sport}
                          type="button"
                          onClick={() => toggleSport(sport)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isSelected 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                          }`}
                        >
                          {isSelected && <Check size={12} className="inline mr-1" />}
                          {sport}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 6: Why did you choose OneDay? */}
              {step === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">Purpose & Commitment</span>
                    <h2 className="text-2xl font-black text-white tracking-tight">Why did you choose OneDay?</h2>
                    <p className="text-slate-400 text-xs">Declare your core intention and commitment (5 – 500 characters).</p>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <textarea
                        value={whyOneday}
                        onChange={(e) => setWhyOneday(e.target.value)}
                        rows={6}
                        placeholder="To build unbreakable consistency, eliminate distractions, and master my daily discipline..."
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl p-4 text-white text-sm outline-none transition-all resize-none placeholder:text-slate-600 leading-relaxed"
                      />
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <div>
                        {nonSpaceCharCount === 0 ? (
                          <span className="text-[11px] text-slate-500 font-medium">Please enter at least 5 characters.</span>
                        ) : nonSpaceCharCount < 5 ? (
                          <span className="text-[11px] text-amber-400 font-medium">
                            {5 - nonSpaceCharCount} more character{5 - nonSpaceCharCount === 1 ? "" : "s"} needed (minimum 5)
                          </span>
                        ) : totalCharCount > 500 ? (
                          <span className="text-[11px] text-rose-400 font-bold">
                            Please keep your response under 500 characters ({totalCharCount - 500} over)
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <Check size={12} /> Valid statement
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-xs font-bold uppercase tracking-wider ${
                          totalCharCount > 500
                            ? "text-rose-400 font-extrabold"
                            : nonSpaceCharCount >= 5
                            ? "text-slate-300"
                            : "text-slate-500"
                        }`}
                      >
                        {totalCharCount} / 500 chars
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2.5">
                {(step === 4 || step === 5) && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-4.5 py-3 rounded-xl border border-white/10 hover:border-white/20 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
                  >
                    Skip
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={saving}
                  className="bg-white text-black hover:bg-slate-200 px-6 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_4px_25px_rgba(255,255,255,0.2)] active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : step === totalSteps ? (
                    <>Complete <Check size={14} /></>
                  ) : (
                    <>Continue <ArrowRight size={14} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
