import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  Copy,
  Check,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  LogOut,
  AlertTriangle,
  Share2,
} from "lucide-react";
import type { User } from "../../server/types";
import { LoopinLogo } from "./LoopinLogo";

interface RoomHeaderProps {
  roomId: string;
  onlineCount: number;
  currentUser: User;
  onLeaveRoom: () => void;
  onOpenSettings: (category?: "profile" | "appearance" | "sound") => void;
  onOpenShare?: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isSidebarPinned: boolean;
  soundMuted: boolean;
  onToggleSound: () => void;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomId,
  onlineCount,
  currentUser,
  onLeaveRoom,
  onOpenSettings,
  onOpenShare,
  onToggleSidebar,
  isSidebarOpen,
  isSidebarPinned,
  soundMuted,
  onToggleSound,
  notificationPermission,
  onRequestNotifications,
}) => {
  const [copied, setCopied] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const overflowMenuRef = useRef<HTMLDivElement>(null);
  const userChipRef = useRef<HTMLButtonElement>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Close overflow menu on click outside
  useEffect(() => {
    if (!isOverflowOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setIsOverflowOpen(false);
        setShowLeaveConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOverflowOpen]);

  return (
    <header className="room-header">
      {/* 1. Left: Logo + Room Name Chip */}
      <div className="header-left-col">
        <button
          type="button"
          className="brand-logo-btn"
          onClick={() => {
            if (window.confirm("Leave room and return to Loopin home?")) {
              onLeaveRoom();
            }
          }}
          title="Loopin home"
          aria-label="Loopin home"
        >
          <LoopinLogo size={24} />
          <span className="brand-logo-name">Loopin</span>
        </button>

        <div className="room-name-chip-group">
          <button
            type="button"
            className="room-name-chip"
            onClick={handleCopyLink}
            title={copied ? "Link copied!" : "Copy room link"}
            aria-label={`Room ${roomId}. Click to copy link.`}
          >
            <span className="room-hash-symbol">#</span>
            <span className="room-title-text">{roomId}</span>
            {copied ? (
              <Check size={13} className="text-accent" />
            ) : (
              <Copy size={13} className="chip-copy-icon" />
            )}
          </button>
          {onOpenShare && (
            <button
              type="button"
              className="room-share-mini-btn"
              onClick={onOpenShare}
              title="Show QR code & share"
              aria-label="Show QR code and share options"
            >
              <Share2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Right: Member count + User chip + Overflow menu */}
      <div className="header-right-col">
        {/* Member count button (toggles sidebar) */}
        <button
          type="button"
          className={`header-members-btn ${isSidebarOpen || isSidebarPinned ? "active" : ""}`}
          onClick={onToggleSidebar}
          title={isSidebarPinned ? "Members sidebar (pinned)" : "Toggle online members"}
          aria-label={`Online members: ${onlineCount}. Toggle sidebar.`}
        >
          <Users size={16} />
          <span className="members-count-num">{onlineCount}</span>
        </button>

        {/* User profile chip (opens Settings on Profile tab) */}
        <button
          ref={userChipRef}
          type="button"
          className="header-user-chip"
          onClick={() => onOpenSettings("profile")}
          title="Edit display name & color"
          aria-label={`Current user: ${currentUser.name}. Click to edit in Settings.`}
        >
          <span
            className="user-chip-color-dot"
            style={{ backgroundColor: currentUser.color || "var(--primary-accent)" }}
          />
          <span className="user-chip-name">{currentUser.name}</span>
        </button>

        {/* Single Overflow Menu (⋯) */}
        <div className="header-overflow-wrap" ref={overflowMenuRef}>
          <button
            type="button"
            className={`header-icon-action-btn ${isOverflowOpen ? "active" : ""}`}
            onClick={() => {
              setIsOverflowOpen(!isOverflowOpen);
              setShowLeaveConfirm(false);
            }}
            title="More room options"
            aria-label="More room options"
            aria-expanded={isOverflowOpen}
          >
            <MoreHorizontal size={18} />
          </button>

          {isOverflowOpen && (
            <div className="overflow-dropdown-panel" role="menu">
              {/* Sound Toggle */}
              <button
                type="button"
                className="overflow-menu-row"
                onClick={() => {
                  onToggleSound();
                }}
                role="menuitem"
              >
                {soundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{soundMuted ? "Unmute chime" : "Mute chime"}</span>
              </button>

              {/* Notifications Toggle */}
              <button
                type="button"
                className="overflow-menu-row"
                onClick={() => {
                  onRequestNotifications();
                }}
                role="menuitem"
              >
                {notificationPermission === "granted" ? <Bell size={15} /> : <BellOff size={15} />}
                <span>
                  {notificationPermission === "granted" ? "Notifications enabled" : "Enable notifications"}
                </span>
              </button>

              <div className="overflow-divider" />

              {/* Leave Room with Confirm */}
              {showLeaveConfirm ? (
                <div className="overflow-confirm-box">
                  <span className="confirm-prompt-text">Leave #{roomId}?</span>
                  <div className="confirm-actions-row">
                    <button
                      type="button"
                      className="confirm-btn-cancel"
                      onClick={() => setShowLeaveConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="confirm-btn-leave"
                      onClick={() => {
                        setIsOverflowOpen(false);
                        onLeaveRoom();
                      }}
                    >
                      Leave
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="overflow-menu-row danger-row"
                  onClick={() => setShowLeaveConfirm(true)}
                  role="menuitem"
                >
                  <LogOut size={15} />
                  <span>Leave room</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
