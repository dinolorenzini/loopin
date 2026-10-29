import { useState, useEffect, useCallback } from "react";

export type MessageStyle = "modern" | "spacious" | "inline";
export type BackgroundType =
  | "minimal-dark"
  | "starfield"
  | "constellation"
  | "aurora"
  | "matrix"
  | "fireflies"
  | "retro-grid"
  | "telegram-doodle"
  | "geometric-grid";

export interface SettingsState {
  themeColor: string;
  background: BackgroundType;
  messageStyle: MessageStyle;
  noAnimations: boolean;
}

export const THEME_PRESETS = [
  { name: "Yellow (Default)", color: "#facc15" },
  { name: "Sky Blue", color: "#38bdf8" },
  { name: "Emerald", color: "#34d399" },
  { name: "Neon Purple", color: "#c084fc" },
  { name: "Coral Rose", color: "#fb7185" },
  { name: "Tangerine", color: "#f97316" },
  { name: "Indigo", color: "#818cf8" },
  { name: "Teal", color: "#2dd4bf" },
];

export const BACKGROUND_OPTIONS: { id: BackgroundType; name: string; isAnimated: boolean; description: string }[] = [
  { id: "minimal-dark", name: "Minimal Dark", isAnimated: false, description: "Pure, high-contrast dark space (fastest)" },
  { id: "starfield", name: "Starfield Drift", isAnimated: true, description: "3D flowing celestial star warp" },
  { id: "constellation", name: "Constellation", isAnimated: true, description: "Interactive geometric node network" },
  { id: "aurora", name: "Aurora Liquid", isAnimated: true, description: "Gentle pulsing gradient sine waves" },
  { id: "matrix", name: "Cyber Rain", isAnimated: true, description: "Subtle falling digital code streams" },
  { id: "fireflies", name: "Floating Ember", isAnimated: true, description: "Ambient rising particles and soft light" },
  { id: "retro-grid", name: "Synthwave Grid", isAnimated: true, description: "Retro perspective horizon grid" },
  { id: "telegram-doodle", name: "Doodle Pattern", isAnimated: false, description: "Classic subtle chat pattern (Telegram style)" },
  { id: "geometric-grid", name: "Blueprint Grid", isAnimated: false, description: "Subtle architectural coordinate grid" },
];

const DEFAULT_SETTINGS: SettingsState = {
  themeColor: "#facc15", // Loopin Yellow default (Item 15)
  background: "starfield",
  messageStyle: "modern",
  noAnimations: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem("loopin_settings");
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Apply settings to document root CSS variables and attributes
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    root.style.setProperty("--primary-accent", settings.themeColor);
    root.setAttribute("data-message-style", settings.messageStyle);
    root.setAttribute("data-no-animations", settings.noAnimations ? "true" : "false");

    try {
      localStorage.setItem("loopin_settings", JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearAllData = useCallback(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch {}
  }, []);

  return {
    settings,
    updateSetting,
    clearAllData,
    THEME_PRESETS,
    BACKGROUND_OPTIONS,
  };
}
