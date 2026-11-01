import React, { useState, useEffect, useMemo } from "react";
import { Users, X, Pin, PinOff, ShieldCheck, UserX } from "lucide-react";
import type { User } from "../../server/types";

interface UsersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: string;
  typingUsers: { id: string; name: string }[];
  isPinned: boolean;
  onTogglePin: () => void;
  ownerId?: string | null;
  isOwner?: boolean;
  onKickUser?: (userId: string) => void;
}

function formatRelativeActivity(timestamp?: number): string {
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
  ownerId,
  isOwner,
  onKickUser,
}) => {
  // Relative time ticker
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  // Deduplicate members strictly: If an account is currently online, never show an offline ghost of the same user
  const uniqueMembers = useMemo(() => {
    const onlineMap = new Map<string, User>();
    const offlineMap = new Map<string, User>();

    for (const u of users) {
      if (!u || !u.name) continue;
      const key = u.name.trim().toLowerCase();
      if (u.isOnline !== false) {
        onlineMap.set(key, u);
      } else {
        const existing = offlineMap.get(key);
        if (!existing || (u.lastActiveAt || 0) > (existing.lastActiveAt || 0)) {
          offlineMap.set(key, u);
        }
      }
    }

    // Filter out any offline records that match an active online user name
    for (const onlineKey of onlineMap.keys()) {
      offlineMap.delete(onlineKey);
    }

    return [...onlineMap.values(), ...offlineMap.values()];
  }, [users]);

  const onlineMembers = uniqueMembers.filter((u) => u.isOnline !== false);
  const offlineMembers = uniqueMembers.filter((u) => u.isOnline === false);

  if (!isOpen && !isPinned) return null;

  return (
    <>
      {!isPinned && (
        <div
          className="users-sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`users-sidebar ${isPinned ? "is-pinned" : "is-overlay"}`}
        aria-label="Room members"
      >
        {/* Sidebar Header */}
        <div className="users-sidebar-header">
          <div className="sidebar-heading-left">
            <Users size={15} className="text-secondary" />
            <span className="sidebar-heading-text">Members</span>
            <span className="sidebar-count-label">
              {onlineMembers.length}
            </span>
          </div>

          <div className="sidebar-heading-tools">
            <button
              type="button"
              className={`sidebar-tool-btn sidebar-pin-btn ${isPinned ? "active" : ""}`}
              onClick={onTogglePin}
              title={isPinned ? "Unpin sidebar" : "Pin sidebar to right"}
              aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar to right"}
            >
              {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
            </button>

            {!isPinned && (
              <button
                type="button"
                className="sidebar-tool-btn"
                onClick={onClose}
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

      {/* Member List Scroll Area */}
      <div className="users-sidebar-scroll-area">
        {/* ONLINE */}
        {onlineMembers.length > 0 && (
          <div className="members-section">
            <span className="members-section-label">Online — {onlineMembers.length}</span>
            <div className="members-stack">
              {onlineMembers.map((u) => {
                const isMe = u.id === currentUserId;
                const isHost = u.id === ownerId || Boolean(u.isOwner);
                const isTyping = typingUsers.some((t) => t.id === u.id);
                const isFocused = u.isFocused !== false;

                return (
                  <div key={u.id} className="member-row">
                    <span
                      className={`member-presence-dot ${isFocused ? "dot-online-focused" : "dot-online-idle"}`}
                      title={isFocused ? "Active now" : "Unfocused / background"}
                    />

                    <div className="member-details-col">
                      <div className="member-name-row">
                        <span
                          className="member-name-text"
                          style={{ color: u.color || "var(--text-primary)" }}
                        >
                          {u.name}
                        </span>
                        {isHost && (
                          <span className="member-host-badge" title="Room Host / Creator">
                            👑 Host
                          </span>
                        )}
                        {isMe && <span className="member-you-marker">(you)</span>}
                      </div>

                      <span className="member-status-subtext">
                        {isTyping ? (
                          <span className="status-typing">typing...</span>
                        ) : isFocused ? (
                          "active now"
                        ) : (
                          `last active ${formatRelativeActivity(u.lastActiveAt)}`
                        )}
                      </span>
                    </div>

                    {isOwner && !isMe && onKickUser && (
                      <button
                        type="button"
                        className="member-kick-btn"
                        onClick={() => onKickUser(u.id)}
                        title={`Remove ${u.name} from room`}
                        aria-label={`Remove ${u.name} from room`}
                      >
                        <UserX size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* OFFLINE */}
        {offlineMembers.length > 0 && (
          <div className="members-section">
            <span className="members-section-label">Offline — {offlineMembers.length}</span>
            <div className="members-stack">
              {offlineMembers.map((u) => {
                const isMe = u.id === currentUserId;

                return (
                  <div key={u.id} className="member-row is-offline">
                    <span className="member-presence-dot dot-offline" title="Offline" />

                    <div className="member-details-col">
                      <div className="member-name-row">
                        <span
                          className="member-name-text"
                          style={{ color: u.color || "var(--text-primary)" }}
                        >
                          {u.name}
                        </span>
                        {isMe && <span className="member-you-marker">(you)</span>}
                      </div>

                      <span className="member-status-subtext">
                        offline · {formatRelativeActivity(u.lastActiveAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  </>
  );
};
