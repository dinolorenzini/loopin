import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Clock,
  Trash2,
  Lock,
  User as UserIcon,
} from "lucide-react";
import type { User } from "../../server/types";

interface HomePageProps {
  onJoinRoom: (room: string) => void;
  currentUser: User;
  onUpdateUser: (updates: Partial<Pick<User, "name" | "color" | "avatar">>) => void;
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
  onUpdateUser,
  onOpenProfile,
}) => {
  const [roomInput, setRoomInput] = useState("");
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loopin_recent_rooms");
      if (stored) {
        setRecentRooms(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
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
    } catch {
      // Ignore
    }
    onJoinRoom(roomId);
  };

  const clearRecents = () => {
    localStorage.removeItem("loopin_recent_rooms");
    setRecentRooms([]);
  };

  return (
    <div className="home-container">
      {/* Background ambient lighting */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      <main className="home-content">
        {/* Brand Hero */}
        <div className="home-hero">
          <div className="home-logo-wrap">
            <img src="/favicon.svg" alt="Loopin Logo" className="home-logo" />
            <div className="logo-sparkle">
              <Sparkles size={14} color="#38bdf8" />
            </div>
          </div>
          <h1 className="home-title">
            Loop<span className="text-gradient">in</span>
          </h1>
          <p className="home-tagline">
            Instant, ephemeral chat rooms on Cloudflare Workers.
            <br />
            Zero-data logging. All messages vanish when everyone leaves.
          </p>
        </div>

        {/* Action Card */}
        <div className="home-card">
          {/* User profile bar */}
          <div className="home-profile-bar" onClick={onOpenProfile}>
            <div
              className="home-user-avatar"
              style={{ backgroundColor: currentUser.color }}
            >
              <span>{currentUser.avatar || "⚡"}</span>
            </div>
            <div className="home-user-details">
              <span className="home-user-label">Chatting as</span>
              <span className="home-user-name">{currentUser.name}</span>
            </div>
            <span className="home-user-edit-link">Change</span>
          </div>

          {/* Quick Instant Spin-up */}
          <button
            type="button"
            className="btn btn-primary full-width-btn instant-spin-btn"
            onClick={handleCreateInstant}
          >
            <Zap size={18} />
            <span>Spin Up Instant Room</span>
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

        {/* Feature Highlights */}
        <div className="home-features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <Shield size={18} color="#34d399" />
            </div>
            <h3 className="feature-heading">Zero-Data Logging</h3>
            <p className="feature-desc">
              No databases, no tracking cookies, no server persistence. Your privacy is mathematically protected.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Lock size={18} color="#38bdf8" />
            </div>
            <h3 className="feature-heading">Auto-Wipe on Disconnect</h3>
            <p className="feature-desc">
              When all users leave a room, Cloudflare Durable Objects immediately cleans and purges every message.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Zap size={18} color="#c084fc" />
            </div>
            <h3 className="feature-heading">Rich Media & Alerts</h3>
            <p className="feature-desc">
              Base64 image uploads, instant GIFs, native emoji reactions, Web Notifications, and live title counts.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="home-footer">
          <span>Powered 100% by Cloudflare Workers & Durable Objects</span>
        </footer>
      </main>
    </div>
  );
};
