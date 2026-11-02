import React, { useRef, useEffect, useState } from "react";
import { Dices, ArrowRight, Check, Palette, User as UserIcon, ShieldAlert, Sparkles, ShieldCheck } from "lucide-react";
import type { User } from "../../server/types";
import {
  USER_COLORS,
  generateRandomName,
  generateChildSafeName,
  markUserOnboarded,
  setUserAgeBracket,
  getUserAgeBracket,
  isCoppaChildMode,
} from "../hooks/useUser";
import { LoopinLogo } from "./LoopinLogo";
import type { AgeBracket } from "../types/compliance";

interface OnboardingModalProps {
  isOpen: boolean;
  currentUser: User;
  onSave: (updated: Partial<Pick<User, "name" | "color" | "complianceRole">>) => void;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  currentUser,
  onSave,
  onComplete,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<"age_gate" | "identity" | "blocked_under13">(() => {
    return getUserAgeBracket() ? "identity" : "age_gate";
  });
  const [ageBracket, setAgeBracket] = useState<AgeBracket>(() => {
    return getUserAgeBracket() || "16+";
  });
  const [isChildMode, setIsChildMode] = useState<boolean>(() => isCoppaChildMode());
  const [name, setName] = useState(currentUser.name);
  const [color, setColor] = useState(currentUser.color || USER_COLORS[0]);

