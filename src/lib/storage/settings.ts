import type { Section } from "../timer/sectionTimer";

export interface AppSettings {
  speed: { min: number; max: number };
  fillerWords: string[];
  pauseDuration: number;
  sections: Section[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  speed: { min: 4, max: 6 },
  fillerWords: [
    "어", "음", "그", "저", "뭐", "그리고", "근데", "이제", "사실", "기본적으로", "햄버거",
  ],
  pauseDuration: 3,
  sections: [],
};

const KEY = "presentaion:settings";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as AppSettings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function resetSettings(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
