import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

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
  bgDim: number; // 0 to 1, default 0.45
  bgBlur: number; // 0 to 20px, default 0
  shaderSpeed: number; // 0.25 to 3.0, default 1.0
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
  { id: "starfield", name: "Warp Starfield", isAnimated: true, description: "Hyperspace light-speed star warp" },
  { id: "constellation", name: "Neural Network", isAnimated: true, description: "Interactive geometric node constellation" },
  { id: "aurora", name: "Aurora Silk", isAnimated: true, description: "Silky undulating neon gradient waves" },
  { id: "matrix", name: "Cyber Rain", isAnimated: true, description: "Cascading digital code streams with glowing heads" },
  { id: "fireflies", name: "Fireflies", isAnimated: true, description: "Organic bioluminescent floating particles" },
  { id: "retro-grid", name: "Synthwave 80s", isAnimated: true, description: "Infinite perspective horizon grid & neon sun" },
  { id: "telegram-doodle", name: "Doodle Pattern", isAnimated: false, description: "Classic chat pattern (Telegram style)" },
  { id: "geometric-grid", name: "Blueprint Grid", isAnimated: false, description: "Subtle architectural coordinate grid" },
];

const DEFAULT_SETTINGS: SettingsState = {
  themeColor: "#facc15",
  background: "minimal-dark",
  bgDim: 0.45,
  bgBlur: 0,
  shaderSpeed: 1.0,
  messageStyle: "modern",
  noAnimations: false,
};

interface SettingsContextType {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  clearAllData: () => void;
  THEME_PRESETS: typeof THEME_PRESETS;
  BACKGROUND_OPTIONS: typeof BACKGROUND_OPTIONS;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem("loopin_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Seamlessly migrate previous session default ("starfield") to new "minimal-dark" default
        if (!localStorage.getItem("loopin_v2_dark_default")) {
          localStorage.setItem("loopin_v2_dark_default", "true");
          if (parsed.background === "starfield") {
            parsed.background = "minimal-dark";
          }
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    root.style.setProperty("--primary-accent", settings.themeColor);
    root.style.setProperty("--bg-dim-opacity", String(settings.bgDim));
    root.style.setProperty("--bg-blur-amount", `${settings.bgBlur}px`);
    root.setAttribute("data-message-style", settings.messageStyle);
    root.setAttribute("data-no-animations", settings.noAnimations ? "true" : "false");

    try {
      localStorage.setItem("loopin_settings", JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
  }, []);

  const clearAllData = useCallback(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch {}
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        clearAllData,
        THEME_PRESETS,
        BACKGROUND_OPTIONS,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      settings: DEFAULT_SETTINGS,
      updateSetting: () => {},
      clearAllData: () => {},
      THEME_PRESETS,
      BACKGROUND_OPTIONS,
    };
  }
  return ctx;
}
