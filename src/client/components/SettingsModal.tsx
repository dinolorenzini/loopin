import React, { useRef, useEffect, useState } from "react";
import {
  Settings,
  X,
  Palette,
  Sparkles,
  Layout,
  ZapOff,
  Trash2,
  Check,
  AlertTriangle,
  Sliders,
  Gauge,
  Eye,
} from "lucide-react";
import {
  useSettings,
  THEME_PRESETS,
  BACKGROUND_OPTIONS,
  type MessageStyle,
} from "../hooks/useSettings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { settings, updateSetting, clearAllData } = useSettings();
  const [customColor, setCustomColor] = useState(settings.themeColor);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomColor(settings.themeColor);
      setConfirmClear(false);
      if (dialogRef.current && !dialogRef.current.open) {
        dialogRef.current.showModal();
      }
    } else {
      if (dialogRef.current && dialogRef.current.open) {
        dialogRef.current.close();
      }
    }
  }, [isOpen, settings.themeColor]);

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomColor(val);
    updateSetting("themeColor", val);
  };

  return (
    <dialog
      ref={dialogRef}
      className="profile-dialog settings-dialog"
      aria-labelledby="settings-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="profile-modal-content settings-modal-content">
        <div className="profile-modal-header">
          <div className="modal-title-with-icon">
            <div className="settings-icon-badge">
              <Settings size={20} color="var(--primary-accent)" />
            </div>
            <div>
              <h2 id="settings-dialog-title" className="modal-title">Preferences & Appearance</h2>
              <p className="modal-subtitle">Customize theme, shaders, backgrounds, and layout</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="settings-scroll-area">
          {/* 1. Theme Color Accent */}
          <section className="settings-section">
            <div className="settings-section-header">
              <Palette size={15} className="text-accent" />
              <span className="settings-section-title">Brand Theme Accent</span>
            </div>
            <p className="settings-section-desc">Single static brand color for Loopin icons, logos, and UI</p>

            <div className="theme-presets-grid">
              {THEME_PRESETS.map((t) => (
                <button
                  key={t.color}
                  type="button"
                  className={`theme-swatch-btn ${settings.themeColor.toLowerCase() === t.color.toLowerCase() ? "selected" : ""}`}
                  style={{ backgroundColor: t.color }}
                  onClick={() => {
                    updateSetting("themeColor", t.color);
                    setCustomColor(t.color);
                  }}
                  title={t.name}
                >
                  {settings.themeColor.toLowerCase() === t.color.toLowerCase() && (
                    <Check size={14} color="#000" strokeWidth={3} />
                  )}
                </button>
              ))}

              <label className="custom-color-picker-label" title="Custom Hex Color">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="custom-color-input"
                />
                <span className="custom-color-indicator" style={{ backgroundColor: customColor }} />
              </label>
            </div>
          </section>

          {/* 2. Chat Background */}
          <section className="settings-section">
            <div className="settings-section-header">
              <Sparkles size={15} className="text-accent" />
              <span className="settings-section-title">Background Style</span>
            </div>
            <p className="settings-section-desc">Live-updating interactive backgrounds for Home and Chat</p>

            <div className="background-options-grid">
              {BACKGROUND_OPTIONS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  className={`bg-option-card ${settings.background === bg.id ? "selected" : ""}`}
                  onClick={() => updateSetting("background", bg.id)}
                >
                  <div className="bg-option-info">
                    <div className="bg-option-name-row">
                      <span className="bg-option-name">{bg.name}</span>
                      {bg.isAnimated ? (
                        <span className="badge-animated">Animated</span>
                      ) : (
                        <span className="badge-static">Static</span>
                      )}
                    </div>
                    <span className="bg-option-desc">{bg.description}</span>
                  </div>
                  {settings.background === bg.id && (
                    <Check size={16} className="text-accent bg-card-check" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* 3. Background Controls: Darkness, Blur & Shader Speed */}
          <section className="settings-section settings-controls-box">
            <div className="settings-section-header">
              <Sliders size={15} className="text-accent" />
              <span className="settings-section-title">Background Tuning & Shaders</span>
            </div>

            <div className="sliders-grid">
              {/* Darkness Dim Slider (Bug 2) */}
              <div className="slider-control-group">
                <div className="slider-label-row">
                  <span className="slider-title">
                    <Eye size={13} /> Darkness Overlay
                  </span>
                  <span className="slider-val">{Math.round(settings.bgDim * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.95"
                  step="0.05"
                  value={settings.bgDim}
                  onChange={(e) => updateSetting("bgDim", parseFloat(e.target.value))}
                  className="settings-range-slider"
                />
              </div>

              {/* Blur Slider (Bug 2) */}
              <div className="slider-control-group">
                <div className="slider-label-row">
                  <span className="slider-title">Background Blur</span>
                  <span className="slider-val">{settings.bgBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={settings.bgBlur}
                  onChange={(e) => updateSetting("bgBlur", parseInt(e.target.value, 10))}
                  className="settings-range-slider"
                />
              </div>

              {/* Shader Speed Slider (Feature) */}
              <div className="slider-control-group">
                <div className="slider-label-row">
                  <span className="slider-title">
                    <Gauge size={13} /> Animation Speed
                  </span>
                  <span className="slider-val">{settings.shaderSpeed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="2.5"
                  step="0.25"
                  value={settings.shaderSpeed}
                  onChange={(e) => updateSetting("shaderSpeed", parseFloat(e.target.value))}
                  className="settings-range-slider"
                />
              </div>
            </div>
          </section>

          {/* 4. Chat Messages Style */}
          <section className="settings-section">
            <div className="settings-section-header">
              <Layout size={15} className="text-accent" />
              <span className="settings-section-title">Chat Message Style</span>
            </div>
            <div className="message-style-toggle-row">
              {(
                [
                  { id: "modern", label: "Modern", desc: "Compact rounded bubbles" },
                  { id: "spacious", label: "Spacious", desc: "Airy, classic padding" },
                  { id: "inline", label: "Inline", desc: "Discord borderless text" },
                ] as { id: MessageStyle; label: string; desc: string }[]
              ).map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={`msg-style-btn ${settings.messageStyle === style.id ? "active" : ""}`}
                  onClick={() => updateSetting("messageStyle", style.id)}
                >
                  <span className="msg-style-label">{style.label}</span>
                  <span className="msg-style-desc">{style.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 5. No Animations */}
          <section className="settings-section">
            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <div className="settings-section-header">
                  <ZapOff size={15} className="text-accent" />
                  <span className="settings-section-title">No Animations</span>
                </div>
                <p className="settings-section-desc">
                  Completely stops all background shaders and transitions for maximum battery and Chromebook performance
                </p>
              </div>
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={settings.noAnimations}
                  onChange={(e) => updateSetting("noAnimations", e.target.checked)}
                  className="switch-input"
                />
                <span className="switch-slider" />
              </label>
            </div>
          </section>

          {/* 6. Quick Clear Local Data */}
          <section className="settings-section settings-danger-zone">
            <div className="settings-section-header">
              <Trash2 size={15} className="text-danger" />
              <span className="settings-section-title text-danger">Local Data & Storage</span>
            </div>
            <p className="settings-section-desc">
              Instantly wipe all local profiles, recent rooms, and settings from this browser.
            </p>

            {confirmClear ? (
              <div className="confirm-clear-box">
                <AlertTriangle size={16} className="text-danger" />
                <span>Are you sure? This resets all local data immediately.</span>
                <div className="confirm-clear-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setConfirmClear(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={clearAllData}
                  >
                    Yes, Clear Everything
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-secondary clear-data-btn"
                onClick={() => setConfirmClear(true)}
              >
                <Trash2 size={14} /> Quick Clear All Local Data
              </button>
            )}
          </section>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
};
