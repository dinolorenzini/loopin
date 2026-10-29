import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Clock,
  Trash2,
  Settings,
  Link2,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogIn,
} from "lucide-react";
import type { User } from "../../server/types";
import { useSettings } from "../hooks/useSettings";
import { ChatBackground } from "./ChatBackground";
import { SettingsModal } from "./SettingsModal";
import { LoopinLogo } from "./LoopinLogo";

interface HomePageProps {
  onJoinRoom: (room: string) => void;
  currentUser: User;
  onUpdateUser: (updates: Partial<Pick<User, "name" | "color">>) => void;
  onOpenProfile: () => void;
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
  onOpenProfile,
}) => {
  const [mode, setMode] = useState<"join" | "create">("join");

  // Join mode state
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  // Create mode state
  const [createSlug, setCreateSlug] = useState(() => generateRoomSlug());
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"available" | "taken" | null>(null);

  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  // Handle Join Submit
  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    const raw = joinInput.trim();
    if (!raw) {
      setJoinError("Please enter a chat code or link to join.");
      return;
    }

    const parsed = parseRoomInput(raw);
    if (!parsed) {
      setJoinError("Please enter a valid chat code or link.");
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(parsed)) {
      setJoinError("Chat code can only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    if (parsed.length < 2) {
      setJoinError("Chat code must be at least 2 characters long.");
      return;
    }

    if (parsed.length > 64) {
      setJoinError("Chat code cannot exceed 64 characters.");
      return;
    }

    saveAndJoin(parsed);
  };

  // Check custom slug availability
  const checkSlugAvailability = async (slugToCheck: string): Promise<boolean> => {
    try {
      setIsCheckingSlug(true);
      const res = await fetch(`/api/room/${encodeURIComponent(slugToCheck)}/check`);
      if (res.ok) {
        const data = (await res.json()) as { taken?: boolean };
        const taken = Boolean(data.taken);
        setSlugStatus(taken ? "taken" : "available");
        return !taken;
      }
    } catch {
      // In case check endpoint is unreachable, assume available
    } finally {
      setIsCheckingSlug(false);
    }
    setSlugStatus(null);
    return true;
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const clean = createSlug.trim().toLowerCase().replace(/^[#@]+/, "");
    if (!clean) {
      setCreateError("Please enter a room name or generate a random one.");
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(clean)) {
      setCreateError("Room names can only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    if (clean.length < 2) {
      setCreateError("Room name must be at least 2 characters long.");
      return;
    }

    if (clean.length > 64) {
      setCreateError("Room name cannot exceed 64 characters.");
      return;
    }

    // Check if taken
    const isFree = await checkSlugAvailability(clean);
    if (!isFree) {
      setCreateError("This room name is currently taken. Choose another or join it directly.");
      return;
    }

    saveAndJoin(clean);
  };

  const handleRandomizeSlug = () => {
    const fresh = generateRoomSlug();
    setCreateSlug(fresh);
    setCreateError(null);
    setSlugStatus(null);
  };

  return (
    <div className="home-container">
      {/* Background canvas */}
      <ChatBackground />

      {/* Top Bar for Settings */}
      <header className="home-top-bar">
        <button
          type="button"
          className="header-icon-btn"
          onClick={() => setIsSettingsOpen(true)}
          title="Open Settings"
        >
          <Settings size={18} />
        </button>
      </header>

      <main className="home-content">
        {/* Brand Hero (Logo without glow as requested) */}
        <div className="home-hero">
          <LoopinLogo size={60} className="home-logo-bare" />
          <h1 className="home-title">
            Loop<span className="text-accent">in</span>
          </h1>
          <p className="home-tagline">
            Simple, fast, private ephemeral chats.
            <br />
            Join with a code or link, or create a custom room in seconds.
          </p>
        </div>

        {/* Action Card */}
        <div className="home-card">
          {/* User profile bar */}
          <div className="home-profile-bar" onClick={onOpenProfile}>
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

          {/* Mode Switcher Tabs */}
          <div className="home-mode-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "join"}
              className={`home-tab-btn ${mode === "join" ? "active" : ""}`}
              onClick={() => {
                setMode("join");
                setJoinError(null);
              }}
            >
              <LogIn size={15} />
              <span>Join Chat</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "create"}
              className={`home-tab-btn ${mode === "create" ? "active" : ""}`}
              onClick={() => {
                setMode("create");
                setCreateError(null);
              }}
            >
              <Plus size={15} />
              <span>Create New Chat</span>
            </button>
          </div>

          {/* 1. Join Chat Form */}
          {mode === "join" ? (
            <form onSubmit={handleJoinSubmit} className="join-chat-box">
              <label htmlFor="join-chat-input" className="join-box-label">
                Enter a code or link to join a chat
              </label>

              <div className="room-input-wrap">
                <span className="room-input-prefix">
                  <Link2 size={16} />
                </span>
                <input
                  id="join-chat-input"
                  type="text"
                  value={joinInput}
                  onChange={(e) => {
                    setJoinInput(e.target.value);
                    if (joinError) setJoinError(null);
                  }}
                  placeholder="e.g. swift-fox-42 or loopin.chat/my-room"
                  className={`text-input home-room-input ${joinError ? "input-has-error" : ""}`}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {joinError && (
                <div className="home-inline-error" role="alert">
                  <AlertCircle size={14} className="error-icon" />
                  <span>{joinError}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary full-width-btn submit-action-btn"
                disabled={!joinInput.trim()}
              >
                <span>Join Chat</span>
                <ArrowRight size={16} className="btn-arrow" />
              </button>
            </form>
          ) : (
            /* 2. Create New Chat Form with Custom Slug */
            <form onSubmit={handleCreateSubmit} className="create-chat-box">
              <label htmlFor="create-slug-input" className="join-box-label">
                Customize your room code or link
              </label>

              <div className="room-input-wrap">
                <span className="room-input-prefix">#</span>
                <input
                  id="create-slug-input"
                  type="text"
                  value={createSlug}
                  onChange={(e) => {
                    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                    setCreateSlug(cleaned);
                    if (createError) setCreateError(null);
                    setSlugStatus(null);
                  }}
                  placeholder="custom-room-slug"
                  className={`text-input home-room-input ${createError ? "input-has-error" : ""}`}
                  maxLength={64}
                  autoComplete="off"
                  autoFocus
                />
                <button
                  type="button"
                  className="slug-randomize-btn"
                  onClick={handleRandomizeSlug}
                  title="Generate random name"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {isCheckingSlug ? (
                <div className="slug-checking-hint">
                  <Loader2 size={12} className="spinner" />
                  <span>Checking room availability...</span>
                </div>
              ) : slugStatus === "available" && !createError ? (
                <div className="slug-status-available">
                  <CheckCircle2 size={13} className="text-emerald" />
                  <span>Room is ready and available</span>
                </div>
              ) : null}

              {createError && (
                <div className="home-inline-error" role="alert">
                  <AlertCircle size={14} className="error-icon" />
                  <span>{createError}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary full-width-btn submit-action-btn"
                disabled={!createSlug.trim() || isCheckingSlug}
              >
                <span>Create & Join Room</span>
                <ArrowRight size={16} className="btn-arrow" />
              </button>
            </form>
          )}

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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
