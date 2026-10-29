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

  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Auto-resize up to 160px
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;

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
    <div className="chat-input-container">
      {/* 1. Dedicated Reserved Typing Indicator Row (Zero Layout Shift) */}
      <div className="typing-indicator-reserved-row" aria-live="polite">
        {typingUsers.length > 0 && (
          <div className="typing-content-box">
            <span className="typing-text-label">
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
          </div>
        )}
      </div>

      {/* 2. Replying to banner */}
      {replyingTo && (
        <div className="replying-banner-flat">
          <div className="replying-banner-left">
            <Reply size={13} className="text-accent" />
            <span className="replying-banner-label">
              Replying to <strong style={{ color: replyingTo.userColor }}>{replyingTo.userName}</strong>:
            </span>
            <span className="replying-banner-snippet">
              {replyingTo.text || (replyingTo.imageBase64 ? "Image" : replyingTo.gifUrl ? "GIF" : "")}
            </span>
          </div>
          <button
            type="button"
            className="replying-banner-close-btn"
            onClick={onCancelReply}
            title="Cancel reply (Esc)"
            aria-label="Cancel reply"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* 3. Pending image thumbnail */}
      {pendingImage && (
        <div className="pending-image-row">
          <div className="pending-image-chip">
            <img src={pendingImage} alt="Attachment" className="pending-thumb" />
            <span className="pending-label">Image attached</span>
            <button
              type="button"
              className="pending-remove-btn"
              onClick={() => setPendingImage(null)}
              title="Remove attachment"
              aria-label="Remove attachment"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Popovers */}
      {showEmojiPicker && (
        <div className="popover-backdrop" onClick={() => setShowEmojiPicker(false)}>
          <div className="popover-content-box" onClick={(e) => e.stopPropagation()}>
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
        <div className="popover-backdrop" onClick={() => setShowGifPicker(false)}>
          <div className="popover-content-box" onClick={(e) => e.stopPropagation()}>
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

      {/* 4. Compact Main Input Box */}
      <div className="chat-input-box">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <div className="input-tools-left">
          <button
            type="button"
            className="input-icon-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
            aria-label="Attach image"
            disabled={disabled || isProcessingImage}
          >
            {isProcessingImage ? <Loader2 size={16} className="spinner" /> : <ImageIcon size={16} />}
          </button>

          <button
            type="button"
            className={`input-icon-btn ${showGifPicker ? "active" : ""}`}
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
            }}
            title="Insert GIF"
            aria-label="Insert GIF"
            disabled={disabled}
          >
            <Film size={16} />
          </button>

          <button
            type="button"
            className={`input-icon-btn ${showEmojiPicker ? "active" : ""}`}
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowGifPicker(false);
            }}
            title="Emoji picker"
            aria-label="Emoji picker"
            disabled={disabled}
          >
            <Smile size={16} />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={replyingTo ? `Replying to ${replyingTo.userName}...` : "Send a message..."}
          className="chat-input-textarea"
          rows={1}
          maxLength={2000}
          disabled={disabled}
          aria-label="Message input"
        />

        <button
          type="button"
          className="chat-send-accent-btn"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !pendingImage)}
          title="Send message (Enter)"
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
