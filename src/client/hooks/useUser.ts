import { useState, useCallback } from "react";
import type { User } from "../../server/types";

export const USER_COLORS = [
  "#facc15", // Loopin Yellow (Default)
  "#38bdf8", // Sky
  "#818cf8", // Indigo
  "#c084fc", // Purple
  "#f472b6", // Pink
  "#fb7185", // Rose
  "#f97316", // Orange
  "#34d399", // Emerald
  "#2dd4bf", // Teal
  "#a78bfa", // Violet
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

    // Use session-specific ID so multiple tabs on the same computer can chat independently (fixes items 5 & 6)
    let id = sessionStorage.getItem("loopin_tab_user_id");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("loopin_tab_user_id", id);
    }

    let name = localStorage.getItem("loopin_user_name");
    if (!name) {
      name = generateRandomName();
      localStorage.setItem("loopin_user_name", name);
    }

    let color = localStorage.getItem("loopin_user_color");
    if (!color) {
      // Loopin default color is Yellow (Item 15)
      color = USER_COLORS[0];
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
      const next = { ...prev, ...updates };
      if (typeof window !== "undefined") {
        if (updates.name !== undefined) localStorage.setItem("loopin_user_name", next.name);
        if (updates.color !== undefined) localStorage.setItem("loopin_user_color", next.color);
      }
      return next;
    });
  }, []);

  return { user, updateUser, USER_COLORS };
}
