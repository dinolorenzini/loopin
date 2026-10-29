import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Users,
  ShieldCheck,
  UploadCloud,
  Loader2,
  Share2,
} from "lucide-react";
import { useChatRoom } from "../hooks/useChatRoom";
import { useNotifications } from "../hooks/useNotifications";
import { RoomHeader } from "./RoomHeader";
import { MessageItem } from "./MessageItem";
import { ChatInput } from "./ChatInput";
import { UsersSidebar } from "./UsersSidebar";
import { ProfileModal } from "./ProfileModal";
import { ShareModal } from "./ShareModal";
import { ImageLightbox } from "./ImageLightbox";
import { processImageToBase64 } from "../utils/image";
import type { User } from "../../server/types";

interface RoomViewProps {
  roomId: string;
  currentUser: User;
  onUpdateUser: (updates: Partial<Pick<User, "name" | "color" | "avatar">>) => void;
  onLeaveRoom: () => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  roomId,
  currentUser,
  onUpdateUser,
  onLeaveRoom,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Hook for notifications, title live updating & sound chime
  const {
    unreadCount,
    permission,
    soundMuted,
    requestPermission,
    toggleSound,
    onNewMessage,
  } = useNotifications(roomId, currentUser.id);

  // Hook for WebSocket real-time chat room
  const {
    messages,
    users,
    status,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    reactMessage,
    sendTyping,
    updateProfile,
  } = useChatRoom({
    roomId,
    currentUser,
    onNewMessage,
  });

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, scrollToBottom]);

  // Handle Drag & Drop of image anywhere over the room
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

  // Handle saving profile changes
  const handleSaveProfile = (updates: Partial<Pick<User, "name" | "color" | "avatar">>) => {
    onUpdateUser(updates);
    updateProfile(updates);
  };

  return (
    <div className="room-layout">
      {/* Header */}
      <RoomHeader
        roomId={roomId}
        onlineCount={users.length}
        currentUser={currentUser}
        onLeaveRoom={onLeaveRoom}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        notificationPermission={permission}
        onRequestNotifications={requestPermission}
        soundMuted={soundMuted}
        onToggleSound={toggleSound}
      />

      <div className="room-main-area">
        {/* Messages Stream */}
        <div className="messages-viewport" ref={scrollContainerRef}>
          {status === "connecting" && (
            <div className="connection-banner connecting">
              <Loader2 size={14} className="spinner" />
              <span>Connecting to Cloudflare edge room...</span>
            </div>
          )}

          {status === "disconnected" && (
            <div className="connection-banner disconnected">
              <span>Reconnecting to room #{roomId}...</span>
            </div>
          )}

          {/* Empty room placeholder */}
          {messages.length === 0 ? (
            <div className="empty-room-state">
              <div className="empty-logo-wrap">
                <Sparkles size={28} color="#38bdf8" />
              </div>
              <h2 className="empty-title">Welcome to #{roomId}</h2>
              <p className="empty-description">
                You’re the first one here! Share the link with friends to chat.
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

              <div className="ephemeral-callout">
                <ShieldCheck size={16} color="#34d399" />
                <span>
                  <strong>Ephemeral Guarantee:</strong> When all users leave this room, all messages, images, and state are immediately wiped.
                </span>
              </div>
            </div>
          ) : (
            <div className="messages-stream">
              {messages.map((msg, index) => {
                const prev = messages[index - 1];
                const isMe = msg.userId === currentUser.id;
                const isSameUser = prev && prev.userId === msg.userId && msg.timestamp - prev.timestamp < 120000;

                return (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    isMe={isMe}
                    onEdit={editMessage}
                    onDelete={deleteMessage}
                    onReact={reactMessage}
                    onExpandImage={(url) => setLightboxImage(url)}
                    showAvatar={!isSameUser}
                  />
                );
              })}
              <div ref={messagesEndRef} className="scroll-anchor" />
            </div>
          )}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="typing-indicator-bar">
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="typing-label">
                {typingUsers.map((u) => u.name).join(", ")}{" "}
                {typingUsers.length === 1 ? "is" : "are"} typing...
              </span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <ChatInput
          onSendMessage={sendMessage}
          onTyping={sendTyping}
          disabled={status !== "connected"}
        />

        {/* Members Sidebar Drawer */}
        <UsersSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          users={users}
          currentUserId={currentUser.id}
          typingUsers={typingUsers}
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
            <UploadCloud size={48} color="#38bdf8" />
            <h3 className="drag-title">Drop image to send</h3>
            <p className="drag-subtitle">Will be processed as Base64</p>
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
