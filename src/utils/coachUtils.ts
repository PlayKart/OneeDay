// src/utils/coachUtils.ts

import { ChatSession, User, Habit } from "../types";

/**
 * Strips raw UUIDs, date stamps, and redundant "Session #123" prefixes
 * to produce clean, executive conversation titles.
 */
export function cleanCoachTitle(title?: string): string {
  if (!title) return "Strategy Session";

  let cleaned = title.trim();

  // Strip YYYY-MM-DD or date stamps
  cleaned = cleaned.replace(/\b\d{4}-\d{2}-\d{2}\b/g, "").trim();

  // Strip session prefix and raw UUIDs or numbers (e.g., "Session 5f3a", "Chat #12", "Conversation 3")
  cleaned = cleaned.replace(/^(Session|Chat|ID|Conversation|Thread)\s*[#\-:_]?\s*([a-f0-9\-]+|\d+)?\s*[:\-–—]?\s*/gi, "").trim();
  cleaned = cleaned.replace(/\s*\(?(Session|Chat|ID|Conversation)\s*[#\-:_]?\s*([a-f0-9\-]+|\d+)\)?\s*$/gi, "").trim();

  // Strip leading/trailing punctuation
  cleaned = cleaned.replace(/^[\-_:\s|–—]+|[\-_:\s|–—]+$/g, "").trim();

  // Handle generic fallbacks
  if (!cleaned || cleaned.toLowerCase() === "new chat" || cleaned.toLowerCase() === "new conversation") {
    return "New Strategy Session";
  }

  // Capitalize properly if needed
  if (cleaned.length > 0 && cleaned === cleaned.toLowerCase()) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned.length > 40 ? `${cleaned.slice(0, 38)}...` : cleaned;
}

export interface GroupedSessions {
  pinned: ChatSession[];
  today: ChatSession[];
  yesterday: ChatSession[];
  thisWeek: ChatSession[];
  earlier: ChatSession[];
}

/**
 * Groups chat sessions chronologically into standard executive sections:
 * Pinned, Today, Yesterday, This Week, Earlier.
 */
export function groupSessionsByDate(sessions: ChatSession[]): GroupedSessions {
  const grouped: GroupedSessions = {
    pinned: [],
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  for (const session of sessions) {
    if (session.isPinned || session.is_pinned) {
      grouped.pinned.push(session);
      continue;
    }

    const dateStr = session.updatedAt || session.updated_at || session.createdAt || session.created_at;
    const sessionTime = dateStr ? new Date(dateStr).getTime() : 0;

    if (sessionTime >= todayStart) {
      grouped.today.push(session);
    } else if (sessionTime >= yesterdayStart) {
      grouped.yesterday.push(session);
    } else if (sessionTime >= weekStart) {
      grouped.thisWeek.push(session);
    } else {
      grouped.earlier.push(session);
    }
  }

  return grouped;
}

/**
 * Formats a timestamp into clean, scannable relative time.
 */
export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0 && now.getDate() === d.getDate()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1 || (diffDays === 0 && now.getDate() !== d.getDate())) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  } else {
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

/**
 * Generates an authoritative, dynamic greeting reflecting actual backend user & habit state.
 */
export function getSmartGreeting(user: User | null, habits: Habit[]): {
  headline: string;
  subtext: string;
  tag: string;
  statusType: "ahead" | "behind" | "streak" | "neutral";
} {
  const activeHabits = Array.isArray(habits) ? habits.filter((h) => !h.isArchived) : [];
  const total = activeHabits.length;
  const completed = activeHabits.filter((h) => h.completedToday).length;
  const pending = total - completed;
  const streak = typeof user?.currentStreak === "number" ? user.currentStreak : user?.streak || 0;
  const userName = user?.name ? user.name.split(" ")[0] : "Warrior";

  if (total > 0 && pending === 0) {
    return {
      headline: `Clean day, ${userName}.`,
      subtext: `You executed all ${total} habits today. Protect that standard and set the baseline for tomorrow.`,
      tag: "100% EXECUTED",
      statusType: "ahead",
    };
  }

  if (total > 0 && pending > 0) {
    return {
      headline: `${pending} habit${pending > 1 ? "s" : ""} pending today.`,
      subtext: `Eliminate hesitation. Focus on the single highest-leverage action in front of you.`,
      tag: `${completed}/${total} COMPLETED`,
      statusType: "behind",
    };
  }

  if (streak > 0) {
    return {
      headline: `${streak}-Day Streak Active.`,
      subtext: `Momentum is built through consistency. What is your primary objective right now?`,
      tag: `${streak} DAYS STRONG`,
      statusType: "streak",
    };
  }

  return {
    headline: `What are we working on?`,
    subtext: `Your discipline. Your system. Your next move.`,
    tag: "ONE DAY PROTOCOL",
    statusType: "neutral",
  };
}

export interface QuickPromptItem {
  label: string;
  desc: string;
  prompt: string;
  icon: string;
}

/**
 * Returns context-aware starter prompt protocols based on actual backend habit metrics.
 */
export function getContextAwarePrompts(habits: Habit[]): QuickPromptItem[] {
  const activeHabits = Array.isArray(habits) ? habits.filter((h) => !h.isArchived) : [];
  const completed = activeHabits.filter((h) => h.completedToday).length;
  const pending = activeHabits.length - completed;

  if (activeHabits.length > 0 && pending > 0) {
    const incompleteNames = activeHabits
      .filter((h) => !h.completedToday)
      .map((h) => h.name)
      .slice(0, 3)
      .join(", ");

    return [
      {
        label: "Finish Today's Protocol",
        desc: `Execute remaining habits (${incompleteNames})`,
        prompt: `I still have ${pending} habits remaining today (${incompleteNames}). Give me an aggressive, sequential execution protocol to eliminate hesitation and finish them right now.`,
        icon: "⚡",
      },
      {
        label: "Give Me My Next Action",
        desc: "Identify the single highest-leverage step",
        prompt: `Look at my pending daily habits. What is the single highest-leverage action I must take right now, and how should I set up my environment to guarantee completion?`,
        icon: "🎯",
      },
      {
        label: "Stop Procrastinating",
        desc: "Break cognitive resistance & execute",
        prompt: `I am feeling resistance and friction around completing my habits today. Calibrate my mindset directly, eliminate my excuses, and give me a 5-minute starting sequence.`,
        icon: "🛡️",
      },
      {
        label: "Audit My Consistency",
        desc: "Find friction points holding back progress",
        prompt: `Audit my habit system. Where is the primary friction point causing inconsistency, and what specific rules should I install to fix it?`,
        icon: "📊",
      },
      {
        label: "Deep Work Sprint",
        desc: "Lock into a 90-minute immersion block",
        prompt: `How do I structure an unbreakable 90-minute deep work sprint with zero distractions to tackle my primary objective?`,
        icon: "⏱️",
      },
      {
        label: "Raise the Standard",
        desc: "Make today's protocol more rigorous",
        prompt: `I want to push past my comfortable baseline today. Give me the highest-standard version of my daily discipline protocol.`,
        icon: "🔥",
      },
    ];
  }

  return [
    {
      label: "Review Today's Execution",
      desc: "Analyze standard & lock in daily gains",
      prompt: `I completed my habits for today. Help me debrief today's execution, identify any efficiency gains, and reinforce my discipline.`,
      icon: "🏆",
    },
    {
      label: "Plan Tomorrow's Blueprint",
      desc: "Pre-commit to tomorrow's victory",
      prompt: `Design an optimal morning momentum protocol and priority schedule for tomorrow so I wake up with zero friction.`,
      icon: "🧭",
    },
    {
      label: "Deep Work Sprint",
      desc: "Lock into 90-minute focus block",
      prompt: `How do I structure a 90-minute hyper-focused deep work sprint with zero distractions and complete cognitive immersion?`,
      icon: "🎯",
    },
    {
      label: "Habit Audit",
      desc: "Identify long-term compounding bottlenecks",
      prompt: `Audit my current habit consistency and identify the next habit or standard I should integrate to level up.`,
      icon: "📊",
    },
    {
      label: "Eliminate Distractions",
      desc: "Purge digital noise & shallow work",
      prompt: `Give me a ruthless protocol to eliminate digital distractions, phone checking, and shallow task-switching during my work hours.`,
      icon: "🛡️",
    },
    {
      label: "Push the Standard Higher",
      desc: "Eliminate complacency & stretch capacity",
      prompt: `I am hitting my current goals consistently. How do I raise the difficulty, challenge my discipline, and expand my capacity?`,
      icon: "🔥",
    },
  ];
}

/**
 * Returns contextual follow-up chips shown above the composer in active conversations.
 */
export function getFollowUpChips(habits: Habit[]): { label: string; text: string }[] {
  const activeHabits = Array.isArray(habits) ? habits.filter((h) => !h.isArchived) : [];
  const hasIncomplete = activeHabits.some((h) => !h.completedToday);

  if (hasIncomplete) {
    return [
      {
        label: "Give me 3 immediate steps",
        text: "Break this down into 3 concrete, immediate action steps I must take right now.",
      },
      {
        label: "Make it more rigorous",
        text: "Increase the rigor and eliminate any leeway. Give me the highest-standard version of this protocol.",
      },
      {
        label: "Next habit to tackle",
        text: "Which of my remaining habits should I knock out first for maximum momentum?",
      },
      {
        label: "Summarize as checklist",
        text: "Summarize this entire protocol into a clear, concise bulleted checklist.",
      },
    ];
  }

  return [
    {
      label: "Give me 3 concrete steps",
      text: "Break this down into 3 concrete, immediate action steps I must take right now.",
    },
    {
      label: "Make it more rigorous",
      text: "Increase the rigor and eliminate any leeway. Give me the highest-standard version of this protocol.",
    },
    {
      label: "Plan tomorrow's morning",
      text: "Based on this, what exact morning routine should I follow tomorrow?",
    },
    {
      label: "Summarize as checklist",
      text: "Summarize this entire protocol into a clear, concise bulleted checklist.",
    },
  ];
}
