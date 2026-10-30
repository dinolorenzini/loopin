import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type MessageStyle = "modern" | "spacious" | "inline";
export type ThemeMode = "dark" | "light" | "system";

export type BackgroundType =
  | "minimal-dark"
  | "blueprint-grid"
  | "telegram-doodle"
  | "starfield"
  | "constellation"
  | "aurora"
  | "matrix"
  | "fireflies"
  | "retro-grid";

export type SettingsCategory =
  | "appearance"
  | "background"
  | "chat"
  | "profile"
  | "sound"
  | "accessibility"
  | "privacy";

export interface BackgroundCustomConfig {
  // Common visual tuning
  dim: number; // 0 to 0.95
  blur: number; // 0 to 20px
  brightness: number; // 0.5 to 1.5
  contrast: number; // 0.5 to 1.5
  speed: number; // 0.2 to 2.5
  // Specialized parameters
  particleCount?: number;
  waveAmp?: number;
  waveFreq?: number;
  trailLength?: number;
  charSet?: "matrix" | "binary" | "ascii";
  paletteMode?: "accent" | "custom";
  customColors?: string[];
}

export interface SettingsState {
  themeColor: string; // Default #facc15
  themeMode: ThemeMode;
  background: BackgroundType;
  bgCustom: Record<BackgroundType, BackgroundCustomConfig>;
  messageStyle: MessageStyle;
  noAnimations: boolean;
  performanceMode: boolean; // Chromebook & low-power mode
  soundMuted: boolean;
  notificationsEnabled: boolean;
  activeCategory: SettingsCategory;
}

export const THEME_PRESETS = [
  { name: "Yellow", color: "#facc15" },
  { name: "Sky Blue", color: "#38bdf8" },
  { name: "Emerald", color: "#34d399" },
  { name: "Purple", color: "#c084fc" },
  { name: "Rose", color: "#fb7185" },
  { name: "Orange", color: "#f97316" },
  { name: "Indigo", color: "#818cf8" },
  { name: "Teal", color: "#2dd4bf" },
];

export interface BackgroundMeta {
  id: BackgroundType;
  name: string;
  category: "simple" | "animated";
  description: string;
  heavy?: boolean;
}

export const BACKGROUND_LIST: BackgroundMeta[] = [
  // Simple
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    category: "simple",
    description: "Neutral dark space with high contrast.",
  },
  {
    id: "blueprint-grid",
    name: "Blueprint Grid",
    category: "simple",
    description: "Subtle architectural coordinate grid.",
  },
  {
    id: "telegram-doodle",
    name: "Doodle Pattern",
    category: "simple",
    description: "Classic quiet chat pattern.",
  },
  // Animated
  {
    id: "starfield",
    name: "Warp Starfield",
    category: "animated",
    description: "Perspective star streaks moving forward.",
    heavy: false,
  },
  {
    id: "constellation",
    name: "Neural Network",
    category: "animated",
    description: "Interactive node constellation connecting dynamically.",
    heavy: true,
  },
  {
    id: "aurora",
    name: "Aurora Silk",
    category: "animated",
    description: "Silky undulating gradient ribbons.",
    heavy: false,
  },
  {
    id: "matrix",
    name: "Cyber Rain",
    category: "animated",
    description: "Cascading digital code streams.",
    heavy: true,
  },
  {
    id: "fireflies",
    name: "Fireflies",
    category: "animated",
    description: "Bioluminescent floating particles.",
    heavy: false,
  },
  {
    id: "retro-grid",
    name: "Synthwave 80s",
    category: "animated",
    description: "Perspective horizon grid and sliced sun.",
    heavy: true,
  },
];

export const DEFAULT_BG_CONFIG: Record<BackgroundType, BackgroundCustomConfig> = {
  "minimal-dark": {
    dim: 0.2,
    blur: 0,
    brightness: 1.0,
    contrast: 1.0,
    speed: 1.0,
  },
  "blueprint-grid": {
    dim: 0.2,
    blur: 0,
    brightness: 1.0,
    contrast: 1.0,
    speed: 1.0,
  },
  "telegram-doodle": {
    dim: 0.25,
    blur: 0,
    brightness: 1.0,
    contrast: 1.0,
    speed: 1.0,
  },
  starfield: {
    dim: 0.35,
    blur: 0,
    brightness: 1.0,
    contrast: 1.0,
    speed: 0.8,
    particleCount: 160,
  },
  constellation: {
    dim: 0.35,
    blur: 0,
    brightness: 1.0,
    contrast: 1.0,
    speed: 0.7,
    particleCount: 55,
  },
  aurora: {
    dim: 0.3,
    blur: 0,
    brightness: 1.0,
    contrast: 1.0,
    speed: 0.7,
    waveAmp: 45,
    waveFreq: 0.0025,
  },
  matrix: {
    dim: 0.3,
    blur: 0,
    brightness: 1.0,
    contrast: 1.0,
    speed: 0.8,
    trailLength: 28,
    charSet: "matrix",
  },
  fireflies: {
    dim: 0.3,
    blur: 0,
    brightness: 1.0,
    contrast: 1.0,
    speed: 0.7,
    particleCount: 40,
  },
  "retro-grid": {
    dim: 0.35,
    blur: 0,
    brightness: 1.0,
    contrast: 1.0,
    speed: 0.7,
  },
};

export const DEFAULT_SETTINGS: SettingsState = {
  themeColor: "#facc15",
  themeMode: "dark",
  background: "minimal-dark",
  bgCustom: DEFAULT_BG_CONFIG,
  messageStyle: "modern",
  noAnimations: false,
  performanceMode: false,
  soundMuted: false,
  notificationsEnabled: false,
  activeCategory: "appearance",
};

