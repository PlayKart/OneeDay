// src/utils/titleUtils.ts

export interface TitleMetadata {
  id: string;
  title: string;
  signature: string;
  category?: string;
  levelRequired?: number;
}

export const KNOWN_TITLES: Record<string, string> = {
  "DISCIPLINE BUILDER": "Consistency is becoming your standard.",
  "IRON MIND": "You've proven consistency isn't luck. It's your identity.",
  "HABIT MASTER": "Small daily actions compounding into monumental results.",
  "UNSTOPPABLE": "Momentum and willpower moving in perfect harmony.",
  "APEX DISCIPLINARIAN": "Operating at the pinnacle of personal standards.",
  "EARLY RISER": "Claiming victory before the rest of the world wakes.",
  "PROMISE KEEPER": "Your word to yourself is non-negotiable.",
  "FOCUS ARCHITECT": "Distraction eliminated. Pure execution achieved.",
  "RELENTLESS": "No excuses, no compromise, only progress.",
  "UNBREAKABLE": "Pressure reveals strength. Standards remain intact.",
  "GRANDMASTER": "Mastery over impulse, master of daily routine.",
  "CONSISTENT": "Showing up every single day without hesitation.",
  "FIRST STEP": "The journey of thousands of days begins with one.",
  "DAILY ARCHITECT": "Building a disciplined life, one routine at a time.",
  "VANGUARD": "Leading from the front through relentless execution.",
  "SOVEREIGN": "Complete autonomy and mastery over daily actions.",
  "CHAMPION": "Excellence is not an act, but a persistent habit.",
};

/**
 * Returns a confident, short description for any title.
 */
export function getTitleDescription(title?: string | null, customSignature?: string | null): string {
  if (customSignature && customSignature.trim().length > 0) {
    return customSignature.trim();
  }
  if (!title) return "Consistency is becoming your standard.";

  const normalized = title.trim().toUpperCase();
  if (KNOWN_TITLES[normalized]) {
    return KNOWN_TITLES[normalized];
  }

  return "Consistency is becoming your standard.";
}

function getStorageKey(userId?: string): string {
  const safeId = userId || localStorage.getItem("oneday_firebase_uid") || "me";
  return `oneday_seen_titles_${safeId}`;
}

function getEquippedKey(userId?: string): string {
  const safeId = userId || localStorage.getItem("oneday_firebase_uid") || "me";
  return `oneday_equipped_title_${safeId}`;
}

/**
 * Retrieves all title IDs/names that have been seen/viewed by the user.
 */
export function getSeenTitles(userId?: string): Set<string> {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set<string>(parsed.map((t) => String(t).toUpperCase().trim()));
    }
    return new Set<string>();
  } catch {
    return new Set<string>();
  }
}

/**
 * Marks a title as seen so it will never falsely trigger the unlock animation again.
 */
export function markTitleAsSeen(title: string, userId?: string): void {
  if (!title) return;
  try {
    const normalized = title.trim().toUpperCase();
    const seen = getSeenTitles(userId);
    seen.add(normalized);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(Array.from(seen)));
  } catch (err) {
    console.warn("Failed to persist seen title:", err);
  }
}

/**
 * Checks if a title has NOT yet been seen by the user.
 */
export function isTitleNew(title: string, userId?: string): boolean {
  if (!title) return false;
  const normalized = title.trim().toUpperCase();
  const seen = getSeenTitles(userId);
  return !seen.has(normalized);
}

/**
 * Retrieves the currently equipped title from user profile or local preference.
 */
export function getEquippedTitle(user?: any): string | null {
  if (user?.equippedTitle) return user.equippedTitle;
  if (user?.title && typeof user.title === "string") return user.title;
  try {
    const stored = localStorage.getItem(getEquippedKey(user?.id || user?.userId));
    if (stored && stored.trim().length > 0) return stored.trim();
  } catch {
    // fallback
  }
  return null;
}

/**
 * Persists the user's equipped title.
 */
export function setEquippedTitle(title: string, userId?: string): void {
  if (!title) return;
  try {
    localStorage.setItem(getEquippedKey(userId), title.trim());
  } catch (err) {
    console.warn("Failed to persist equipped title:", err);
  }
}

/**
 * Retrieves all unlocked titles for the user.
 */
export function getAllUserTitles(user?: any): string[] {
  const titlesStart = performance.now();
  const titlesSet = new Set<string>();

  // Extract from user.titles
  if (Array.isArray(user?.titles)) {
    user.titles.forEach((t: any) => {
      if (typeof t === "string" && t.trim()) titlesSet.add(t.trim().toUpperCase());
      if (t && typeof t === "object" && t.title) titlesSet.add(String(t.title).trim().toUpperCase());
    });
  }

  // Extract from user.unlockedTitles
  if (Array.isArray(user?.unlockedTitles)) {
    user.unlockedTitles.forEach((t: any) => {
      if (typeof t === "string" && t.trim()) titlesSet.add(t.trim().toUpperCase());
    });
  }

  // Extract user's current title if available
  if (user?.title && typeof user.title === "string") {
    titlesSet.add(user.title.trim().toUpperCase());
  }
  if (user?.equippedTitle && typeof user.equippedTitle === "string") {
    titlesSet.add(user.equippedTitle.trim().toUpperCase());
  }

  // Also include base level-unlocked title based on user level
  const userLevel = user?.level || 1;
  if (userLevel >= 1) titlesSet.add("DISCIPLINE BUILDER");
  if (userLevel >= 3) titlesSet.add("IRON MIND");
  if (userLevel >= 5) titlesSet.add("HABIT MASTER");
  if (userLevel >= 7) titlesSet.add("UNSTOPPABLE");
  if (userLevel >= 10) titlesSet.add("APEX DISCIPLINARIAN");

  // If streak milestone reached
  const streak = user?.currentStreak || user?.streak || 0;
  if (streak >= 7) titlesSet.add("CONSISTENT");
  if (streak >= 14) titlesSet.add("RELENTLESS");
  if (streak >= 30) titlesSet.add("UNBREAKABLE");

  const results = Array.from(titlesSet);
  console.log(`[PERF] titles: ${Math.round(performance.now() - titlesStart)}ms`);
  return results;
}

/**
 * Plays a single subtle Apple/Linear-style audio confirmation chime (if audio context is allowed).
 */
export function playTitleUnlockSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const now = ctx.currentTime;

    // Harmonic arpeggio chime: 587.33Hz (D5) -> 880Hz (A5) -> 1174.66Hz (D6)
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch {
    // Graceful fallback if browser blocks or doesn't support Web Audio
  }
}
