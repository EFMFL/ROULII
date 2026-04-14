import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from './types';

interface SettingsState {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export const useSettingsStore = create<SettingsState>()(persist((set) => ({
  settings: {
    darkMode: false,
    notifications: true,
    language: 'fr',
    privacy: true,
  },
  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),
}), { name: 'roulii-settings', version: 2 }));
