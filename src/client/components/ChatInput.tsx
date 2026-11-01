import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Send,
  Image as ImageIcon,
  Smile,
  Film,
  Loader2,
  X,
  Reply,
  Pencil,
  Check,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";
import { GifPicker } from "./GifPicker";
import { processImageToBase64 } from "../utils/image";
import type { Message, ReplyReference } from "../../server/types";
import { isCoppaChildMode } from "../hooks/useUser";
import { useSettings } from "../hooks/useSettings";
import { checkMessageCompliance } from "../utils/complianceGuard";

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
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
  onSaveEdit?: (id: string, text: string) => void;
}

/**
 * Parses and renders inline markdown tokens character-for-character so that
 * when layered under the transparent textarea, the user is typing directly
 * into the actively formatted markdown preview.
 */
function renderInlineSpans(text: string, keyPrefix: string): React.ReactNode[] {
  const inlineRegex =
    /(`[^`\n]+`)|(\*\*[^*\n]+\*\*|__[^_\n]+__)|(\*[^*\n]+\*|_[^_\n]+_)|(~~[^~\n]+~~)|(\[([^\]\n]+)\]\(([^)\s]+)\))/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let spanIdx = 0;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const [full, code, bold, italic, strike, link, linkText, linkUrl] = match;

    if (code) {
      const inner = code.slice(1, -1);
      elements.push(
        <span key={`${keyPrefix}-${spanIdx++}`} className="md-preview-code">
          <span className="md-preview-marker">`</span>
          {inner}
          <span className="md-preview-marker">`</span>
        </span>
      );
    } else if (bold) {
      const marker = bold.slice(0, 2);
      const inner = bold.slice(2, -2);
      elements.push(
        <strong key={`${keyPrefix}-${spanIdx++}`} className="md-preview-bold">
          <span className="md-preview-marker">{marker}</span>
          {inner}
          <span className="md-preview-marker">{marker}</span>
        </strong>
      );
    } else if (italic) {
      const marker = italic.slice(0, 1);
      const inner = italic.slice(1, -1);
      elements.push(
        <em key={`${keyPrefix}-${spanIdx++}`} className="md-preview-italic">
          <span className="md-preview-marker">{marker}</span>
          {inner}
          <span className="md-preview-marker">{marker}</span>
        </em>
      );
    } else if (strike) {
      const inner = strike.slice(2, -2);
      elements.push(
        <del key={`${keyPrefix}-${spanIdx++}`} className="md-preview-strike">
          <span className="md-preview-marker">~~</span>
          {inner}
          <span className="md-preview-marker">~~</span>
        </del>
      );
    } else if (link) {
      elements.push(
        <span key={`${keyPrefix}-${spanIdx++}`} className="md-preview-link">
          <span className="md-preview-marker">[</span>
          {linkText}
          <span className="md-preview-marker">]({linkUrl})</span>
        </span>
      );
    } else {
      elements.push(full);
    }

    lastIndex = inlineRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

function renderInlineMarkdownPreview(rawText: string): React.ReactNode {
  if (!rawText) return null;

  const lines = rawText.split("\n");
  let inCodeBlock = false;

  return lines.map((line, lineIdx) => {
    const isLastLine = lineIdx === lines.length - 1;

    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return (
        <React.Fragment key={lineIdx}>
          <span className="md-preview-fence">{line}</span>
          {!isLastLine && "\n"}
        </React.Fragment>
      );
    }

    if (inCodeBlock) {
      return (
        <React.Fragment key={lineIdx}>
          <span className="md-preview-code-line">{line}</span>
          {!isLastLine && "\n"}
        </React.Fragment>
      );
    }

    // Header check at line start (# Heading)
    const headerMatch = line.match(/^(#{1,6}\s+)(.*)$/);
    if (headerMatch) {
      const [, hashPrefix, content] = headerMatch;
      const level = Math.min(hashPrefix.trim().length, 3);
      return (
        <React.Fragment key={lineIdx}>
          <span className={`md-preview-header md-preview-h${level}`}>
            <span className="md-preview-marker">{hashPrefix}</span>
            {renderInlineSpans(content, `h-${lineIdx}`)}
          </span>
          {!isLastLine && "\n"}
        </React.Fragment>
      );
    }

    // Quote check at line start (> Quote)
    const quoteMatch = line.match(/^(>\s*)(.*)$/);
    if (quoteMatch) {
      const [, quotePrefix, content] = quoteMatch;
      return (
        <React.Fragment key={lineIdx}>
          <span className="md-preview-quote">
            <span className="md-preview-marker">{quotePrefix}</span>
            {renderInlineSpans(content, `q-${lineIdx}`)}
          </span>
          {!isLastLine && "\n"}
        </React.Fragment>
      );
    }

    return (
      <React.Fragment key={lineIdx}>
        {renderInlineSpans(line, `l-${lineIdx}`)}
        {!isLastLine && "\n"}
      </React.Fragment>
    );
  });
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  typingUsers = [],
  replyingTo = null,
  onCancelReply,
  editingMessage = null,
  onCancelEdit,
  onSaveEdit,
}) => {
  const [text, setText] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [piiAlert, setPiiAlert] = useState<string | null>(null);

  const isChildMode = isCoppaChildMode();
  const { settings } = useSettings();
  const isFerpaMode = settings.ferpaMode;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewUnderlayRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Focus textarea when connected or reply/edit starts
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

  // When editingMessage changes, load its text into the input bar and focus
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || "");
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = (editingMessage.text || "").length;
        textareaRef.current.setSelectionRange(len, len);
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
      }
    }
  }, [editingMessage]);

  // Check if current text contains any markdown tokens
  const hasMarkdown = useMemo(() => {
    return /([*_`~#>[\]]|```)/.test(text);
  }, [text]);

  const headingLevel = useMemo(() => {
    const match = text.match(/^(#{1,3})\s+/);
    return match ? match[1].length : 0;
  }, [text]);

  const renderedPreviewTokens = useMemo(() => {
    if (!hasMarkdown) return null;
    return renderInlineMarkdownPreview(text);
  }, [text, hasMarkdown]);

  const handleScroll = () => {
    if (textareaRef.current && previewUnderlayRef.current) {
      previewUnderlayRef.current.scrollTop = textareaRef.current.scrollTop;
      previewUnderlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Auto-resize up to 160px
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;

    if (piiAlert) {
      setPiiAlert(null);
    }

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

    // Compliance Check (COPPA & FERPA)
    if (cleanText) {
      const compliance = checkMessageCompliance(cleanText, isChildMode, isFerpaMode);
      if (!compliance.isSafe) {
        if (isChildMode || (isFerpaMode && compliance.piiType === "ssn_id")) {
          setPiiAlert(compliance.warning || "Personal info cannot be sent.");
          return;
        }
      }
    }

    // If editing a message, save the edit
    if (editingMessage && onSaveEdit) {
      if (cleanText && cleanText !== editingMessage.text) {
        onSaveEdit(editingMessage.id, cleanText);
      }
      setText("");
      if (onCancelEdit) onCancelEdit();
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      return;
    }

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
      if (showEmojiPicker) {
        e.preventDefault();
        setShowEmojiPicker(false);
        return;
      }
      if (showGifPicker) {
        e.preventDefault();
        setShowGifPicker(false);
        return;
      }
      if (editingMessage && onCancelEdit) {
        e.preventDefault();
        setText("");
        onCancelEdit();
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        return;
      }
      if (replyingTo && onCancelReply) {
        e.preventDefault();
        onCancelReply();
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isChildMode) {
      setPiiAlert("🛡️ COPPA Notice: Image uploads are disabled for child accounts.");
      return;
    }
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
      if (isChildMode) return;
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

  useEffect(() => {
    if (!showEmojiPicker && !showGifPicker) return;
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEmojiPicker(false);
        setShowGifPicker(false);
      }
    };
    window.addEventListener("keydown", handleGlobalEsc);
    return () => window.removeEventListener("keydown", handleGlobalEsc);
  }, [showEmojiPicker, showGifPicker]);

  return (
    <div className="chat-input-container">
      {/* 1. Reserved Typing Indicator Row */}
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

      {/* 3. Editing Message Banner */}
      {editingMessage && (
        <div className="editing-banner-flat">
          <div className="editing-banner-left">
            <Pencil size={13} className="text-accent" />
            <span className="editing-banner-label">Editing message:</span>
            <span className="editing-banner-snippet">
              {editingMessage.text || "(Image/Attachment)"}
            </span>
          </div>
          <div className="editing-banner-actions">
            <span className="editing-banner-hint">Esc to cancel</span>
            <button
              type="button"
              className="editing-banner-close-btn"
              onClick={() => {
                setText("");
                if (onCancelEdit) onCancelEdit();
              }}
              title="Cancel editing (Esc)"
              aria-label="Cancel editing"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Pending image thumbnail */}
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

      {/* Compliance / PII Alert Banner */}
      {piiAlert && (
        <div className="compliance-input-alert">
          <AlertTriangle size={14} className="text-danger" />
          <span className="compliance-input-alert-text">{piiAlert}</span>
          <button
            type="button"
            className="compliance-alert-dismiss"
            onClick={() => setPiiAlert(null)}
            aria-label="Dismiss alert"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* 5. Main Input Box with Direct In-Place Active Markdown Preview */}
      <div className="chat-input-box">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <div className="input-tools-left">
          {!isChildMode && (
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
          )}

          {!isChildMode && !isFerpaMode && (
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
          )}

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

        {/* In-box live markdown editor: transparent textarea overlaid on formatted preview underlay */}
        <div className={`chat-input-editor-wrapper ${headingLevel > 0 ? `has-heading has-heading-${headingLevel}` : ""}`}>
          <div
            ref={previewUnderlayRef}
            className={`chat-input-markdown-underlay ${hasMarkdown ? "visible" : ""}`}
            aria-hidden="true"
          >
            {renderedPreviewTokens}
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            placeholder={
              editingMessage
                ? "Edit your message... (Enter to save, Esc to cancel)"
                : replyingTo
                ? `Replying to ${replyingTo.userName}...`
                : "Send a message..."
            }
            className={`chat-input-textarea ${hasMarkdown ? "has-markdown" : ""}`}
            rows={1}
            maxLength={2000}
            disabled={disabled}
            aria-label={editingMessage ? "Edit message" : "Message input"}
          />
        </div>

        <button
          type="button"
          className={`chat-send-accent-btn ${editingMessage ? "is-editing" : ""}`}
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !pendingImage)}
          title={editingMessage ? "Save changes (Enter)" : "Send message (Enter)"}
          aria-label={editingMessage ? "Save changes" : "Send message"}
        >
          {editingMessage ? <Check size={16} /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
};
