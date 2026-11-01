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
      className="profile-dialog waiting-room-dialog"
      aria-labelledby="waiting-room-title"
      onCancel={(e) => e.preventDefault()}
    >
      <div className="profile-modal-content waiting-room-content">
        {isDenied || isKicked ? (
          <div className="waiting-room-denied-view">
            <div className="denied-icon-wrap">
              <ShieldX size={36} className="text-danger" />
            </div>
            <h2 id="waiting-room-title" className="waiting-title">
              {isKicked ? "Removed from Room" : "Join Request Declined"}
            </h2>
            <p className="waiting-desc">
              {kickedReason || deniedReason || "The host did not admit you to this room."}
            </p>
            <div className="waiting-actions">
              <button
                type="button"
                className="btn btn-primary full-width-btn"
                onClick={onLeave}
              >
                <ArrowLeft size={16} />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="waiting-room-pending-view">
            <div className="waiting-icon-pulse">
              <Lock size={32} className="text-accent" />
            </div>
            <h2 id="waiting-room-title" className="waiting-title">
              Waiting for Host Approval
            </h2>
            <p className="waiting-room-tag">Room #{roomId}</p>
            <p className="waiting-desc">
              This room is locked by the host. A request has been sent to the host to admit you. Please hold on...
            </p>

            <div className="waiting-status-indicator">
              <Loader2 size={16} className="spinner text-accent" />
              <span>Waiting in lobby...</span>
            </div>

            <div className="waiting-actions">
              <button
                type="button"
                className="btn btn-secondary full-width-btn"
                onClick={onLeave}
              >
                <LogOut size={15} />
                <span>Cancel &amp; Leave</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
};
