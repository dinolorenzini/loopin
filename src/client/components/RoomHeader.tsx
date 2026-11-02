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
  Settings,
  Maximize2,
  Minimize2,
  ShieldCheck,
  GraduationCap,
  Lock,
  Unlock,
  UserCheck,
  Crown,
} from "lucide-react";
import type { User } from "../../server/types";
import { useSettings } from "../hooks/useSettings";
import { LoopinLogo } from "./LoopinLogo";
import { isCoppaChildMode } from "../hooks/useUser";

interface RoomHeaderProps {
  roomId: string;
  onlineCount: number;
  currentUser: User;
  onLeaveRoom: () => void;
  onOpenSettings: (category?: "profile" | "appearance" | "sound" | "chat" | "background") => void;
  onOpenShare?: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isSidebarPinned: boolean;
  soundMuted: boolean;
  onToggleSound: () => void;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => void;
  isOwner?: boolean;
  isRoomLocked?: boolean;
  onToggleRoomLock?: () => void;
  pendingRequestsCount?: number;
  onOpenKnockRequests?: () => void;
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
  isOwner = false,
  isRoomLocked = false,
  onToggleRoomLock,
  pendingRequestsCount = 0,
  onOpenKnockRequests,
}) => {
  const { settings, updateSetting } = useSettings();
  const [copied, setCopied] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [showNativeLeaveModal, setShowNativeLeaveModal] = useState(false);
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
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOverflowOpen]);

  return (
    <>
      <header className="room-header">
        {/* 1. Left: Logo + Room Name Chip */}
        <div className="header-left-col">
          <button
            type="button"
            className="brand-logo-btn"
            onClick={() => setShowNativeLeaveModal(true)}
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

            {isCoppaChildMode() && (
              <span className="compliance-header-tag tag-coppa" title="Under-13 Child-Safe Mode Active (COPPA Compliant)">
                <ShieldCheck size={12} />
                <span>Child Safe</span>
              </span>
            )}
            {settings.ferpaMode && (
              <span className="compliance-header-tag tag-ferpa" title="Classroom Privacy Mode (FERPA 34 CFR § 99.31)">
                <GraduationCap size={12} />
                <span>FERPA Edu</span>
              </span>
            )}

            {isOwner && (
              <span className="compliance-header-tag tag-owner" title="You are the host/moderator of this room">
                <Crown size={12} />
                <span>Host</span>
              </span>
            )}

            {isOwner && onToggleRoomLock && (
              <button
                type="button"
                className={`header-lock-toggle-btn ${isRoomLocked ? "is-locked" : ""}`}
                onClick={onToggleRoomLock}
                title={isRoomLocked ? "Room is locked. Click to allow direct joins." : "Room is open. Click to require permission to join."}
                aria-label={isRoomLocked ? "Unlock room" : "Lock room"}
              >
                {isRoomLocked ? <Lock size={13} /> : <Unlock size={13} />}
                <span>{isRoomLocked ? "Locked" : "Open"}</span>
              </button>
            )}

            {!isOwner && isRoomLocked && (
              <span className="compliance-header-tag tag-locked" title="Room is locked by host">
                <Lock size={12} />
                <span>Locked</span>
              </span>
            )}

            {isOwner && pendingRequestsCount > 0 && onOpenKnockRequests && (
              <button
                type="button"
                className="header-knock-alert-btn"
                onClick={onOpenKnockRequests}
                title={`${pendingRequestsCount} participant(s) waiting to enter`}
              >
                <UserCheck size={13} />
                <span>{pendingRequestsCount} Waiting</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Right: Member count + Chat Width + Settings + User chip + Overflow menu */}
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

          {/* Chat Width Toggle (Full-Screen / Centered) */}
          <button
            type="button"
            className={`header-icon-action-btn header-chat-width-btn ${settings.chatWidth === "full" ? "active" : ""}`}
            onClick={() => updateSetting("chatWidth", settings.chatWidth === "full" ? "contained" : "full")}
            title={settings.chatWidth === "full" ? "Switch to centered chat" : "Switch to full width chat"}
            aria-label="Toggle chat width"
          >
            {settings.chatWidth === "full" ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Dedicated Settings Button */}
          <button
            type="button"
            className="header-icon-action-btn"
            onClick={() => onOpenSettings("appearance")}
            title="Settings"
            aria-label="Open Settings"
          >
            <Settings size={16} />
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

          {/* Overflow Menu (⋯) */}
          <div className="header-overflow-wrap" ref={overflowMenuRef}>
            <button
              type="button"
              className={`header-icon-action-btn ${isOverflowOpen ? "active" : ""}`}
              onClick={() => {
                setIsOverflowOpen(!isOverflowOpen);
              }}
              title="More room options"
              aria-label="More room options"
              aria-expanded={isOverflowOpen}
            >
              <MoreHorizontal size={18} />
            </button>

            {isOverflowOpen && (
              <div className="overflow-dropdown-panel" role="menu">
                {/* Settings Item */}
                <button
                  type="button"
                  className="overflow-menu-row"
                  onClick={() => {
                    setIsOverflowOpen(false);
                    onOpenSettings("appearance");
                  }}
                  role="menuitem"
                >
                  <Settings size={15} />
                  <span>Settings</span>
                </button>

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

                {/* Leave Room Trigger */}
                <button
                  type="button"
                  className="overflow-menu-row danger-row"
                  onClick={() => {
                    setIsOverflowOpen(false);
                    setShowNativeLeaveModal(true);
                  }}
                  role="menuitem"
                >
                  <LogOut size={15} />
                  <span>Leave room</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Native Leave Room Dialog Modal */}
      {showNativeLeaveModal && (
        <div
          className="native-modal-backdrop"
          onClick={() => setShowNativeLeaveModal(false)}
        >
          <div
            className="native-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-dialog-title"
          >
            <div className="native-modal-icon-wrap">
              <AlertTriangle size={20} className="text-warning" />
            </div>
            <h3 id="leave-dialog-title" className="native-modal-title">
              Leave #{roomId}?
            </h3>
            <p className="native-modal-desc">
              Messages in this room are ephemeral and will disappear when everyone leaves.
            </p>
            <div className="native-modal-actions">
              <button
                type="button"
                className="btn-neutral-outline"
                onClick={() => setShowNativeLeaveModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger-solid"
                onClick={() => {
                  setShowNativeLeaveModal(false);
                  onLeaveRoom();
                }}
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
