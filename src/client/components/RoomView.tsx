import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Users,
  UploadCloud,
  Loader2,
  Share2,
} from "lucide-react";
import { useChatRoom } from "../hooks/useChatRoom";
import { useNotifications } from "../hooks/useNotifications";
import { useSettings } from "../hooks/useSettings";
import { RoomHeader } from "./RoomHeader";
import { MessageItem } from "./MessageItem";
import { ChatInput } from "./ChatInput";
import { UsersSidebar } from "./UsersSidebar";
import { ProfileModal } from "./ProfileModal";
import { SettingsModal } from "./SettingsModal";
import { ShareModal } from "./ShareModal";
import { ImageLightbox } from "./ImageLightbox";
import { ChatBackground } from "./ChatBackground";
import { processImageToBase64 } from "../utils/image";
import type { User, Message } from "../../server/types";

interface RoomViewProps {
  roomId: string;
  currentUser: User;
  onUpdateUser: (updates: Partial<Pick<User, "name" | "color">>) => void;
  onLeaveRoom: () => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  roomId,
  currentUser,
  onUpdateUser,
  onLeaveRoom,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("loopin_sidebar_pinned") === "true";
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const initialScrollDoneRef = useRef<boolean>(false);
  const hasCheckedFirstJoinRef = useRef<boolean>(false);

  const { settings } = useSettings();

  const {
    unreadCount,
    permission,
    soundMuted,
    requestPermission,
    toggleSound,
    onNewMessage,
  } = useNotifications(roomId, currentUser.id);

  const {
    messages,
    users,
    status,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    reactMessage,
    markAsRead,
    sendTyping,
    updateProfile,
  } = useChatRoom({
    roomId,
    currentUser,
    onNewMessage,
  });

  // Auto-show share modal if user is the first person to join the room
  useEffect(() => {
    if (status === "connected" && !hasCheckedFirstJoinRef.current) {
      hasCheckedFirstJoinRef.current = true;
      const otherActive = users.filter((u) => u.isOnline !== false && u.id !== currentUser.id);
      if (otherActive.length === 0) {
        setIsShareOpen(true);
      }
    }
  }, [status, users, currentUser.id]);

  const scrollToMessage = useCallback(
    (targetId: string) => {
      const element = document.getElementById(`msg-${targetId}`);
      if (element) {
        element.scrollIntoView({
          behavior: settings.noAnimations ? "auto" : "smooth",
          block: "center",
        });
        element.classList.remove("message-highlight");
        void element.offsetWidth;
        element.classList.add("message-highlight");
        setTimeout(() => {
          element.classList.remove("message-highlight");
        }, 2000);
      }
    },
    [settings.noAnimations]
  );

  const isTargetAvailable = useCallback(
    (targetId: string) => messages.some((m) => m.id === targetId),
    [messages]
  );

  const handleTogglePin = useCallback(() => {
    setIsSidebarPinned((prev) => {
      const next = !prev;
      localStorage.setItem("loopin_sidebar_pinned", String(next));
      if (next) setIsSidebarOpen(true);
      return next;
    });
  }, []);

  // Mark incoming messages as read
  useEffect(() => {
    if (document.hidden) return;
    const unreadFromOthers = messages
      .filter((m) => m.userId !== currentUser.id && (!m.readBy || !m.readBy.includes(currentUser.id)))
      .map((m) => m.id);

    if (unreadFromOthers.length > 0) {
      markAsRead(unreadFromOthers);
    }
  }, [messages, currentUser.id, markAsRead]);

