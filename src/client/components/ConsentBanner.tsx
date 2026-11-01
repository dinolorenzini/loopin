import React, { useState } from "react";
import { Shield, Cookie, Settings, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useSettings } from "../hooks/useSettings";

interface ConsentBannerProps {
  onOpenPrivacyPolicy?: () => void;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({ onOpenPrivacyPolicy }) => {
  const { consent, saveConsent } = useSettings();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customPreferences, setCustomPreferences] = useState(consent.preferences ?? true);
  const [customHistory, setCustomHistory] = useState(consent.history ?? true);

  // If consent was already recorded, don't show the banner
  if (consent.timestamp > 0) {
    return null;
  }

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      preferences: true,
      history: true,
    });
  };

  const handleNecessaryOnly = () => {
    saveConsent({
      necessary: true,
      preferences: false,
      history: false,
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      necessary: true,
      preferences: customPreferences,
      history: customHistory,
    });
  };

  return (
    <div
      role="region"
      aria-label="Privacy and Local Storage Consent"
      className="consent-banner-wrapper"
    >
      <div className="consent-banner-card">
        <div className="consent-banner-main">
          <div className="consent-badge">
            <Cookie size={20} className="text-accent" />
          </div>

          <div className="consent-text-content">
            <div className="consent-title-row">
              <span className="consent-title">Privacy &amp; Storage Preferences</span>
              <span className="consent-eu-tag">EU ePrivacy &amp; GDPR Compliant</span>
            </div>
            <p className="consent-description">
              Loopin operates with <strong>zero tracking cookies</strong> and zero persistent databases. We use minimal browser <code>localStorage</code> solely to remember your chosen nickname, themes, and recent room shortcuts on this device. You can customize or reject non-essential storage below.
            </p>
          </div>

          <div className="consent-actions-row">
            <button
              type="button"
              className="btn-neutral-outline consent-action-btn"
              onClick={() => setIsCustomizing((prev) => !prev)}
              aria-expanded={isCustomizing}
            >
              <Settings size={14} />
              <span>{isCustomizing ? "Hide Options" : "Customize"}</span>
              {isCustomizing ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <button
              type="button"
              className="btn-neutral-outline consent-action-btn"
              onClick={handleNecessaryOnly}
            >
              <span>Strictly Necessary Only</span>
            </button>

            <button
              type="button"
              className="btn btn-primary consent-action-btn"
              onClick={handleAcceptAll}
            >
              <Check size={15} />
              <span>Accept All</span>
            </button>
          </div>
        </div>

        {/* Detailed customization drawer */}
        {isCustomizing && (
          <div className="consent-custom-drawer">
            <div className="consent-categories-grid">
              {/* Category 1: Strictly Necessary */}
              <div className="consent-category-card">
                <div className="consent-category-header">
                  <div className="category-meta">
                    <span className="category-name">Strictly Necessary</span>
                    <span className="category-tag-essential">Always Active</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    aria-label="Strictly Necessary Storage (Always Active)"
                    className="consent-toggle"
                  />
                </div>
                <p className="category-desc">
                  Required for real-time WebSocket connection routing and ephemeral session tokens. No persistent personally identifiable data is stored.
                </p>
                <div className="category-keys">
                  <code>sessionStorage (loopin_tab_user_id)</code>
                </div>
              </div>

              {/* Category 2: Preferences & Themes */}
              <div className="consent-category-card">
                <div className="consent-category-header">
                  <div className="category-meta">
                    <span className="category-name">Preferences &amp; Styling</span>
                    <span className="category-tag-optional">Optional</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={customPreferences}
                    onChange={(e) => setCustomPreferences(e.target.checked)}
                    id="consent-toggle-prefs"
                    className="consent-toggle cursor-pointer"
                  />
                </div>
                <p className="category-desc">
                  Saves your chosen display name, avatar color, obsidian themes, shaders, and sound notification mute states on this device.
                </p>
                <div className="category-keys">
                  <code>loopin_user_name</code>, <code>loopin_settings_v4</code>
                </div>
              </div>

              {/* Category 3: Room History */}
              <div className="consent-category-card">
                <div className="consent-category-header">
                  <div className="category-meta">
                    <span className="category-name">Recent Room History</span>
                    <span className="category-tag-optional">Optional</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={customHistory}
                    onChange={(e) => setCustomHistory(e.target.checked)}
                    id="consent-toggle-history"
                    className="consent-toggle cursor-pointer"
                  />
                </div>
                <p className="category-desc">
                  Maintains quick-access shortcuts to rooms you have recently visited on this browser so you can jump back easily.
                </p>
                <div className="category-keys">
                  <code>loopin_recent_rooms</code>
                </div>
              </div>
            </div>

            <div className="consent-drawer-footer">
              {onOpenPrivacyPolicy && (
                <button
                  type="button"
                  className="btn-text-link"
                  onClick={onOpenPrivacyPolicy}
                >
                  <Shield size={13} />
                  <span>Read Full Privacy Policy</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary consent-save-custom-btn"
                onClick={handleSaveCustom}
              >
                <Check size={14} />
                <span>Save Selected Preferences</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
