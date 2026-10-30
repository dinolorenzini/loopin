import React, { useState, useEffect } from "react";
import { Sliders, X, ArrowUpRight } from "lucide-react";

interface SettingsHintPopoverProps {
  onOpenSettings: () => void;
}

export const SettingsHintPopover: React.FC<SettingsHintPopoverProps> = ({ onOpenSettings }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the hint
    try {
      const dismissed = localStorage.getItem("loopin_settings_hint_dismissed");
      if (!dismissed) {
        // Show after a brief gentle delay so the UI settles
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    try {
      localStorage.setItem("loopin_settings_hint_dismissed", "true");
    } catch {}
  };

  const handleOpen = () => {
    handleDismiss();
    onOpenSettings();
  };

  if (!isVisible) return null;

  return (
    <aside
      className="settings-hint-popover"
      aria-label="Settings notification"
      role="complementary"
    >
      <div className="settings-hint-arrow" aria-hidden="true" />
      <div className="settings-hint-header">
        <div className="settings-hint-badge">
          <Sliders size={14} className="text-accent" />
        </div>
        <span className="settings-hint-title">Personalize Loopin</span>
        <button
          type="button"
          className="settings-hint-close-btn"
          onClick={handleDismiss}
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X size={13} />
        </button>
      </div>

      <p className="settings-hint-body">
        Use <strong>Settings</strong> to customize themes, animated background shaders, sound effects, and privacy.
      </p>

      <div className="settings-hint-actions">
        <button
          type="button"
          className="settings-hint-action-btn"
          onClick={handleOpen}
        >
          <span>Open Settings</span>
          <ArrowUpRight size={13} />
        </button>
      </div>
    </aside>
  );
};
