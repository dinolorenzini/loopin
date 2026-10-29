import React, { useState, useEffect } from "react";
import { Users, X, Pin, PinOff, UserCheck, Edit3 } from "lucide-react";
import type { User } from "../../server/types";

interface UsersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: string;
  typingUsers: { id: string; name: string }[];
  isPinned: boolean;
  onTogglePin: () => void;
  onOpenProfile: () => void;
}

function formatLastActive(timestamp?: number): string {
  if (!timestamp) return "just now";
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 15) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return "yesterday";
}

export const UsersSidebar: React.FC<UsersSidebarProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  typingUsers,
  isPinned,
  onTogglePin,
  onOpenProfile,
}) => {
  // Live ticker to update relative "last active X ago" (Item 10)
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside
      className={`users-sidebar ${isOpen ? "open" : ""} ${isPinned ? "pinned" : ""}`}
      aria-label="Online Participants"
    >
      <div className="users-sidebar-header">
        <div className="sidebar-title-row">
          <Users size={16} className="text-accent" />
          <span className="sidebar-title">Online Members</span>
          <span className="users-count-pill">{users.length}</span>
        </div>

        <div className="sidebar-header-actions">
          {/* Pin Sidebar Button (Item 9) */}
          <button
            type="button"
            className={`sidebar-tool-btn ${isPinned ? "active" : ""}`}
            onClick={onTogglePin}
            title={isPinned ? "Unpin sidebar" : "Pin sidebar to right"}
          >
            {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
          </button>

          {!isPinned && (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Close members drawer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="users-list-scroll">
        <div className="users-list">
          {users.map((u) => {
            const isMe = u.id === currentUserId;
            const isTyping = typingUsers.some((t) => t.id === u.id);
            const isFocused = u.isFocused !== false;

            return (
              <div key={u.id} className={`user-card ${isMe ? "user-card-me" : ""}`}>
                {/* Status Dot: Green if active/focused, Yellow if unfocused (Item 10) */}
                <div className="user-status-indicator-wrap">
                  <span
                    className={`user-dot ${isFocused ? "dot-active" : "dot-inactive"}`}
                    title={isFocused ? "Focused & active" : "Unfocused / in background"}
                  />
                </div>

                <div className="user-info">
                  <div className="user-name-row">
                    <span
                      className="user-name-text"
                      style={{ color: u.color || "var(--text-primary)" }}
                    >
                      {u.name}
                    </span>
                    {isMe && <span className="you-tag">YOU</span>}
                  </div>

                  {/* Status label: "typing...", "active now", or "last active X ago" (Item 10) */}
                  {isTyping ? (
                    <span className="user-status-text typing-text">typing...</span>
                  ) : isFocused ? (
                    <span className="user-status-text status-active">active now</span>
                  ) : (
                    <span className="user-status-text status-idle">
                      last active {formatLastActive(u.lastActiveAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className="btn btn-secondary edit-profile-quick-btn"
          onClick={onOpenProfile}
        >
          <Edit3 size={14} /> Change Name & Color
        </button>
      </div>
    </aside>
  );
};
