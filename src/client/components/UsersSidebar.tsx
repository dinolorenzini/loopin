import React from "react";
import { Users, X, ShieldAlert, Sparkles } from "lucide-react";
import type { User } from "../../server/types";

interface UsersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: string;
  typingUsers: { id: string; name: string }[];
  onOpenProfile: () => void;
}

export const UsersSidebar: React.FC<UsersSidebarProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  typingUsers,
  onOpenProfile,
}) => {
  return (
    <aside className={`users-sidebar ${isOpen ? "open" : ""}`} aria-label="Online Participants">
      <div className="users-sidebar-header">
        <div className="sidebar-title-row">
          <Users size={16} className="text-accent" />
          <span className="sidebar-title">Online Members</span>
          <span className="users-count-pill">{users.length}</span>
        </div>
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close members drawer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="users-list-scroll">
        <div className="users-list">
          {users.map((u) => {
            const isMe = u.id === currentUserId;
            const isTyping = typingUsers.some((t) => t.id === u.id);

            return (
              <div key={u.id} className={`user-card ${isMe ? "user-card-me" : ""}`}>
                <div
                  className="user-avatar-badge"
                  style={{ backgroundColor: u.color }}
                >
                  <span>{u.avatar || "⚡"}</span>
                  <span className="user-online-dot" />
                </div>
                <div className="user-info">
                  <div className="user-name-row">
                    <span className="user-name-text">{u.name}</span>
                    {isMe && <span className="you-tag">YOU</span>}
                  </div>
                  {isTyping ? (
                    <span className="user-status-text typing-text">typing...</span>
                  ) : (
                    <span className="user-status-text">active now</span>
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
          <Sparkles size={14} /> Customize My Profile
        </button>

        <div className="privacy-badge">
          <ShieldAlert size={14} className="privacy-badge-icon" />
          <p className="privacy-badge-text">
            <strong>Zero Persistence:</strong> All messages in this room vanish as soon as everyone leaves.
          </p>
        </div>
      </div>
    </aside>
  );
};
