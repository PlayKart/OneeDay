// src/services/dashboardService.ts

import { userService } from "./userService";
import { habitService } from "./habitService";
import { quoteService } from "./quoteService";
import { User, Habit, Statistics, Achievement, NotificationItem } from "../types";
import { safeArray, calculateStreak } from "../utils";

export interface DashboardData {
  user: User;
  habits: Habit[];
  quote: string;
  statistics: Statistics;
  achievements: Achievement[];
  notifications: NotificationItem[];
}

export const dashboardService = {
  async fetchDashboardData(): Promise<DashboardData> {
    const [userRes, habitsRes, quoteRes] = await Promise.all([
      userService.getUserProfile(),
      habitService.getHabits().catch(() => []),
      quoteService.getQuote().catch(() => "Discipline makes it all."),
    ]);

    const completedTodayCount = habitsRes.filter((h) => h.completedToday).length;
    const calculatedStreak = calculateStreak(habitsRes);

    userRes.streak = calculatedStreak;
    userRes.currentStreak = calculatedStreak;

    const statistics: Statistics = {
      totalHabits: habitsRes.length,
      completedToday: completedTodayCount,
      currentStreak: calculatedStreak,
      longestStreak: Math.max(calculatedStreak, (userRes as any)?.longestStreak ?? 7),
      completionRate: habitsRes.length > 0 ? Math.round((completedTodayCount / habitsRes.length) * 100) : 0,
      weeklyHistory: [],
    };

    const achievements: Achievement[] = [
      { id: "1", title: "First Step", description: "Complete your first habit", unlocked: completedTodayCount > 0 },
      { id: "2", title: "Unstoppable", description: "Reach a 7-day streak", unlocked: calculatedStreak >= 7, progress: calculatedStreak, maxProgress: 7 },
      { id: "3", title: "Master System", description: "Maintain 5 active habits", unlocked: habitsRes.length >= 5, progress: habitsRes.length, maxProgress: 5 },
    ];

    const notifications: NotificationItem[] = [
      {
        id: "1",
        title: "Daily Discipline",
        message: "Stay consistent today to maintain your streak.",
        type: "info",
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];

    return {
      user: userRes,
      habits: habitsRes,
      quote: quoteRes,
      statistics,
      achievements,
      notifications,
    };
  },
};
