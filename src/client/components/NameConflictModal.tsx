import React, { useRef, useEffect, useState } from "react";
import { AlertTriangle, Dices, ArrowRight, Check, Palette, User as UserIcon, LogOut } from "lucide-react";
import type { User } from "../../server/types";
import { USER_COLORS, generateRandomName } from "../hooks/useUser";
import type { NameConflictInfo } from "../hooks/useChatRoom";

interface NameConflictModalProps {
  isOpen: boolean;
  conflict: NameConflictInfo | null;
  roomId: string;
  currentUser: User;
  onResolve: (newName: string, newColor?: string) => void;
  onLeave: () => void;
}

export const NameConflictModal: React.FC<NameConflictModalProps> = ({
  isOpen,
  conflict,
  roomId,
  currentUser,
  onResolve,
  onLeave,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(conflict?.suggestedName || "");
  const [color, setColor] = useState(currentUser.color || USER_COLORS[0]);

  useEffect(() => {
    if (isOpen && conflict) {
      setName(conflict.suggestedName || generateRandomName().slice(0, 16));
      setColor(currentUser.color || USER_COLORS[0]);
      if (dialogRef.current && !dialogRef.current.open) {
        dialogRef.current.showModal();
      }
    } else {
      if (dialogRef.current && dialogRef.current.open) {
        dialogRef.current.close();
      }
    }
  }, [isOpen, conflict, currentUser]);

  const handleRandomizeName = () => {
    const nextName = generateRandomName().slice(0, 16);
    setName(nextName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().slice(0, 16);
    if (!cleanName) return;
    onResolve(cleanName, color);
  };

  if (!isOpen || !conflict) return null;

  return (
    <dialog
      ref={dialogRef}
      className="profile-dialog name-conflict-dialog"
      aria-labelledby="conflict-dialog-title"
      onCancel={(e) => e.preventDefault()} // Force resolution or leaving
    >
      <div className="profile-modal-content">
        <div className="profile-modal-header conflict-header">
          <div className="modal-title-with-icon">
            <div className="conflict-warning-badge">
              <AlertTriangle size={20} color="#f59e0b" />
            </div>
            <div>
              <h2 id="conflict-dialog-title" className="modal-title">Name Already Taken</h2>
              <p className="modal-subtitle">
                Another user in #{roomId} is already named <strong className="conflict-taken-name">"{conflict.name}"</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="conflict-alert-box">
          <span>Loopin requires unique names in each room. Please choose a different name to join #{roomId}.</span>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="conflict-display-name" className="form-label">
                Choose a Different Name
              </label>
              <button
                type="button"
                className="btn-text-link"
                onClick={handleRandomizeName}
                title="Generate another random name"
              >
                <Dices size={14} /> Re-roll name
              </button>
            </div>
            <div className="input-with-icon">
              <UserIcon size={16} className="input-icon" />
              <input
                id="conflict-display-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 16))}
                maxLength={16}
                placeholder="Enter a unique name..."
                className="text-input"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Palette size={13} style={{ marginRight: 4, display: "inline" }} /> Name Color
            </label>
            <div className="color-selection-row">
              {USER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch-btn ${color === c ? "selected" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                >
                  {color === c && <Check size={14} color="#000" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions conflict-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onLeave}
              title="Leave and return to home page"
            >
              <LogOut size={15} />
              <span>Leave Room</span>
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <span>Join with this Name</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
