import React, { useRef, useEffect, useState } from "react";
import { Share2, Copy, Check, X, QrCode } from "lucide-react";
import { renderQrCode } from "../utils/qr";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, roomId }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const roomUrl = typeof window !== "undefined" ? `${window.location.origin}/${roomId}` : `/${roomId}`;

  useEffect(() => {
    if (isOpen) {
      if (dialogRef.current && !dialogRef.current.open) {
        dialogRef.current.showModal();
      }
      setTimeout(() => {
        renderQrCode(roomUrl, canvasRef.current);
      }, 50);
    } else {
      if (dialogRef.current && dialogRef.current.open) {
        dialogRef.current.close();
      }
    }
  }, [isOpen, roomUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my chat room #${roomId} on Loopin`,
          text: `Jump into this ephemeral chat on Loopin. Messages vanish when everyone disconnects.`,
          url: roomUrl,
        });
      } catch {
        // User cancelled or unsupported
      }
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="profile-dialog"
      aria-labelledby="share-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="profile-modal-content">
        <div className="profile-modal-header">
          <div className="modal-title-with-icon">
            <div className="share-icon-badge">
              <QrCode size={20} color="#38bdf8" />
            </div>
            <div>
              <h2 id="share-dialog-title" className="modal-title">Share Room</h2>
              <p className="modal-subtitle">Invite anyone with the link or QR code</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="share-body">
          <div className="qr-container">
            <canvas ref={canvasRef} className="qr-canvas" />
            <span className="qr-caption">Scan to join on mobile</span>
          </div>

          <div className="share-input-group">
            <input
              type="text"
              readOnly
              value={roomUrl}
              className="text-input share-url-input"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              className={`btn btn-copy ${copied ? "btn-copied" : "btn-primary"}`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check size={16} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy Link
                </>
              )}
            </button>
          </div>

          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              type="button"
              className="btn btn-secondary full-width-btn"
              onClick={handleNativeShare}
            >
              <Share2 size={16} /> Share via Apps...
            </button>
          )}

          <div className="ephemeral-notice-box">
            <span className="ephemeral-dot" />
            <span>
              <strong>Zero Traces:</strong> When all participants leave, all messages, images, and history in this room are permanently deleted.
            </span>
          </div>
        </div>
      </div>
    </dialog>
  );
};
