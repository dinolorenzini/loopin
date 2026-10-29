import { useState, useCallback } from "react";
import type { User } from "../../server/types";

export const USER_COLORS = [
  "#38bdf8", // Sky
  "#818cf8", // Indigo
  "#c084fc", // Purple
  "#f472b6", // Pink
  "#fb7185", // Rose
  "#f97316", // Orange
  "#fbbf24", // Amber
  "#34d399", // Emerald
  "#2dd4bf", // Teal
  "#a78bfa", // Violet
];

const DEFAULT_AVATARS = ["⚡", "✨", "🚀", "🪐", "🦊", "🐯", "👾", "🥑", "💎", "🔥", "🔮", "🌊"];

function generateRandomName(): string {
  const adjectives = ["Swift", "Quiet", "Bright", "Neon", "Cosmic", "Lunar", "Velvet", "Solar", "Echo", "Hyper"];
  const animals = ["Fox", "Wolf", "Otter", "Panda", "Falcon", "Lynx", "Badger", "Owl", "Gecko", "Tiger"];
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
        avatar: DEFAULT_AVATARS[0],
        joinedAt: Date.now(),
      };
    }

    let id = localStorage.getItem("loopin_user_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("loopin_user_id", id);
    }

    let name = localStorage.getItem("loopin_user_name");
    if (!name) {
      name = generateRandomName();
      localStorage.setItem("loopin_user_name", name);
    }

    let color = localStorage.getItem("loopin_user_color");
    if (!color) {
      color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      localStorage.setItem("loopin_user_color", color);
    }

    let avatar = localStorage.getItem("loopin_user_avatar");
    if (!avatar) {
      avatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
      localStorage.setItem("loopin_user_avatar", avatar);
    }

    return {
      id,
      name,
      color,
      avatar,
      joinedAt: Date.now(),
    };
  });

  const updateUser = useCallback((updates: Partial<Pick<User, "name" | "color" | "avatar">>) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      if (typeof window !== "undefined") {
        if (updates.name !== undefined) localStorage.setItem("loopin_user_name", next.name);
        if (updates.color !== undefined) localStorage.setItem("loopin_user_color", next.color);
        if (updates.avatar !== undefined) localStorage.setItem("loopin_user_avatar", next.avatar || "");
      }
      return next;
    });
  }, []);

  return { user, updateUser, USER_COLORS, DEFAULT_AVATARS };
}
