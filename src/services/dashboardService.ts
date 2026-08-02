// src/services/dashboardService.ts

import { userService } from "./userService";
import { habitService } from "./habitService";
import { quoteService } from "./quoteService";
import { User, Habit, Statistics, Achievement, NotificationItem } from "../types";
import { safeArray } from "../utils";

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
    const [userRes, habitsRes] = await Promise.all([
      userService.getUserProfile().catch(() => ({
        id: "me",
        name: "User",
        xp: 0,
        streak: 0,
        level: 1,
        levelProgress: 0,
      })),
      habitService.getHabits().catch(() => []),
    ]);

    const quoteRes = await quoteService
      .getQuote(userRes.streak, habitsRes)
      .catch(() => "Discipline makes it all.");

    const completedTodayCount = habitsRes.filter((h) => h.completedToday).length;

    const statistics: Statistics = {
      totalHabits: habitsRes.length,
      completedToday: completedTodayCount,
      currentStreak: userRes.streak,
      longestStreak: Math.max(userRes.streak, 7),
      completionRate: habitsRes.length > 0 ? Math.round((completedTodayCount / habitsRes.length) * 100) : 0,
      weeklyHistory: [],
    };

    const achievements: Achievement[] = [
      { id: "1", title: "First Step", description: "Complete your first habit", unlocked: completedTodayCount > 0 },
      { id: "2", title: "Unstoppable", description: "Reach a 7-day streak", unlocked: userRes.streak >= 7, progress: userRes.streak, maxProgress: 7 },
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
