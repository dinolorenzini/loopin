import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Sliders, X, ArrowUpRight } from "lucide-react";

export const SETTINGS_HINT_STORAGE_KEY = "loopin_settings_hint_dismissed";

export function isSettingsHintDismissed(): boolean {
  try {
    if (typeof window === "undefined") return true;
    return (
      localStorage.getItem(SETTINGS_HINT_STORAGE_KEY) === "true" ||
      sessionStorage.getItem(SETTINGS_HINT_STORAGE_KEY) === "true"
    );
  } catch {
    return false;
  }
}

export function dismissSettingsHintLocally(): void {
  try {
    localStorage.setItem(SETTINGS_HINT_STORAGE_KEY, "true");
  } catch {}
  try {
    sessionStorage.setItem(SETTINGS_HINT_STORAGE_KEY, "true");
  } catch {}
}

interface SettingsHintPopoverProps {
  onOpenSettings: () => void;
}

export const SettingsHintPopover: React.FC<SettingsHintPopoverProps> = ({ onOpenSettings }) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => isSettingsHintDismissed());
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const popoverRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    // If already dismissed, stay closed permanently
    if (isSettingsHintDismissed()) {
      setIsDismissed(true);
      return;
    }

    // Show after a brief gentle delay so the UI settles
    const timer = setTimeout(() => {
      if (!isSettingsHintDismissed()) {
        setIsVisible(true);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsVisible(false);
    setIsDismissed(true);
    dismissSettingsHintLocally();
  };

  const handleOpen = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleDismiss();
    onOpenSettings();
  };

  // Dismiss on outside click, touch, scroll, or Escape key
  useEffect(() => {
    if (!isVisible || isDismissed) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        handleDismiss();
      }
    };

    const handleScroll = () => {
      handleDismiss();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    // Auto-timeout after 9 seconds of inactivity so it never permanently obstructs the view
    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, 9000);

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(autoDismissTimer);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisible, isDismissed]);

  // If dismissed or not visible or not mounted yet, render nothing
  if (isDismissed || !isVisible || !mounted || typeof document === "undefined") {
    return null;
  }

  const content = (
    <aside
      ref={popoverRef}
      className="settings-hint-popover"
      aria-label="Settings notification"
      role="complementary"
    >
      <div className="settings-hint-arrow" aria-hidden="true" />
      <div className="settings-hint-header">
        <div className="settings-hint-badge">
          <Sliders size={13} className="text-accent" />
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
        Tap <strong>Settings</strong> to customize themes, animated backgrounds, and privacy.
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

  return createPortal(content, document.body);
};
