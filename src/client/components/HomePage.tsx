import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Zap,
  Clock,
  Trash2,
  Settings,
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
  const adjs = ["swift", "cosmic", "neon", "lunar", "hyper", "silent", "ember", "sonic", "alpha", "zenith"];
  const nouns = ["fox", "pulse", "orbit", "spark", "forge", "haven", "nexus", "echo", "flow", "drift"];
  const num = Math.floor(10 + Math.random() * 90);
  const a = adjs[Math.floor(Math.random() * adjs.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  return `${a}-${n}-${num}`;
}

export const HomePage: React.FC<HomePageProps> = ({
  onJoinRoom,
  currentUser,
  onOpenProfile,
}) => {
  const [roomInput, setRoomInput] = useState("");
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { settings } = useSettings();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loopin_recent_rooms");
      if (stored) {
        setRecentRooms(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleCreateInstant = () => {
    const slug = generateRoomSlug();
    saveAndJoin(slug);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (clean) {
      saveAndJoin(clean);
    }
  };

  const saveAndJoin = (roomId: string) => {
    try {
      const existing = recentRooms.filter((r) => r.id !== roomId);
      const updated = [{ id: roomId, name: roomId, visitedAt: Date.now() }, ...existing].slice(0, 5);
      localStorage.setItem("loopin_recent_rooms", JSON.stringify(updated));
    } catch {}
    onJoinRoom(roomId);
  };

  const clearRecents = () => {
    localStorage.removeItem("loopin_recent_rooms");
    setRecentRooms([]);
  };

  return (
    <div className="home-container">
      {/* Background canvas live updating from Settings Context */}
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
        {/* Brand Hero (Logo color updates with theme) */}
        <div className="home-hero">
          <LoopinLogo size={60} className="home-logo-bare" glow={true} />
          <h1 className="home-title">
            Loop<span className="text-accent">in</span>
          </h1>
          <p className="home-tagline">
            Simple, fast, private chat rooms for you and your friends.
            <br />
            Create a room, share the link, and jump right in.
          </p>
        </div>

        {/* Action Card */}
        <div className="home-card">
          {/* User profile bar (Item 3: no avatar emoji, colored name) */}
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

          {/* Quick Instant Spin-up */}
          <button
            type="button"
            className="btn btn-primary full-width-btn instant-spin-btn"
            onClick={handleCreateInstant}
          >
            <Zap size={18} />
            <span>Create New Room</span>
            <ArrowRight size={16} className="btn-arrow" />
          </button>

          <div className="home-divider">
            <span>or join existing</span>
          </div>

          {/* Join existing room form */}
          <form onSubmit={handleJoinSubmit} className="join-room-form">
            <div className="room-input-wrap">
              <span className="room-input-prefix">#</span>
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="room-name"
                className="text-input home-room-input"
              />
            </div>
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={!roomInput.trim()}
            >
              Join
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
