// src/store/settingsStore.ts

import { create } from "zustand";
import { Settings } from "../types";

interface SettingsState {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    soundEnabled: true,
    notificationsEnabled: true,
    dailyReminderTime: "08:00",
    pwaInstalled: false,
    compactView: false,
  },
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
}));
