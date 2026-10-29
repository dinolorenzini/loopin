import React, { useRef, useEffect, useState } from "react";
import { User as UserIcon, Check, X } from "lucide-react";
import type { User } from "../../server/types";
import { USER_COLORS } from "../hooks/useUser";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSave: (updated: Partial<Pick<User, "name" | "color" | "avatar">>) => void;
}

const AVATAR_OPTIONS = [
  "⚡", "✨", "🚀", "🪐", "🦊", "🐯", "👾", "🥑", "💎", "🔥", "🔮", "🌊",
  "🐱", "🐶", "🦁", "🐼", "🦄", "🌈", "🍕", "🍔", "☕", "🎉", "👑", "🎯"
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(currentUser.name);
  const [color, setColor] = useState(currentUser.color);
  const [avatar, setAvatar] = useState(currentUser.avatar || "⚡");

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setColor(currentUser.color);
      setAvatar(currentUser.avatar || "⚡");
      if (dialogRef.current && !dialogRef.current.open) {
        dialogRef.current.showModal();
      }
    } else {
      if (dialogRef.current && dialogRef.current.open) {
        dialogRef.current.close();
      }
    }
  }, [isOpen, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (cleanName) {
      onSave({ name: cleanName, color, avatar });
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
        // Light dismiss when backdrop is clicked
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="profile-modal-content">
        <div className="profile-modal-header">
          <div className="modal-title-with-icon">
            <div className="profile-preview-avatar" style={{ backgroundColor: color }}>
              <span>{avatar}</span>
            </div>
            <div>
              <h2 id="profile-dialog-title" className="modal-title">Customize Profile</h2>
              <p className="modal-subtitle">Your identity in this room</p>
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

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="user-display-name" className="form-label">
              Display Name
            </label>
            <div className="input-with-icon">
              <UserIcon size={16} className="input-icon" />
              <input
                id="user-display-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={32}
                placeholder="Enter your name..."
                className="text-input"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Avatar Emoji</label>
            <div className="avatar-selection-grid">
              {AVATAR_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`avatar-option-btn ${avatar === em ? "selected" : ""}`}
                  onClick={() => setAvatar(em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Badge Color</label>
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
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
