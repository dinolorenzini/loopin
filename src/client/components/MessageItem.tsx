import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  Pencil,
  Trash2,
  Smile,
  Check,
  CheckCheck,
  X,
  Clock,
  Reply,
} from "lucide-react";
import type { Message, User } from "../../server/types";
import { MarkdownRenderer } from "../utils/markdown";

interface MessageItemProps {
  message: Message;
  isMe: boolean;
  currentUserId: string;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  showDelivered?: boolean;
  showSeen?: boolean;
  users?: User[];
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onExpandImage: (url: string) => void;
  onReply: (message: Message) => void;
  onScrollToMessage: (targetId: string) => void;
  isTargetAvailable?: (targetId: string) => boolean;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "🚀", "😮"];

function getInitials(name: string): string {
  if (!name) return "?";
  const clean = name.replace(/[\x00-\x1F\x7F]/g, "").trim();
  const parts = clean.split(/[\s-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getContrastTextColor(hexColor?: string): string {
  if (!hexColor || !hexColor.startsWith("#")) return "#09090b";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) || 0;
  const g = parseInt(hex.slice(2, 4), 16) || 0;
  const b = parseInt(hex.slice(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#09090b" : "#ffffff";
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMe,
  currentUserId,
  isFirstInGroup,
  isLastInGroup,
  showDelivered = false,
  showSeen = false,
  users = [],
  onEdit,
  onDelete,
  onReact,
  onExpandImage,
  onReply,
  onScrollToMessage,
  isTargetAvailable,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || "");
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [showReadersPopover, setShowReadersPopover] = useState(false);

  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiMenuRef = useRef<HTMLDivElement>(null);
  const readersRef = useRef<HTMLDivElement>(null);

  // Close emoji popover on outside click
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

  // Close readers popover on outside click
  useEffect(() => {
    if (!showReadersPopover) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (readersRef.current && !readersRef.current.contains(e.target as Node)) {
        setShowReadersPopover(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showReadersPopover]);

  // Auto-resize textarea seamlessly inside message bubble
  useLayoutEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      // Select cursor at end
      editTextareaRef.current.setSelectionRange(editText.length, editText.length);
      editTextareaRef.current.style.height = "auto";
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSaveEdit = () => {
    const clean = editText.trim();
    if (clean && clean !== message.text) {
      onEdit(message.id, clean);
    }
    setIsEditing(false);
  };

  // Keyboard handling for inline editing: Enter saves, Escape cancels, Shift+Enter adds newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Modern IME-safety: prevent premature submission when converting characters
      if (e.nativeEvent.isComposing || (e as any).keyCode === 229) {
        return;
      }
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
      setEditText(message.text || "");
    }
  };

  const timeFormatted = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // System Announcement Row
  if (message.isSystem) {
    return (
      <div id={`msg-${message.id}`} className="system-announcement-row">
        <span className="system-pill">{message.text}</span>
        <span className="system-time">{timeFormatted}</span>
      </div>
    );
  }

  // Calculate readers (strictly excluding author and current viewer)
  const rawReaderIds = (message.readBy || []).filter(
    (id) => id !== message.userId && id !== currentUserId
  );
  const readerUsers: User[] = rawReaderIds
    .map((id) => {
      const found = users.find((u) => u.id === id);
      return (
        found || {
          id,
          name: "Member",
          color: "#94a3b8",
          joinedAt: 0,
        }
      );
    })
    .filter((u) => u.id !== currentUserId);

  const isReplyAvailable =
    !message.replyTo || (isTargetAvailable ? isTargetAvailable(message.replyTo.id) : true);

  const groupClasses = [
    isFirstInGroup ? "group-start" : "group-middle",
    isLastInGroup ? "group-end" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      id={`msg-${message.id}`}
      className={`message-row ${isMe ? "message-row-me" : "message-row-other"} ${groupClasses}`}
    >
      <div className="msg-content-wrapper">
        {/* Header with username and timestamp */}
        {isFirstInGroup && (
          <div className="msg-outside-header">
            {!isMe && (
              <span className="msg-author" style={{ color: message.userColor }}>
                {message.userName}
              </span>
            )}
            <span className="msg-timestamp-outside">{timeFormatted}</span>
          </div>
        )}

        {/* Message Bubble */}
        <div className={`msg-bubble ${isMe ? "bubble-me" : "bubble-other"}`}>
          {/* Quoted Reply Preview */}
          {message.replyTo && (
            <div
              className={`msg-quoted-preview ${!isReplyAvailable ? "unavailable" : ""}`}
              onClick={() => isReplyAvailable && onScrollToMessage(message.replyTo!.id)}
              role={isReplyAvailable ? "button" : undefined}
              tabIndex={isReplyAvailable ? 0 : undefined}
              title={
                isReplyAvailable
                  ? `Jump to ${message.replyTo.userName}'s message`
                  : "Original message is no longer available"
              }
            >
              <div
                className="quoted-accent-bar"
                style={{ backgroundColor: message.replyTo.userColor || "var(--primary-accent)" }}
              />
              <div className="quoted-content-col">
                <span
                  className="quoted-user-name"
                  style={{ color: message.replyTo.userColor || "var(--primary-accent)" }}
                >
                  {message.replyTo.userName}
                </span>
                <span className="quoted-text-snippet">
                  {message.replyTo.text ||
                    (message.replyTo.imageBase64
                      ? "📷 Photo"
                      : message.replyTo.gifUrl
                      ? "🎬 GIF"
                      : "Message")}
                </span>
              </div>
              {!isReplyAvailable && (
                <span className="quoted-unavailable-pill">deleted</span>
              )}
            </div>
          )}

          {/* Inline Edit or Content */}
          {isEditing ? (
            <div className="inline-edit-container">
              <textarea
                ref={editTextareaRef}
                value={editText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                className="inline-edit-textarea"
                rows={1}
                maxLength={2000}
                aria-label="Edit message"
              />
              <div className="inline-edit-buttons">
                <button
                  type="button"
                  className="inline-edit-btn save-btn"
                  onClick={handleSaveEdit}
                  title="Save changes (Enter)"
                >
                  <Check size={12} />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  className="inline-edit-btn cancel-btn"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(message.text || "");
                  }}
                  title="Cancel edit (Escape)"
                >
                  <X size={12} />
                  <span>Cancel</span>
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
              {/* Reply Button */}
              <button
                type="button"
                className="hover-action-btn"
                onClick={() => onReply(message)}
                title="Reply to message"
              >
                <Reply size={13} />
              </button>

              {/* Reaction Trigger */}
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

        {/* Existing Reactions Pill List */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="reactions-display-row">
            {Object.entries(message.reactions).map(([emoji, userIds]) => {
              const count = userIds.length;
              if (count === 0) return null;
              const hasReacted = userIds.includes(currentUserId);
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

        {/* Read Receipts & Delivery Status directly BELOW the message bubble */}
        {isMe && (showSeen || showDelivered) && (
          <div className="msg-below-footer" ref={readersRef}>
            {showDelivered && message.status === "sending" && (
              <span className="msg-status-wrap" title="Sending...">
                <Clock size={11} className="status-sending-icon" />
              </span>
            )}
            {showDelivered && message.status !== "sending" && (
              <span className="msg-status-wrap" title="Delivered">
                <Check size={12} className="status-delivered-icon" />
              </span>
            )}
            {showSeen && readerUsers.length > 0 && (
              <div
                className="readers-avatars-row"
                onClick={() => setShowReadersPopover(!showReadersPopover)}
                title={`Read by: ${readerUsers.map((r) => r.name).join(", ")}`}
              >
                {readerUsers.slice(0, 3).map((reader) => (
                  <span
                    key={reader.id}
                    className="reader-avatar-badge"
                    style={{
                      backgroundColor: reader.color || "var(--primary-accent)",
                      color: getContrastTextColor(reader.color),
                    }}
                  >
                    {getInitials(reader.name)}
                  </span>
                ))}

                {readerUsers.length > 3 && (
                  <span className="reader-avatar-badge reader-avatar-more">
                    +{readerUsers.length - 3}
                  </span>
                )}

                <span className="reader-status-label">
                  {readerUsers.length === 1 ? `Seen by ${readerUsers[0].name}` : `Seen by ${readerUsers.length}`}
                </span>

                <CheckCheck size={12} className="status-read-icon" />

                {showReadersPopover && (
                  <div className="readers-popover-card" onClick={(e) => e.stopPropagation()}>
                    <div className="readers-popover-title">Read by ({readerUsers.length})</div>
                    <div className="readers-popover-list">
                      {readerUsers.map((r) => (
                        <div key={r.id} className="reader-popover-item">
                          <span
                            className="reader-avatar-badge small"
                            style={{
                              backgroundColor: r.color || "var(--primary-accent)",
                              color: getContrastTextColor(r.color),
                            }}
                          >
                            {getInitials(r.name)}
                          </span>
                          <span className="reader-popover-name" style={{ color: r.color }}>
                            {r.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
