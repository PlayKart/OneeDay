// src/hooks/useSettings.ts

import { useSettingsStore } from "../store/settingsStore";

export function useSettings() {
  const { settings, updateSettings } = useSettingsStore();

  return {
    settings,
    updateSettings,
  };
}
