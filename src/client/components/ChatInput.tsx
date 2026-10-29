import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Image as ImageIcon,
  Smile,
  Film,
  Loader2,
  X,
  Reply,
} from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";
import { GifPicker } from "./GifPicker";
import { processImageToBase64 } from "../utils/image";
import type { Message, ReplyReference } from "../../server/types";

interface ChatInputProps {
  onSendMessage: (payload: {
    text?: string;
    imageBase64?: string;
    gifUrl?: string;
    replyTo?: ReplyReference;
  }) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  typingUsers?: { id: string; name: string }[];
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  typingUsers = [],
  replyingTo = null,
  onCancelReply,
}) => {
  const [text, setText] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Focus textarea when replyingTo changes
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;

    if (val.trim()) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        onTyping(false);
      }, 2500);
    } else {
      onTyping(false);
    }
  };

  const handleSend = () => {
    const cleanText = text.trim();
    if (!cleanText && !pendingImage) return;

    let replyRef: ReplyReference | undefined;
    if (replyingTo) {
      replyRef = {
        id: replyingTo.id,
        userId: replyingTo.userId,
        userName: replyingTo.userName,
        userColor: replyingTo.userColor,
        text: replyingTo.text,
        imageBase64: replyingTo.imageBase64 ? "attached" : undefined,
        gifUrl: replyingTo.gifUrl,
      };
    }

    onSendMessage({
      text: cleanText || undefined,
      imageBase64: pendingImage || undefined,
      replyTo: replyRef,
    });

    setText("");
    setPendingImage(null);
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (onCancelReply) {
      onCancelReply();
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Modern IME-safety: prevent premature submission when converting characters
      if (e.nativeEvent.isComposing || (e as any).keyCode === 229) {
        return;
      }
      e.preventDefault();
      handleSend();
    } else if (e.key === "Escape") {
      if (replyingTo && onCancelReply) {
        e.preventDefault();
        onCancelReply();
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const base64 = await processImageToBase64(file);
      setPendingImage(base64);
    } catch {
      alert("Could not load image. Please select a valid PNG, JPG, or WebP file.");
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            setIsProcessingImage(true);
            try {
              const base64 = await processImageToBase64(file);
              setPendingImage(base64);
            } catch {
            } finally {
              setIsProcessingImage(false);
            }
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <div className="chat-input-wrapper">
      {/* "Replying to <user>" bar above input with preview and cancel button */}
      {replyingTo && (
        <div className="composing-reply-bar">
          <div
            className="reply-bar-indicator"
            style={{ backgroundColor: replyingTo.userColor || "var(--primary-accent)" }}
          />
          <Reply
            size={14}
            className="reply-bar-icon"
            style={{ color: replyingTo.userColor || "var(--primary-accent)" }}
          />
          <div className="reply-bar-content">
            <span className="reply-bar-title">
              Replying to <strong style={{ color: replyingTo.userColor || "inherit" }}>{replyingTo.userName}</strong>
            </span>
            <span className="reply-bar-snippet">
              {replyingTo.text ||
                (replyingTo.imageBase64
                  ? "📷 Photo"
                  : replyingTo.gifUrl
                  ? "🎬 GIF"
                  : "Original message")}
            </span>
          </div>
          <button
            type="button"
            className="reply-bar-cancel-btn"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            title="Cancel reply (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Discord-style typing indicator directly above input bar */}
      <div className={`discord-typing-bar ${typingUsers.length > 0 ? "visible" : ""}`}>
        {typingUsers.length > 0 && (
          <>
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="typing-label">
              {typingUsers.length === 1 ? (
                <strong>{typingUsers[0].name}</strong>
              ) : typingUsers.length === 2 ? (
                <>
                  <strong>{typingUsers[0].name}</strong> and <strong>{typingUsers[1].name}</strong>
                </>
              ) : (
                <>
                  <strong>{typingUsers[0].name}</strong> and {typingUsers.length - 1} others
                </>
              )}{" "}
              {typingUsers.length === 1 ? "is" : "are"} typing...
            </span>
          </>
        )}
      </div>

      {/* Pending image preview */}
      {pendingImage && (
        <div className="pending-image-preview">
          <div className="pending-image-card">
            <img src={pendingImage} alt="Attachment preview" className="pending-image-thumb" />
            <span className="pending-image-label">Image attached</span>
            <button
              type="button"
              className="remove-image-btn"
              onClick={() => setPendingImage(null)}
              title="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Popovers */}
      {showEmojiPicker && (
        <div className="popover-overlay" onClick={() => setShowEmojiPicker(false)}>
          <div className="popover-anchor" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onSelectEmoji={(emoji) => {
                setText((prev) => prev + emoji);
                if (textareaRef.current) textareaRef.current.focus();
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        </div>
      )}

      {showGifPicker && (
        <div className="popover-overlay" onClick={() => setShowGifPicker(false)}>
          <div className="popover-anchor" onClick={(e) => e.stopPropagation()}>
            <GifPicker
              onSelectGif={(url) => {
                let replyRef: ReplyReference | undefined;
                if (replyingTo) {
                  replyRef = {
                    id: replyingTo.id,
                    userId: replyingTo.userId,
                    userName: replyingTo.userName,
                    userColor: replyingTo.userColor,
                    text: replyingTo.text,
                    gifUrl: url,
                  };
                }
                onSendMessage({ gifUrl: url, replyTo: replyRef });
                setShowGifPicker(false);
                if (onCancelReply) onCancelReply();
              }}
              onClose={() => setShowGifPicker(false)}
            />
          </div>
        </div>
      )}

      <div className="chat-input-bar">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <div className="input-actions-left">
          <button
            type="button"
            className="input-tool-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Image"
            disabled={disabled || isProcessingImage}
          >
            {isProcessingImage ? (
              <Loader2 size={18} className="spinner" />
            ) : (
              <ImageIcon size={18} />
            )}
          </button>

          <button
            type="button"
            className={`input-tool-btn ${showGifPicker ? "active" : ""}`}
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
            }}
            title="GIF Picker"
            disabled={disabled}
          >
            <Film size={18} />
          </button>

          <button
            type="button"
            className={`input-tool-btn ${showEmojiPicker ? "active" : ""}`}
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowGifPicker(false);
            }}
            title="Emoji Picker"
            disabled={disabled}
          >
            <Smile size={18} />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={replyingTo ? `Replying to ${replyingTo.userName}...` : "Message or paste image (Ctrl+V)..."}
          className="chat-textarea"
          rows={1}
          maxLength={2000}
          disabled={disabled}
        />

        {text.length > 1800 && (
          <span className="char-limit-indicator" title="Character limit: 2000">
            {text.length}/2000
          </span>
        )}

        <button
          type="button"
          className={`input-send-btn ${text.trim() || pendingImage ? "ready" : ""}`}
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !pendingImage)}
          title="Send message (Enter)"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