export function getAccessibleTextColor(hexColor?: string): string {
  if (!hexColor || !hexColor.startsWith("#")) return "#09090b";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) || 0;
  const g = parseInt(hex.slice(2, 4), 16) || 0;
  const b = parseInt(hex.slice(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? "#09090b" : "#ffffff";
}

interface SettingsContextType {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  updateBgCustom: (bgId: BackgroundType, patch: Partial<BackgroundCustomConfig>) => void;
  resetBgCustom: (bgId: BackgroundType) => void;
  randomizeBgCustom: (bgId: BackgroundType) => void;
  resetAllDefaults: () => void;
  clearAllData: () => void;
  THEME_PRESETS: typeof THEME_PRESETS;
  BACKGROUND_LIST: typeof BACKGROUND_LIST;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem("loopin_settings_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          bgCustom: {
            ...DEFAULT_BG_CONFIG,
            ...(parsed.bgCustom || {}),
          },
        };
      }
      // Migrate legacy loopin_settings
      const legacy = localStorage.getItem("loopin_settings");
      if (legacy) {
        const legacyParsed = JSON.parse(legacy);
        return {
          ...DEFAULT_SETTINGS,
          themeColor: legacyParsed.themeColor || "#facc15",
          background:
            legacyParsed.background === "geometric-grid"
              ? "blueprint-grid"
              : legacyParsed.background || "minimal-dark",
          messageStyle: legacyParsed.messageStyle || "modern",
          noAnimations: !!legacyParsed.noAnimations,
        };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Apply CSS variables and root attributes
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    root.style.setProperty("--primary-accent", settings.themeColor);
    root.style.setProperty("--primary-accent-contrast", getAccessibleTextColor(settings.themeColor));
    root.setAttribute("data-theme", settings.themeMode);
    root.setAttribute("data-message-style", settings.messageStyle);
    root.setAttribute("data-no-animations", settings.noAnimations ? "true" : "false");
    root.setAttribute("data-perf-mode", settings.performanceMode ? "true" : "false");

    const currentBgConfig = settings.bgCustom[settings.background] || DEFAULT_BG_CONFIG[settings.background];
    if (currentBgConfig) {
      root.style.setProperty("--bg-dim-opacity", String(currentBgConfig.dim));
      root.style.setProperty("--bg-blur-amount", `${currentBgConfig.blur}px`);
      root.style.setProperty("--bg-brightness", String(currentBgConfig.brightness));
      root.style.setProperty("--bg-contrast", String(currentBgConfig.contrast));
    }

    try {
      localStorage.setItem("loopin_settings_v3", JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateBgCustom = useCallback((bgId: BackgroundType, patch: Partial<BackgroundCustomConfig>) => {
    setSettings((prev) => {
      const current = prev.bgCustom[bgId] || DEFAULT_BG_CONFIG[bgId];
      return {
        ...prev,
        bgCustom: {
          ...prev.bgCustom,
          [bgId]: { ...current, ...patch },
        },
      };
    });
  }, []);

  const resetBgCustom = useCallback((bgId: BackgroundType) => {
    setSettings((prev) => ({
      ...prev,
      bgCustom: {
        ...prev.bgCustom,
        [bgId]: { ...DEFAULT_BG_CONFIG[bgId] },
      },
    }));
  }, []);

  const randomizeBgCustom = useCallback((bgId: BackgroundType) => {
    setSettings((prev) => {
      const current = prev.bgCustom[bgId] || DEFAULT_BG_CONFIG[bgId];
      const randomized: Partial<BackgroundCustomConfig> = {
        dim: Math.round((0.15 + Math.random() * 0.45) * 100) / 100,
        speed: Math.round((0.4 + Math.random() * 1.0) * 10) / 10,
        brightness: Math.round((0.85 + Math.random() * 0.3) * 100) / 100,
      };

      if (bgId === "starfield") {
        randomized.particleCount = Math.floor(100 + Math.random() * 200);
      } else if (bgId === "constellation") {
        randomized.particleCount = Math.floor(35 + Math.random() * 45);
      } else if (bgId === "aurora") {
        randomized.waveAmp = Math.floor(25 + Math.random() * 45);
        randomized.waveFreq = Math.round((0.0015 + Math.random() * 0.003) * 10000) / 10000;
      } else if (bgId === "matrix") {
        randomized.trailLength = Math.floor(15 + Math.random() * 25);
      } else if (bgId === "fireflies") {
        randomized.particleCount = Math.floor(25 + Math.random() * 40);
      }

      return {
        ...prev,
        bgCustom: {
          ...prev.bgCustom,
          [bgId]: { ...current, ...randomized },
        },
      };
    });
  }, []);

  const resetAllDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem("loopin_settings_v3");
      localStorage.removeItem("loopin_settings");
    } catch {}
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
        updateBgCustom,
        resetBgCustom,
        randomizeBgCustom,
        resetAllDefaults,
        clearAllData,
        THEME_PRESETS,
        BACKGROUND_LIST,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    return {
      settings: DEFAULT_SETTINGS,
      updateSetting: () => {},
      updateBgCustom: () => {},
      resetBgCustom: () => {},
      randomizeBgCustom: () => {},
      resetAllDefaults: () => {},
      clearAllData: () => {},
      THEME_PRESETS,
      BACKGROUND_LIST,
    };
  }
  return ctx;
}
