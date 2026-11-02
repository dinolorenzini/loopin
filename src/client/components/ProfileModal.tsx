import React, { useRef, useEffect, useState } from "react";
import { User as UserIcon, Check, X, Palette, Dices, ShieldCheck } from "lucide-react";
import type { User } from "../../server/types";
import { USER_COLORS, isCoppaChildMode, generateChildSafeName } from "../hooks/useUser";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSave: (updated: Partial<Pick<User, "name" | "color">>) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(currentUser.name);
  const [color, setColor] = useState(currentUser.color || USER_COLORS[0]);
  const isChildMode = isCoppaChildMode();

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setColor(currentUser.color || USER_COLORS[0]);
      if (dialogRef.current && !dialogRef.current.open) {
        dialogRef.current.showModal();
      }
    } else {
      if (dialogRef.current && dialogRef.current.open) {
        dialogRef.current.close();
      }
    }
  }, [isOpen, currentUser]);

  const handleRandomizeChildName = () => {
    setName(generateChildSafeName().slice(0, 16));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (cleanName) {
      onSave({ name: cleanName, color });
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="profile-dialog"
      aria-labelledby="profile-dialog-title"
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
            <div className="profile-preview-dot" style={{ backgroundColor: color }} />
            <div>
              <h2 id="profile-dialog-title" className="modal-title">Edit Identity</h2>
              <p className="modal-subtitle">
                {isChildMode ? "COPPA Child Safe Account" : "Your display name and name color in this room"}
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

        {isChildMode && (
          <div className="coppa-safety-pill" style={{ margin: "0 1.25rem 1rem" }}>
            <ShieldCheck size={14} className="text-accent" />
            <span>
              <strong>COPPA Protection Active:</strong> Custom names are restricted to pre-screened safe aliases.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="user-display-name" className="form-label">
                Display Name {isChildMode && "(Safe Alias)"}
              </label>
              {isChildMode && (
                <button
                  type="button"
                  className="btn-text-link"
                  onClick={handleRandomizeChildName}
                  title="Generate another alias"
                >
                  <Dices size={14} /> Re-roll alias
                </button>
              )}
            </div>
            <div className="input-with-icon">
              <UserIcon size={16} className="input-icon" />
              <input
                id="user-display-name"
                type="text"
                value={name}
                onChange={(e) => {
                  if (!isChildMode) {
                    setName(e.target.value.slice(0, 16));
                  }
                }}
                maxLength={16}
                readOnly={isChildMode}
                placeholder="Enter your name (max 16)..."
                className="text-input"
                autoFocus={!isChildMode}
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

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim()}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
