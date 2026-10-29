import React, { useState, useRef, useEffect } from "react";
import {
  Pencil,
  Trash2,
  Smile,
  Check,
  CheckCheck,
  X,
  Clock,
} from "lucide-react";
import type { Message } from "../../server/types";
import { MarkdownRenderer } from "../utils/markdown";

interface MessageItemProps {
  message: Message;
  isMe: boolean;
  currentUserId: string;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onExpandImage: (url: string) => void;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "🚀", "😮"];

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMe,
  currentUserId,
  isFirstInGroup,
  isLastInGroup,
  onEdit,
  onDelete,
  onReact,
  onExpandImage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || "");
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const emojiMenuRef = useRef<HTMLDivElement>(null);

  // Close emoji popover on outside click (Item 16)
  useEffect(() => {
    if (!showEmojiMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(e.target as Node)) {
        setShowEmojiMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showEmojiMenu]);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = editText.trim();
    if (clean && clean !== message.text) {
      onEdit(message.id, clean);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(message.text || "");
    }
  };

  const timeFormatted = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isRead = Boolean(message.readBy && message.readBy.some((id) => id !== message.userId));

  // System Announcement Row (Item 7)
  if (message.isSystem) {
    return (
      <div className="system-announcement-row">
        <span className="system-pill">{message.text}</span>
        <span className="system-time">{timeFormatted}</span>
      </div>
    );
  }

  const groupClasses = [
    isFirstInGroup ? "group-start" : "group-middle",
    isLastInGroup ? "group-end" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={`message-row ${isMe ? "message-row-me" : "message-row-other"} ${groupClasses}`}
    >
      <div className="msg-content-wrapper">
        {/* Header with username and external timestamp (Item 2 & 3: time outside message, no avatars) */}
        {isFirstInGroup && (
          <div className="msg-outside-header">
            {!isMe && (
              <span className="msg-author" style={{ color: message.userColor }}>
                {message.userName}
              </span>
            )}
            <span className="msg-timestamp-outside">{timeFormatted}</span>
            {isMe && (
              <span
                className="msg-status-wrap"
                title={
                  message.status === "sending"
                    ? "Sending..."
                    : isRead
                    ? "Read"
                    : "Delivered"
                }
              >
                {message.status === "sending" ? (
                  <Clock size={11} className="status-sending-icon" />
                ) : isRead ? (
                  <CheckCheck size={13} className="status-read-icon" />
                ) : (
                  <Check size={12} className="status-delivered-icon" />
                )}
              </span>
            )}
          </div>
        )}

        <div className={`msg-bubble ${isMe ? "bubble-me" : "bubble-other"}`}>
          {isEditing ? (
            <div className="inline-edit-box">
              <input
                ref={editInputRef}
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="inline-edit-input"
              />
              <div className="inline-edit-actions">
                <button
                  type="button"
                  className="edit-action-btn btn-save"
                  onClick={() => handleSaveEdit()}
                  title="Save (Enter)"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  className="edit-action-btn btn-cancel"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(message.text || "");
                  }}
                  title="Cancel (Esc)"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.text && (
                <div className="msg-text">
                  <MarkdownRenderer content={message.text} />
                </div>
              )}

              {message.imageBase64 && (
                <div
                  className="msg-image-container"
                  onClick={() => onExpandImage(message.imageBase64!)}
                  title="Click to view full size"
                >
                  <img
                    src={message.imageBase64}
                    alt="Upload in chat"
                    className="msg-image"
                    loading="lazy"
                  />
                </div>
              )}

              {message.gifUrl && (
                <div
                  className="msg-gif-container"
                  onClick={() => onExpandImage(message.gifUrl!)}
                  title="Click to view full size"
                >
                  <img
                    src={message.gifUrl}
                    alt="GIF in chat"
                    className="msg-gif"
                    loading="lazy"
                  />
                </div>
              )}

              {message.editedAt && (
                <span
                  className="msg-edited-badge"
                  title={`Edited at ${new Date(message.editedAt).toLocaleTimeString()}`}
                >
                  (edited)
                </span>
              )}
            </>
          )}

          {/* Action Toolbar on hover */}
          {!isEditing && (
            <div className="msg-hover-toolbar">
              <div className="reaction-trigger-wrap" ref={emojiMenuRef}>
                <button
                  type="button"
                  className="hover-action-btn"
                  onClick={() => setShowEmojiMenu(!showEmojiMenu)}
                  title="Add reaction"
                >
                  <Smile size={14} />
                </button>

                {showEmojiMenu && (
                  <div className="quick-emoji-popover">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="quick-emoji-btn"
                        onClick={() => {
                          onReact(message.id, emoji);
                          setShowEmojiMenu(false);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isMe && (
                <>
                  {message.text && (
                    <button
                      type="button"
                      className="hover-action-btn"
                      onClick={() => setIsEditing(true)}
                      title="Edit message"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="hover-action-btn delete-btn"
                    onClick={() => onDelete(message.id)}
                    title="Delete message"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Existing Reactions Pill List (Item 16: fixed UI and highlight own reaction) */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="reactions-display-row">
            {Object.entries(message.reactions).map(([emoji, users]) => {
              const count = users.length;
              if (count === 0) return null;
              const hasReacted = users.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  type="button"
                  className={`reaction-pill ${hasReacted ? "my-reaction" : ""}`}
                  onClick={() => onReact(message.id, emoji)}
                  title={`Reacted by ${count} ${count === 1 ? "person" : "people"}`}
                >
                  <span className="reaction-emoji">{emoji}</span>
                  <span className="reaction-count">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
