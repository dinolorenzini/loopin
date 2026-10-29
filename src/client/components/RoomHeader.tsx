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
      {/* Left: Brand + Room pill (Item 18: responsive layout fix for <845px) */}
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

        {/* Browser notification toggle */}
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

        {/* Settings modal button (Item 14) */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={onOpenSettings}
          title="Settings (Themes, Background, Messages)"
        >
          <Settings size={16} />
        </button>

        {/* Online Members sidebar button */}
        <button
          type="button"
          className={`header-pill-btn ${isSidebarOpen || isSidebarPinned ? "selected" : ""}`}
          onClick={onToggleSidebar}
          title={isSidebarPinned ? "Members pinned" : "View online members"}
        >
          <span className="live-dot" />
          <Users size={15} />
          <span className="online-num">{onlineCount}</span>
          {isSidebarPinned && <Pin size={10} className="pinned-badge-icon" />}
        </button>

        {/* User profile button (Item 3: no profile picture, username with color) */}
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
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
