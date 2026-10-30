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
      renderQrCode(roomUrl, canvasRef.current);
      const timer = setTimeout(() => {
        renderQrCode(roomUrl, canvasRef.current);
      }, 50);
      return () => clearTimeout(timer);
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
    } catch {}
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join room #${roomId} on Loopin`,
          text: `Join the conversation in #${roomId} on Loopin!`,
          url: roomUrl,
        });
      } catch {}
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="share-dialog"
      aria-labelledby="share-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="share-modal-content">
        <div className="share-modal-header">
          <div className="share-title-row">
            <QrCode size={18} className="text-accent" />
            <div>
              <h2 id="share-dialog-title" className="share-modal-title">Share Room</h2>
              <p className="share-modal-desc">Invite others with the link or QR code</p>
            </div>
          </div>
          <button
            type="button"
            className="share-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div className="share-body">
          <div className="share-qr-wrap">
            <div className="share-qr-inner">
              <canvas ref={canvasRef} className="share-qr-canvas" />
            </div>
            <span className="share-qr-caption">Scan to join on mobile</span>
          </div>

          <div className="share-input-row">
            <input
              type="text"
              readOnly
              value={roomUrl}
              className="share-url-field"
              onClick={(e) => (e.target as HTMLInputElement).select()}
              aria-label="Room URL"
            />
            <button
              type="button"
              className="share-copy-action-btn"
              onClick={handleCopy}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              type="button"
              className="share-native-button"
              onClick={handleNativeShare}
            >
              <Share2 size={14} /> Share via device...
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
};
