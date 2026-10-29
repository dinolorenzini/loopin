import { useState, useCallback } from "react";
import type { User } from "../../server/types";

export const USER_COLORS = [
  "#facc15", // Loopin Gold
  "#38bdf8", // Sky Blue
  "#34d399", // Emerald Green
  "#c084fc", // Vivid Purple
  "#fb7185", // Coral Rose
  "#fb923c", // Tangerine Orange
  "#2dd4bf", // Mint Teal
  "#f472b6", // Bright Pink
  "#818cf8", // Electric Indigo
  "#a3e635", // Bright Lime
  "#60a5fa", // Light Azure
  "#e879f9", // Orchid Magenta
];

function generateRandomName(): string {
  const adjectives = ["Swift", "Bright", "Neon", "Solar", "Cosmic", "Lunar", "Echo", "Hyper", "Vivid", "Nova"];
  const animals = ["Fox", "Wolf", "Otter", "Falcon", "Lynx", "Tiger", "Badger", "Owl", "Gecko", "Panda"];
  const num = Math.floor(10 + Math.random() * 90);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj}${animal}-${num}`;
}

export function useUser() {
  const [user, setUser] = useState<User>(() => {
    if (typeof window === "undefined") {
      return {
        id: "anon",
        name: "Guest",
        color: USER_COLORS[0],
        joinedAt: Date.now(),
        isFocused: true,
      };
    }

    // Stable user ID across tabs, reconnects, and page refreshes (Fixes Item 1 duplicate members)
    let id = localStorage.getItem("loopin_user_id") || sessionStorage.getItem("loopin_tab_user_id");
    if (!id) {
      id = crypto.randomUUID();
    }
    localStorage.setItem("loopin_user_id", id);
    sessionStorage.setItem("loopin_tab_user_id", id);

    let name = localStorage.getItem("loopin_user_name");
    if (!name) {
      name = generateRandomName().slice(0, 16);
      localStorage.setItem("loopin_user_name", name);
    } else {
      name = name.slice(0, 16);
    }

    // Random name color when first joining, stable for the session/reconnects (Fixes Item 2)
    let color = localStorage.getItem("loopin_user_color");
    if (!color || !USER_COLORS.includes(color)) {
      color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      localStorage.setItem("loopin_user_color", color);
    }

    return {
      id,
      name,
      color,
      joinedAt: Date.now(),
      isFocused: true,
    };
  });

  const updateUser = useCallback((updates: Partial<Pick<User, "name" | "color">>) => {
    setUser((prev) => {
      const sanitizedName = updates.name !== undefined ? updates.name.trim().slice(0, 16) : prev.name;
      const next = { ...prev, ...updates, name: sanitizedName };
      if (typeof window !== "undefined") {
        if (updates.name !== undefined) localStorage.setItem("loopin_user_name", next.name);
        if (updates.color !== undefined) localStorage.setItem("loopin_user_color", next.color);
      }
      return next;
    });
  }, []);

  return { user, updateUser, USER_COLORS };
}
