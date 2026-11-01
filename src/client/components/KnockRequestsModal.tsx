import React, { useRef, useEffect } from "react";
import { UserCheck, X, Check, Clock, ShieldAlert } from "lucide-react";
import type { PendingJoinRequest } from "../../server/types";

interface KnockRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: PendingJoinRequest[];
  onApprove: (userId: string) => void;
  onDeny: (userId: string) => void;
  onApproveAll: () => void;
}

export const KnockRequestsModal: React.FC<KnockRequestsModalProps> = ({
  isOpen,
  onClose,
  requests,
  onApprove,
  onDeny,
  onApproveAll,
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
      className="profile-dialog knock-dialog"
      aria-labelledby="knock-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="profile-modal-content knock-modal-content">
        <div className="profile-modal-header">
          <div className="modal-title-with-icon">
            <div className="knock-badge-icon">
              <UserCheck size={20} className="text-accent" />
            </div>
            <div>
              <h2 id="knock-dialog-title" className="modal-title">
                Requests to Join Room ({requests.length})
              </h2>
              <p className="modal-subtitle">
                Host Moderation &bull; Review and admit students or participants
              </p>
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

        {requests.length === 0 ? (
          <div className="knock-empty-state">
            <Clock size={32} className="text-muted" />
            <p className="knock-empty-text">No pending join requests right now.</p>
          </div>
        ) : (
          <div className="knock-requests-body">
            <div className="knock-list-header">
              <span className="knock-count-label">
                Waiting participants ({requests.length}):
              </span>
              {requests.length > 1 && (
                <button
                  type="button"
                  className="btn-neutral-outline btn-admit-all"
                  onClick={onApproveAll}
                >
                  <Check size={14} />
                  <span>Admit All</span>
                </button>
              )}
            </div>

            <div className="knock-requests-list">
              {requests.map((req) => (
                <div key={req.id} className="knock-request-card">
                  <div className="knock-user-info">
                    <span
                      className="knock-user-dot"
                      style={{ backgroundColor: req.color }}
                    />
                    <div className="knock-user-text">
                      <span className="knock-user-name" style={{ color: req.color }}>
                        {req.name}
                      </span>
                      <span className="knock-user-time">
                        Waiting since{" "}
                        {new Date(req.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="knock-actions-row">
                    <button
                      type="button"
                      className="btn-knock-deny"
                      onClick={() => onDeny(req.id)}
                      title="Decline request"
                      aria-label={`Decline ${req.name}`}
                    >
                      <X size={15} />
                      <span>Deny</span>
                    </button>
                    <button
                      type="button"
                      className="btn-knock-admit"
                      onClick={() => onApprove(req.id)}
                      title="Admit into room"
                      aria-label={`Admit ${req.name}`}
                    >
                      <Check size={15} />
                      <span>Admit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions knock-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
};
