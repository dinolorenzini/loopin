import React, { useRef, useEffect, useState } from "react";
import { Dices, ArrowRight, Check, Palette, User as UserIcon } from "lucide-react";
import type { User } from "../../server/types";
import { USER_COLORS, generateRandomName, markUserOnboarded } from "../hooks/useUser";
import { LoopinLogo } from "./LoopinLogo";

interface OnboardingModalProps {
  isOpen: boolean;
  currentUser: User;
  onSave: (updated: Partial<Pick<User, "name" | "color">>) => void;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  currentUser,
  onSave,
  onComplete,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(currentUser.name);
  const [color, setColor] = useState(currentUser.color || USER_COLORS[0]);

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

  const handleRandomizeName = () => {
    const nextName = generateRandomName().slice(0, 16);
    setName(nextName);
  };

  const handleRandomizeColor = () => {
    const nextColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    setColor(nextColor);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().slice(0, 16);
    if (!cleanName) return;

    onSave({ name: cleanName, color });
    markUserOnboarded();
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="profile-dialog onboarding-dialog"
      aria-labelledby="onboarding-dialog-title"
      onCancel={(e) => e.preventDefault()} // Non-dismissible until identity chosen
    >
      <div className="profile-modal-content onboarding-content">
        <div className="profile-modal-header onboarding-header">
          <div className="modal-title-with-icon">
            <div className="onboarding-logo-badge">
              <LoopinLogo size={42} color={color} />
            </div>
            <div>
              <h2 id="onboarding-dialog-title" className="modal-title">Welcome to Loopin!</h2>
              <p className="modal-subtitle">Choose your display name and color to start chatting</p>
            </div>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="onboarding-preview-card">
          <span className="onboarding-preview-label">Preview in chat:</span>
          <div className="onboarding-preview-pill">
            <span className="user-color-dot" style={{ backgroundColor: color }} />
            <span className="onboarding-preview-name" style={{ color }}>
              {name || "Anonymous"}
            </span>
            <span className="onboarding-preview-badge">You</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Display Name Input with Dice Button */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="onboarding-display-name" className="form-label">
                Display Name
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
                id="onboarding-display-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 16))}
                maxLength={16}
                placeholder="Enter a display name..."
                className="text-input"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Color Selection Palette */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">
                <Palette size={13} style={{ marginRight: 4, display: "inline" }} /> Name Color
              </label>
              <button
                type="button"
                className="btn-text-link"
                onClick={handleRandomizeColor}
                title="Pick random color"
              >
                <Dices size={14} /> Random color
              </button>
            </div>
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

          <div className="modal-actions onboarding-actions">
            <button
              type="submit"
              className="btn btn-primary full-width-btn"
            >
              <span>Start Chatting</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
