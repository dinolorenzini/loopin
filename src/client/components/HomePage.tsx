import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Clock,
  Trash2,
  Settings,
  Hash,
  AlertCircle,
} from "lucide-react";
import type { User } from "../../server/types";
import { ChatBackground } from "./ChatBackground";
import { SettingsModal } from "./SettingsModal";
import { LoopinLogo } from "./LoopinLogo";

interface HomePageProps {
  onJoinRoom: (room: string) => void;
  currentUser: User;
  onUpdateUser: (updates: Partial<Pick<User, "name" | "color">>) => void;
}

interface RecentRoom {
  id: string;
  name: string;
  visitedAt: number;
}

function generateRoomSlug(): string {
  const adjs = [
    "swift",
    "cosmic",
    "neon",
    "lunar",
    "hyper",
    "silent",
    "ember",
    "sonic",
    "alpha",
    "zenith",
    "vivid",
    "stellar",
  ];
  const nouns = [
    "fox",
    "pulse",
    "orbit",
    "spark",
    "forge",
    "haven",
    "nexus",
    "echo",
    "flow",
    "drift",
    "pixel",
    "wave",
  ];
  const num = Math.floor(10 + Math.random() * 90);
  const a = adjs[Math.floor(Math.random() * adjs.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  return `${a}-${n}-${num}`;
}

export function parseRoomInput(raw: string): string {
  let cleaned = raw.trim();
  if (!cleaned) return "";

  // Parse if full URL or contains domain/slashes
  if (cleaned.includes("://") || cleaned.includes("/")) {
    try {
      const urlToParse = cleaned.includes("://") ? cleaned : `https://${cleaned}`;
      const parsed = new URL(urlToParse);
      const queryCode =
        parsed.searchParams.get("code") ||
        parsed.searchParams.get("room") ||
        parsed.searchParams.get("r");
      if (queryCode) {
        cleaned = queryCode;
      } else {
        const segments = parsed.pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
          cleaned = segments[segments.length - 1];
        }
      }
    } catch {
      const segments = cleaned.split("/").filter(Boolean);
      cleaned = segments[segments.length - 1] || cleaned;
    }
  }

  // Strip leading '#' or '@'
  cleaned = cleaned.replace(/^[#@]+/, "");
  // Strip query strings or fragment anchors if leftover
  cleaned = cleaned.split("?")[0].split("#")[0].trim().toLowerCase();
  return cleaned;
}

export const HomePage: React.FC<HomePageProps> = ({
  onJoinRoom,
  currentUser,
  onUpdateUser,
}) => {
  const [roomInput, setRoomInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState<"appearance" | "profile" | "background">("appearance");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loopin_recent_rooms");
      if (stored) {
        setRecentRooms(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const saveAndJoin = (roomId: string) => {
    try {
      const existing = recentRooms.filter((r) => r.id !== roomId);
      const updated = [
        { id: roomId, name: roomId, visitedAt: Date.now() },
        ...existing,
      ].slice(0, 5);
      localStorage.setItem("loopin_recent_rooms", JSON.stringify(updated));
    } catch {}
    onJoinRoom(roomId);
  };

  const clearRecents = () => {
    localStorage.removeItem("loopin_recent_rooms");
    setRecentRooms([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const raw = roomInput.trim();
    // If empty: Create brand new lobby with random slug
    if (!raw) {
      const randomRoom = generateRoomSlug();
      saveAndJoin(randomRoom);
      return;
    }

    const parsed = parseRoomInput(raw);
    if (!parsed) {
      setInputError("Please enter a valid chat code or link.");
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(parsed)) {
      setInputError("Chat code can only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    if (parsed.length < 2) {
      setInputError("Chat code must be at least 2 characters long.");
      return;
    }

    if (parsed.length > 64) {
      setInputError("Chat code cannot exceed 64 characters.");
      return;
    }

    saveAndJoin(parsed);
  };

  const hasEnteredCode = Boolean(roomInput.trim());

  return (
    <div className="home-container">
      {/* Background canvas */}
      <ChatBackground />

      {/* Top Bar for Settings */}
      <header className="home-top-bar">
        <button
          type="button"
          className="header-icon-btn"
          onClick={() => {
            setSettingsCategory("appearance");
            setIsSettingsOpen(true);
          }}
          title="Open Settings"
          aria-label="Open Settings"
        >
          <Settings size={18} />
        </button>
      </header>

      <main className="home-content">
        {/* Brand Hero (Logo centered with quiet tagline) */}
        <div className="home-hero">
          <div className="home-logo-wrap">
            <LoopinLogo size={56} className="home-logo-bare" />
          </div>
          <h1 className="home-title">
            Loop<span className="text-accent">in</span>
          </h1>
          <p className="home-tagline">
            Simple, fast, private ephemeral chats.
          </p>
        </div>

        {/* Action Card */}
        <div className="home-card">
          {/* User profile bar */}
          <div
            className="home-profile-bar"
            onClick={() => {
              setSettingsCategory("profile");
              setIsSettingsOpen(true);
            }}
            role="button"
            tabIndex={0}
            title="Edit your display name & color"
          >
            <span
              className="user-color-dot"
              style={{ backgroundColor: currentUser.color || "var(--primary-accent)" }}
            />
            <div className="home-user-details">
              <span className="home-user-label">Chatting as</span>
              <span className="home-user-name" style={{ color: currentUser.color || "inherit" }}>
                {currentUser.name}
              </span>
            </div>
            <span className="home-user-edit-link">Edit</span>
          </div>

          {/* Unified Action Form */}
          <form onSubmit={handleSubmit} className="join-chat-box">
            <div className="join-box-label-row">
              <label htmlFor="home-room-input" className="join-box-label">
                Room code or link
              </label>
              <span className="join-box-label-hint">optional</span>
            </div>

            <div className="room-input-wrap">
              <span className="room-input-prefix">
                <Hash size={15} />
              </span>
              <input
                id="home-room-input"
                name="room_search_code"
                type="search"
                value={roomInput}
                onChange={(e) => {
                  setRoomInput(e.target.value);
                  if (inputError) setInputError(null);
                }}
                maxLength={64}
                placeholder="e.g. swift-fox-42 (leave empty for new lobby)"
                className={`text-input home-room-input ${inputError ? "input-has-error" : ""}`}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-1p-ignore="true"
                data-lpignore="true"
                data-form-type="other"
                autoFocus
              />
            </div>

            {inputError && (
              <div className="home-inline-error" role="alert">
                <AlertCircle size={14} className="error-icon" />
                <span>{inputError}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary full-width-btn submit-action-btn"
            >
              <span>{hasEnteredCode ? "Join chat" : "Create new lobby"}</span>
              <ArrowRight size={16} className="btn-arrow" />
            </button>
          </form>

          {/* Recent Rooms */}
          {recentRooms.length > 0 && (
            <div className="recent-rooms-section">
              <div className="recent-rooms-header">
                <span className="recent-title">
                  <Clock size={12} /> Recent Rooms
                </span>
                <button
                  type="button"
                  className="clear-recents-btn"
                  onClick={clearRecents}
                  title="Clear history"
                >
                  <Trash2 size={12} /> Clear
                </button>
              </div>
              <div className="recent-rooms-list">
                {recentRooms.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="recent-room-pill"
                    onClick={() => saveAndJoin(r.id)}
                  >
                    <span className="recent-room-hash">#</span>
                    <span className="recent-room-id">{r.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialCategory={settingsCategory}
        currentUser={currentUser}
        onUpdateUser={onUpdateUser}
      />
    </div>
  );
};
