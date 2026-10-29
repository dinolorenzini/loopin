import React, { useState } from "react";
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Share2,
  Users,
  Copy,
  Check,
  LogOut,
  Settings,
  Pin,
} from "lucide-react";
import type { User } from "../../server/types";
import { LoopinLogo } from "./LoopinLogo";

interface RoomHeaderProps {
  roomId: string;
  onlineCount: number;
  currentUser: User;
  onLeaveRoom: () => void;
  onOpenShare: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isSidebarPinned: boolean;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomId,
  onlineCount,
  currentUser,
  onLeaveRoom,
  onOpenShare,
  onOpenProfile,
  onOpenSettings,
  onToggleSidebar,
  isSidebarOpen,
  isSidebarPinned,
  notificationPermission,
  onRequestNotifications,
  soundMuted,
  onToggleSound,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <header className="room-header">
      {/* Left: Brand + Room pill */}
      <div className="header-left">
        <button
          type="button"
          className="brand-logo-btn"
          onClick={onLeaveRoom}
          title="Back to Loopin Home"
        >
          {/* Item 5: Logo live updates with theme color */}
          <LoopinLogo size={26} />
          <span className="brand-name">Loopin</span>
        </button>

        <div className="room-badge-group">
          <button
            type="button"
            className="room-id-pill"
            onClick={handleCopyRoomLink}
            title="Click to copy room link"
          >
            <span className="room-hash">#</span>
            <span className="room-name-text">{roomId}</span>
            {copied ? (
              <Check size={12} className="text-emerald" />
            ) : (
              <Copy size={12} className="room-copy-icon" />
            )}
          </button>
        </div>
      </div>

      {/* Right: Controls & actions (Item 7: responsive without overlapping at 436px) */}
      <div className="header-right">
        {/* Secondary controls hidden on ultra-small screens to prevent overlap */}
        <div className="header-secondary-tools">
          <button
            type="button"
            className={`header-icon-btn ${soundMuted ? "muted" : "active"}`}
            onClick={onToggleSound}
            title={soundMuted ? "Unmute chime" : "Mute chime"}
          >
            {soundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button
            type="button"
            className={`header-icon-btn ${notificationPermission === "granted" ? "active" : ""}`}
            onClick={onRequestNotifications}
            title="Notifications"
          >
            {notificationPermission === "granted" ? <Bell size={15} /> : <BellOff size={15} />}
          </button>
        </div>

        {/* Share & QR Code */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={onOpenShare}
          title="Share room"
        >
          <Share2 size={15} />
        </button>

        {/* Settings modal button */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={onOpenSettings}
          title="Settings"
        >
          <Settings size={15} />
        </button>

        {/* Online Members sidebar button */}
        <button
          type="button"
          className={`header-pill-btn ${isSidebarOpen || isSidebarPinned ? "selected" : ""}`}
          onClick={onToggleSidebar}
          title={isSidebarPinned ? "Members pinned" : "Online members"}
        >
          <span className="live-dot" />
          <Users size={14} />
          <span className="online-num">{onlineCount}</span>
          {isSidebarPinned && <Pin size={10} className="pinned-badge-icon" />}
        </button>

        {/* User profile button (Item 8: Entire username displayed without truncation) */}
        <button
          type="button"
          className="user-profile-badge-btn"
          onClick={onOpenProfile}
          title="Change display name & color"
        >
          <span
            className="user-color-dot"
            style={{ backgroundColor: currentUser.color || "var(--primary-accent)" }}
          />
          <span className="user-header-name">{currentUser.name}</span>
        </button>

        {/* Leave room */}
        <button
          type="button"
          className="header-icon-btn leave-btn"
          onClick={onLeaveRoom}
          title="Leave room"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
};
