import React, { useRef, useEffect } from "react";
import { Lock, Loader2, ArrowLeft, ShieldX, LogOut } from "lucide-react";

interface WaitingRoomModalProps {
  isOpen: boolean;
  roomId: string;
  isDenied?: boolean;
  deniedReason?: string | null;
  isKicked?: boolean;
  kickedReason?: string | null;
  onLeave: () => void;
}

export const WaitingRoomModal: React.FC<WaitingRoomModalProps> = ({
  isOpen,
  roomId,
  isDenied = false,
  deniedReason,
  isKicked = false,
  kickedReason,
  onLeave,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (dialogRef.current && !dialogRef.current.open) {
        dialogRef.current.showModal();
      }
    } else {
      if (dialogRef.current && dialogRef.current.open) {
        dialogRef.current.close();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="waiting-room-dialog"
      aria-labelledby="waiting-room-title"
      onCancel={(e) => e.preventDefault()}
    >
      <div className="waiting-room-card">
        {isDenied || isKicked ? (
          <div className="waiting-room-content denied">
            <div className="waiting-icon-badge badge-denied">
              <ShieldX size={26} />
            </div>
            <h2 id="waiting-room-title" className="waiting-title">
              {isKicked ? "Removed from Room" : "Join Request Declined"}
            </h2>
            <div className="waiting-room-chip">
              <span className="room-hash">#</span>
              <span>{roomId}</span>
            </div>
            <p className="waiting-desc">
              {kickedReason || deniedReason || "The host did not admit you to this room."}
            </p>
            <div className="waiting-actions">
              <button
                type="button"
                className="btn btn-primary waiting-return-btn"
                onClick={onLeave}
              >
                <ArrowLeft size={15} />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="waiting-room-content">
            <div className="waiting-icon-badge">
              <Lock size={24} className="text-accent" />
            </div>
            <h2 id="waiting-room-title" className="waiting-title">
              Waiting for Host Approval
            </h2>
            <div className="waiting-room-chip">
              <span className="room-hash">#</span>
              <span>{roomId}</span>
            </div>
            <p className="waiting-desc">
              This room is locked by the host. A request has been sent to admit you. Please hold on...
            </p>

            <div className="waiting-status-pill">
              <Loader2 size={13} className="spinner text-accent" />
              <span>Waiting in lobby...</span>
            </div>

            <div className="waiting-actions">
              <button
                type="button"
                className="btn-waiting-leave"
                onClick={onLeave}
              >
                <LogOut size={14} />
                <span>Cancel &amp; Leave</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
};
