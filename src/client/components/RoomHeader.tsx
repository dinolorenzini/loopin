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
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { User } from "../../server/types";

interface RoomHeaderProps {
  roomId: string;
  onlineCount: number;
  currentUser: User;
  onLeaveRoom: () => void;
  onOpenShare: () => void;
  onOpenProfile: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
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
  onToggleSidebar,
  isSidebarOpen,
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
    } catch {
      // Ignore
    }
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
          <img src="/favicon.svg" alt="Loopin" className="brand-logo-img" />
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

      {/* Center: Ephemeral status */}
      <div className="header-center">
        <div className="ephemeral-indicator" title="All messages delete when everyone disconnects">
          <ShieldCheck size={13} className="text-emerald" />
          <span>Zero-Data Ephemeral</span>
        </div>
      </div>

      {/* Right: Controls & actions */}
      <div className="header-right">
        {/* Audio chime toggle */}
        <button
          type="button"
          className={`header-icon-btn ${soundMuted ? "muted" : "active"}`}
          onClick={onToggleSound}
          title={soundMuted ? "Unmute message chime" : "Mute message chime"}
        >
          {soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Browser notification opt-in toggle */}
        <button
          type="button"
          className={`header-icon-btn ${notificationPermission === "granted" ? "active" : ""}`}
          onClick={onRequestNotifications}
          title={
            notificationPermission === "granted"
              ? "Browser notifications active"
              : notificationPermission === "denied"
              ? "Notifications blocked by browser"
              : "Enable browser notifications"
          }
        >
          {notificationPermission === "granted" ? <Bell size={16} /> : <BellOff size={16} />}
        </button>

        {/* Share & QR Code */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={onOpenShare}
          title="Share room & QR code"
        >
          <Share2 size={16} />
        </button>

        {/* Online Members sidebar button */}
        <button
          type="button"
          className={`header-pill-btn ${isSidebarOpen ? "selected" : ""}`}
          onClick={onToggleSidebar}
          title="View online members"
        >
          <span className="live-dot" />
          <Users size={15} />
          <span className="online-num">{onlineCount}</span>
        </button>

        {/* User profile avatar / edit */}
        <button
          type="button"
          className="user-profile-badge-btn"
          onClick={onOpenProfile}
          title="Customize my name & avatar"
        >
          <div
            className="user-header-avatar"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.avatar || "⚡"}
          </div>
          <span className="user-header-name">{currentUser.name}</span>
        </button>

        {/* Leave room */}
        <button
          type="button"
          className="header-icon-btn leave-btn"
          onClick={onLeaveRoom}
          title="Leave room"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