  useEffect(() => {
    if (isOpen) {
      const existingBracket = getUserAgeBracket();
      if (!existingBracket) {
        setStep("age_gate");
      } else {
        setStep("identity");
        setAgeBracket(existingBracket);
        setIsChildMode(existingBracket === "under13");
      }
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

  const handleSelectAge = (bracket: AgeBracket) => {
    if (bracket === "under13") {
      setStep("blocked_under13");
      return;
    }
    setAgeBracket(bracket);
    setUserAgeBracket(bracket);
    setIsChildMode(false);
    setStep("identity");
  };

  const handleRandomizeName = () => {
    if (isChildMode) {
      setName(generateChildSafeName().slice(0, 16));
    } else {
      setName(generateRandomName().slice(0, 16));
    }
  };

  const handleRandomizeColor = () => {
    const nextColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    setColor(nextColor);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().slice(0, 16);
    if (!cleanName) return;

    onSave({
      name: cleanName,
      color,
      complianceRole: isChildMode ? "child" : "standard",
    });
    markUserOnboarded();
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="profile-dialog onboarding-dialog"
      aria-labelledby="onboarding-dialog-title"
      onCancel={(e) => e.preventDefault()} // Non-dismissible until identity & compliance set
    >
      <div className="profile-modal-content onboarding-content">
        <div className="profile-modal-header onboarding-header">
          <div className="modal-title-with-icon">
            <div className="onboarding-logo-badge">
              <LoopinLogo size={42} color={color} />
            </div>
            <div>
              <h2 id="onboarding-dialog-title" className="modal-title">
                {step === "age_gate" ? "Welcome to Loopin" : "Choose Your Chat Identity"}
              </h2>
              <p className="modal-subtitle">
                {step === "age_gate"
                  ? "Privacy-first, ephemeral real-time collaboration"
                  : "Private in-memory rooms &bull; Zero tracking logs"}
              </p>
            </div>
          </div>
        </div>

        {/* STEP 1: NEUTRAL AGE GATE (COPPA & GDPR ART 8) */}
        {step === "age_gate" && (
          <div className="onboarding-age-gate-step">
            <div className="age-gate-callout">
              <ShieldCheck size={18} className="text-accent" />
              <span>
                To ensure compliance with <strong>COPPA</strong> and <strong>EU Digital Consent Laws</strong>, please select your age bracket. Loopin requires all users to be at least 13 years old.
              </span>
            </div>

            <p className="age-gate-label">Please select your age:</p>

            <div className="age-options-grid">
              <button
                type="button"
                className="age-option-card"
                onClick={() => handleSelectAge("13-15")}
              >
                <div className="age-card-icon-wrap teen-badge">
                  <ShieldAlert size={20} />
                </div>
                <div className="age-card-text">
                  <span className="age-card-title">13 to 15 Years Old</span>
                  <span className="age-card-sub">Minor Safeguards &bull; PII leak alerts &bull; Privacy-first collaboration</span>
                </div>
              </button>

              <button
                type="button"
                className="age-option-card"
                onClick={() => handleSelectAge("16+")}
              >
                <div className="age-card-icon-wrap adult-badge">
                  <UserIcon size={20} />
                </div>
                <div className="age-card-text">
                  <span className="age-card-title">16 Years or Older</span>
                  <span className="age-card-sub">Standard Mode &bull; Ephemeral volatile RAM &bull; Full customization</span>
                </div>
              </button>

              <button
                type="button"
                className="age-option-card age-option-blocked"
                onClick={() => handleSelectAge("under13")}
              >
                <div className="age-card-icon-wrap child-badge">
                  <ShieldAlert size={20} />
                </div>
                <div className="age-card-text">
                  <span className="age-card-title">Under 13 Years Old</span>
                  <span className="age-card-sub">Not permitted on Loopin (Strict COPPA Policy)</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP: BLOCKED UNDER 13 (COPPA RESTRICTION) */}
        {step === "blocked_under13" && (
          <div className="onboarding-blocked-step">
            <div className="blocked-icon-box">
              <ShieldAlert size={44} className="text-danger" />
            </div>
            <h3 className="blocked-title">Age Requirement Not Met</h3>
            <p className="blocked-desc">
              Loopin requires all users to be at least <strong>13 years of age</strong>. To comply with the Children&apos;s Online Privacy Protection Act (COPPA), children under 13 are not permitted to use this service.
            </p>
            <div className="blocked-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep("age_gate")}
              >
                <span>&larr; I made a mistake, select again</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: IDENTITY SETUP WITH COMPLIANCE GUARDS */}
        {step === "identity" && (
          <>
            {/* Live Preview Card */}
            <div className="onboarding-preview-card">
              <span className="onboarding-preview-label">Preview in chat:</span>
              <div className="onboarding-preview-pill">
                <span className="user-color-dot" style={{ backgroundColor: color }} />
                <span className="onboarding-preview-name" style={{ color }}>
                  {name || "Anonymous"}
                </span>
                <span className="onboarding-preview-badge">
                  {isChildMode ? "🛡️ Child Safe" : "You"}
                </span>
              </div>
            </div>

            {/* COPPA Banner if Child Mode Active */}
            {isChildMode && (
              <div className="coppa-safety-pill">
                <Sparkles size={14} className="text-accent" />
                <span>
                  <strong>COPPA Safe Mode Active:</strong> Under 13 child accounts use friendly pre-screened animal aliases to prevent accidental sharing of real names or personal information.
                </span>
              </div>
            )}

            {/* EU Minor Banner */}
            {ageBracket === "13-15" && (
              <div className="teen-safety-pill">
                <ShieldAlert size={14} className="text-accent" />
                <span>
                  <strong>EU Minor Privacy:</strong> Please do not use your real surname, school name, or personal details as your display handle.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="profile-form">
              {/* Display Name Input with Dice Button */}
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="onboarding-display-name" className="form-label">
                    Display Name {isChildMode && "(Child-Safe Alias)"}
                  </label>
                  <button
                    type="button"
                    className="btn-text-link"
                    onClick={handleRandomizeName}
                    title="Generate another alias"
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
                    onChange={(e) => {
                      if (!isChildMode) {
                        setName(e.target.value.slice(0, 16));
                      }
                    }}
                    maxLength={16}
                    placeholder="Enter a display name..."
                    className="text-input"
                    readOnly={isChildMode}
                    autoFocus={!isChildMode}
                    required
                  />
                </div>
                {isChildMode && (
                  <span className="form-helper-text">
                    Custom typing is disabled for safety. Click <strong>&ldquo;Re-roll name&rdquo;</strong> to pick a different alias.
                  </span>
                )}
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
                  type="button"
                  className="btn-neutral-outline"
                  onClick={() => setStep("age_gate")}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary full-width-btn"
                >
                  <span>Start Chatting</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
};
