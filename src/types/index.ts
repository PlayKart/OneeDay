// src/types/index.ts

export type TabState = "dashboard" | "habits" | "coach" | "settings";

export interface User {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  xp: number;
  streak: number;
  currentStreak?: number;
  level: number;
  levelProgress: number;
  freezeUntil?: string | null;
  freeze_until?: string | null;
  lastActiveDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  dob?: string;
  age?: number;
  gender?: string;
  hobbies?: string[];
  favouriteSports?: string[];
  reasonForJoining?: string;
  onboarded?: boolean;
  nextRoute?: string;
  hasCompletedOnboarding?: boolean;
  onboardingStep?: number;
}

export interface Habit {
  id: string;
  userId?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  completedToday: boolean;
  category?: string;
  icon?: string;
  color?: string;
  difficulty?: string;
  reminderTime?: string;
  notes?: string;
  repeatType?: "every_day" | "weekdays" | "weekends" | "custom_days";
  customDays?: string[];
  completedDates?: string[];
  isArchived?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  isPinned?: boolean;
  is_pinned?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  userId?: string;
}

export interface ChatMessage {
  id: string;
  sessionId?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  created_at?: string;
  isStreaming?: boolean;
}

export interface Quote {
  quote: string;
  author?: string;
  fetchedAt?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "achievement";
  read: boolean;
  createdAt: string;
}

export interface Statistics {
  totalHabits: number;
  completedToday: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  weeklyHistory: { date: string; completedCount: number }[];
}

export interface Settings {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  pwaInstalled: boolean;
  compactView: boolean;
}