  // Initial and subsequent scroll handling (Item 17: start chat at bottom, keep DOM at bottom)
  const scrollToBottom = useCallback((instant = false) => {
    if (scrollContainerRef.current) {
      if (instant) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      } else {
        messagesEndRef.current?.scrollIntoView({
          behavior: settings.noAnimations ? "instant" : "smooth",
          block: "end",
        });
      }
    }
  }, [settings.noAnimations]);

  // Ensure initial view starts at bottom immediately without jump
  useEffect(() => {
    if (messages.length > 0 && !initialScrollDoneRef.current) {
      scrollToBottom(true);
      initialScrollDoneRef.current = true;
    } else if (messages.length > 0) {
      scrollToBottom(false);
    }
  }, [messages.length, scrollToBottom]);

  // Drag & drop images
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDraggingFile(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDraggingFile(false);
        dragCounter = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);
      dragCounter = 0;

      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith("image/")) {
        try {
          const base64 = await processImageToBase64(file);
          sendMessage({ imageBase64: base64 });
        } catch {
          alert("Could not process dropped image.");
        }
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [sendMessage]);

  const handleSaveProfile = (updates: Partial<Pick<User, "name" | "color">>) => {
    onUpdateUser(updates);
    updateProfile(updates);
  };

  return (
    <div className={`room-layout ${isSidebarPinned ? "has-pinned-sidebar" : ""}`}>
      {/* Background layer (live updating from Settings Context) */}
      <ChatBackground />

      {/* Header */}
      <RoomHeader
        roomId={roomId}
        onlineCount={users.filter((u) => u.isOnline !== false).length}
        currentUser={currentUser}
        onLeaveRoom={onLeaveRoom}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        isSidebarPinned={isSidebarPinned}
        notificationPermission={permission}
        onRequestNotifications={requestPermission}
        soundMuted={soundMuted}
        onToggleSound={toggleSound}
      />

      <div className="room-content-row">
        {/* Main Chat Flow */}
        <div className="room-main-area">
          <div className="messages-viewport" ref={scrollContainerRef}>
            {status === "connecting" && (
              <div className="connection-banner connecting">
                <Loader2 size={14} className="spinner" />
                <span>Connecting to room...</span>
              </div>
            )}

            {status === "disconnected" && (
              <div className="connection-banner disconnected">
                <span>Disconnected. Reconnecting to #{roomId}...</span>
              </div>
            )}

            {/* Empty room placeholder without technical jargon (Item 11) */}
            {messages.length === 0 ? (
              <div className="empty-room-state">
                <div className="empty-logo-wrap">
                  <MessageSquare size={26} color="var(--primary-accent)" />
                </div>
                <h2 className="empty-title">Welcome to #{roomId}</h2>
                <p className="empty-description">
                  You’re the first one here! Share the link with friends to start chatting.
                </p>

                <div className="empty-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsShareOpen(true)}
                  >
                    <Share2 size={16} /> Share Room Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="messages-stream">
                {messages.map((msg, index) => {
                  const prev = messages[index - 1];
                  const next = messages[index + 1];
                  const isMe = msg.userId === currentUser.id;

                  // Sequential clustering logic (Item 4)
                  const isFirstInGroup =
                    !prev ||
                    prev.userId !== msg.userId ||
                    prev.isSystem ||
                    msg.timestamp - prev.timestamp > 300000;

                  const isLastInGroup =
                    !next ||
                    next.userId !== msg.userId ||
                    next.isSystem ||
                    next.timestamp - msg.timestamp > 300000;

                  return (
                    <MessageItem
                      key={msg.id}
                      message={msg}
                      isMe={isMe}
                      currentUserId={currentUser.id}
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                      users={users}
                      onEdit={editMessage}
                      onDelete={deleteMessage}
                      onReact={reactMessage}
                      onExpandImage={(url) => setLightboxImage(url)}
                      onReply={(targetMsg) => setReplyingTo(targetMsg)}
                      onScrollToMessage={scrollToMessage}
                      isTargetAvailable={isTargetAvailable}
                    />
                  );
                })}
                <div ref={messagesEndRef} className="scroll-anchor" />
              </div>
            )}
          </div>

          {/* Input Bar with Discord-style typing indicator and reply bar */}
          <ChatInput
            onSendMessage={sendMessage}
            onTyping={sendTyping}
            disabled={status !== "connected"}
            typingUsers={typingUsers}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>

        {/* Members Sidebar (Item 9: pinnable to right side) */}
        <UsersSidebar
          isOpen={isSidebarOpen || isSidebarPinned}
          onClose={() => setIsSidebarOpen(false)}
          users={users}
          currentUserId={currentUser.id}
          typingUsers={typingUsers}
          isPinned={isSidebarPinned}
          onTogglePin={handleTogglePin}
          onOpenProfile={() => {
            setIsSidebarOpen(false);
            setIsProfileOpen(true);
          }}
        />
      </div>

      {/* Drag & Drop Overlay */}
      {isDraggingFile && (
        <div className="drag-drop-overlay">
          <div className="drag-drop-card">
            <UploadCloud size={48} color="var(--primary-accent)" />
            <h3 className="drag-title">Drop image to send</h3>
            <p className="drag-subtitle">Image will be attached to chat</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onSave={handleSaveProfile}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomId={roomId}
      />

      <ImageLightbox
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
