import React, { useRef, useEffect, useState, useId } from "react";
import {
  X,
  Palette,
  Image as ImageIcon,
  MessageSquare,
  User as UserIcon,
  Volume2,
  Sliders,
  Shield,
  Eye,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Check,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import {
  useSettings,
  THEME_PRESETS,
  BACKGROUND_LIST,
  getAccessibleTextColor,
  DEFAULT_BG_CONFIG,
  type SettingsCategory,
  type BackgroundType,
  type ThemeMode,
  type MessageStyle,
} from "../hooks/useSettings";
import { USER_COLORS } from "../hooks/useUser";
import { ChatBackground } from "./ChatBackground";
import type { User } from "../../server/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: SettingsCategory;
  currentUser?: User;
  onUpdateUser?: (updates: Partial<Pick<User, "name" | "color">>) => void;
  roomUsers?: User[];
  triggerRef?: React.RefObject<HTMLElement | null>;
}

interface CustomRangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  defaultValue: number;
  onChange: (val: number) => void;
  onReset: () => void;
}

const CustomRangeSlider: React.FC<CustomRangeSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  defaultValue,
  onChange,
  onReset,
}) => {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="slider-item-row">
      <div className="slider-header-row">
        <label className="slider-name-label">{label}</label>
        <div className="slider-meta-group">
          <span className="slider-readable-value">{displayValue}</span>
          {value !== defaultValue && (
            <button
              type="button"
              className="slider-reset-tiny-btn"
              onClick={onReset}
              title="Reset this slider"
              aria-label={`Reset ${label}`}
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="range-input-track-wrap">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="custom-range-slider"
          style={{
            background: `linear-gradient(to right, var(--primary-accent) 0%, var(--primary-accent) ${percent}%, var(--border-color) ${percent}%, var(--border-color) 100%)`,
          }}
          aria-label={label}
        />
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialCategory,
  currentUser,
  onUpdateUser,
  roomUsers = [],
  triggerRef,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentPaneRef = useRef<HTMLDivElement>(null);

  const {
    settings,
    updateSetting,
    updateBgCustom,
    resetBgCustom,
    randomizeBgCustom,
    resetAllDefaults,
    clearAllData,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<SettingsCategory>(() => {
    return initialCategory || settings.activeCategory || "appearance";
  });

  const [isPeek, setIsPeek] = useState<boolean>(settings.isPeek || false);
  const [hoveredBg, setHoveredBg] = useState<BackgroundType | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Profile Form state
  const [profileName, setProfileName] = useState(currentUser?.name || "");
  const [profileColor, setProfileColor] = useState(currentUser?.color || USER_COLORS[0]);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setActiveTab(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileColor(currentUser.color || USER_COLORS[0]);
    }
  }, [currentUser]);

  // Open / Close management with focus trapping and restore
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setConfirmClear(false);
      if (!isPeek && !dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      triggerRef?.current?.focus();
    }
  }, [isOpen, isPeek, triggerRef]);

  // Handle Tab Switch & Remember
  const handleSelectTab = (tab: SettingsCategory) => {
    setActiveTab(tab);
    updateSetting("activeCategory", tab);
    if (contentPaneRef.current) {
      contentPaneRef.current.scrollTop = 0;
    }
  };

  const handleTogglePeek = () => {
    const nextPeek = !isPeek;
    setIsPeek(nextPeek);
    updateSetting("isPeek", nextPeek);
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (nextPeek) {
      if (dialog.open) dialog.close();
    } else {
      if (!dialog.open) dialog.showModal();
    }
  };

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Profile Save with Validation
  const handleProfileNameChange = (val: string) => {
    setProfileName(val);
    const clean = val.trim();
    if (!clean) {
      setProfileError("Display name cannot be empty.");
    } else if (clean.length > 16) {
      setProfileError("Name cannot exceed 16 characters.");
    } else {
      const isDuplicate = roomUsers.some(
        (u) => u.id !== currentUser?.id && u.name.toLowerCase() === clean.toLowerCase()
      );
      if (isDuplicate) {
        setProfileError("Someone in this room already uses this name.");
      } else {
        setProfileError(null);
      }
    }
  };

  const handleApplyProfile = () => {
    const clean = profileName.trim();
    if (!clean || profileError) return;
    if (onUpdateUser) {
      onUpdateUser({ name: clean, color: profileColor });
    }
  };

  const selectedBgId = settings.background;
  const currentBgConfig = settings.bgCustom[selectedBgId] || DEFAULT_BG_CONFIG[selectedBgId];
  const defaultBgConfig = DEFAULT_BG_CONFIG[selectedBgId];

  const categories: { id: SettingsCategory; label: string; icon: LucideIcon }[] = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "background", label: "Background", icon: ImageIcon },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "sound", label: "Sound & Notifications", icon: Volume2 },
    { id: "accessibility", label: "Accessibility & Performance", icon: Sliders },
    { id: "privacy", label: "Privacy & Data", icon: Shield },
  ];

  if (!isOpen) return null;

  const modalInner = (
    <div className={`settings-box-container ${isPeek ? "peek-mode" : "dialog-mode"}`}>
      {/* Header */}
      <div className="settings-header-bar">
        <div className="settings-header-left">
          <h2 id="settings-dialog-title" className="settings-modal-title">
            Settings
          </h2>
          {isPeek && (
            <div className="peek-category-select-wrap">
              <select
                value={activeTab}
                onChange={(e) => handleSelectTab(e.target.value as SettingsCategory)}
                className="peek-category-dropdown"
                aria-label="Select settings category"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="peek-select-arrow" />
            </div>
          )}
        </div>

        <div className="settings-header-right">
          <button
            type="button"
            className={`settings-tool-btn ${isPeek ? "active" : ""}`}
            onClick={handleTogglePeek}
            title={isPeek ? "Expand to full dialog" : "Peek chat (dock to left)"}
            aria-label={isPeek ? "Expand to full dialog" : "Peek chat live"}
          >
            {isPeek ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            <span className="tool-btn-text">{isPeek ? "Expand" : "Peek"}</span>
          </button>

          <button
            type="button"
            className="settings-close-icon-btn"
            onClick={onClose}
            title="Close Settings (Esc)"
            aria-label="Close Settings"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="settings-body-split">
        {/* Left Category Rail (Desktop Full Mode) */}
        {!isPeek && (
          <nav className="settings-category-rail" aria-label="Settings categories">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`rail-category-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectTab(cat.id)}
                  aria-selected={isSelected}
                  role="tab"
                >
                  <Icon size={16} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Content Pane (Scrollable) */}
        <div className="settings-content-pane" ref={contentPaneRef}>
          {/* 1. APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="settings-category-view">
              <div className="pane-section">
                <h3 className="section-title">Accent color</h3>
                <p className="section-desc">Primary color for buttons, selections, and links.</p>

                <div className="theme-swatches-grid">
                  {THEME_PRESETS.map((t) => {
                    const isSelected = settings.themeColor.toLowerCase() === t.color.toLowerCase();
                    return (
                      <button
                        key={t.color}
                        type="button"
                        className={`theme-color-swatch ${isSelected ? "selected" : ""}`}
                        style={{ backgroundColor: t.color }}
                        onClick={() => updateSetting("themeColor", t.color)}
                        title={t.name}
                        aria-label={`Accent ${t.name}`}
                      >
                        {isSelected && <Check size={14} color="#09090b" strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                  <label className="custom-hex-swatch-label" title="Custom Hex Color">
                    <input
                      type="color"
                      value={settings.themeColor}
                      onChange={(e) => updateSetting("themeColor", e.target.value)}
                      className="custom-hex-hidden-input"
                    />
                    <span
                      className="custom-hex-swatch-circle"
                      style={{ backgroundColor: settings.themeColor }}
                    />
                  </label>
                </div>
              </div>

              <div className="pane-section">
                <h3 className="section-title">Color theme</h3>
                <p className="section-desc">Select dark or light neutral surfaces.</p>
                <div className="theme-mode-row">
                  {(
                    [
                      { id: "dark", label: "Dark" },
                      { id: "light", label: "Light" },
                    ] as { id: ThemeMode; label: string }[]
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`theme-mode-pill-btn ${settings.themeMode === m.id ? "active" : ""}`}
                      onClick={() => updateSetting("themeMode", m.id)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pane-section">
                <h3 className="section-title">Message style</h3>
                <p className="section-desc">Density and bubble appearance in chat.</p>
                <div className="option-choice-grid">
                  {(
                    [
                      { id: "modern", label: "Modern", desc: "Compact rounded bubbles" },
                      { id: "spacious", label: "Spacious", desc: "Airy classic padding" },
                      { id: "inline", label: "Inline", desc: "Borderless chat stream" },
                    ] as { id: MessageStyle; label: string; desc: string }[]
                  ).map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      className={`option-choice-card ${settings.messageStyle === style.id ? "selected" : ""}`}
                      onClick={() => updateSetting("messageStyle", style.id)}
                    >
                      <span className="choice-card-title">{style.label}</span>
                      <span className="choice-card-desc">{style.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. BACKGROUND */}
          {activeTab === "background" && (
            <div className="settings-category-view">
              <div className="pane-section">
                <h3 className="section-title">Simple</h3>
                <div className="bg-cards-grid">
                  {BACKGROUND_LIST.filter((b) => b.category === "simple").map((bg) => {
                    const isSelected = selectedBgId === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        className={`bg-thumb-card ${isSelected ? "selected" : ""}`}
                        onClick={() => updateSetting("background", bg.id)}
                        onMouseEnter={() => setHoveredBg(bg.id)}
                        onMouseLeave={() => setHoveredBg(null)}
                        onFocus={() => setHoveredBg(bg.id)}
                        onBlur={() => setHoveredBg(null)}
                      >
                        <div className="bg-thumb-preview-wrap">
                          <ChatBackground
                            typeOverride={bg.id}
                            thumbnail
                            isHovered={hoveredBg === bg.id}
                          />
                        </div>
                        <div className="bg-thumb-info-row">
                          <span className="bg-thumb-name">{bg.name}</span>
                          {isSelected && <Check size={14} className="text-accent" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pane-section">
                <h3 className="section-title">Animated</h3>
                <div className="bg-cards-grid">
                  {BACKGROUND_LIST.filter((b) => b.category === "animated").map((bg) => {
                    const isSelected = selectedBgId === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        className={`bg-thumb-card ${isSelected ? "selected" : ""}`}
                        onClick={() => updateSetting("background", bg.id)}
                        onMouseEnter={() => setHoveredBg(bg.id)}
                        onMouseLeave={() => setHoveredBg(null)}
                        onFocus={() => setHoveredBg(bg.id)}
                        onBlur={() => setHoveredBg(null)}
                        title={bg.heavy ? `${bg.name} (Uses more power)` : bg.name}
                      >
                        <div className="bg-thumb-preview-wrap">
                          <ChatBackground
                            typeOverride={bg.id}
                            thumbnail
                            isHovered={hoveredBg === bg.id}
                          />
                        </div>
                        <div className="bg-thumb-info-row">
                          <span className="bg-thumb-name">{bg.name}</span>
                          {isSelected && <Check size={14} className="text-accent" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contextual Customization per selected background */}
              <div className="pane-section contextual-tuning-box">
                <div className="tuning-header-row">
                  <div>
                    <h3 className="section-title">Background settings</h3>
                    <p className="section-desc">Controls for {BACKGROUND_LIST.find((b) => b.id === selectedBgId)?.name}.</p>
                  </div>
                  <div className="tuning-actions-group">
                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={() => randomizeBgCustom(selectedBgId)}
                      title="Randomize values"
                    >
                      <Sparkles size={13} /> Randomize
                    </button>
                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={() => resetBgCustom(selectedBgId)}
                      title="Reset this background"
                    >
                      <RotateCcw size={13} /> Reset background
                    </button>
                  </div>
                </div>

                <div className="sliders-list">
                  {/* Common: Darkness Dim */}
                  <CustomRangeSlider
                    label="Darkness overlay"
                    value={currentBgConfig.dim}
                    min={0}
                    max={0.9}
                    step={0.05}
                    displayValue={`${Math.round(currentBgConfig.dim * 100)}%`}
                    defaultValue={defaultBgConfig.dim}
                    onChange={(val) => updateBgCustom(selectedBgId, { dim: val })}
                    onReset={() => updateBgCustom(selectedBgId, { dim: defaultBgConfig.dim })}
                  />

                  {/* Common: Blur */}
                  <CustomRangeSlider
                    label="Background blur"
                    value={currentBgConfig.blur}
                    min={0}
                    max={20}
                    step={1}
                    displayValue={`${currentBgConfig.blur}px`}
                    defaultValue={defaultBgConfig.blur}
                    onChange={(val) => updateBgCustom(selectedBgId, { blur: val })}
                    onReset={() => updateBgCustom(selectedBgId, { blur: defaultBgConfig.blur })}
                  />

                  {/* Animated: Speed */}
                  {selectedBgId !== "minimal-dark" &&
                    selectedBgId !== "blueprint-grid" &&
                    selectedBgId !== "telegram-doodle" && (
                      <CustomRangeSlider
                        label="Animation speed"
                        value={currentBgConfig.speed}
                        min={0.2}
                        max={2.5}
                        step={0.1}
                        displayValue={`${currentBgConfig.speed.toFixed(1)}x`}
                        defaultValue={defaultBgConfig.speed}
                        onChange={(val) => updateBgCustom(selectedBgId, { speed: val })}
                        onReset={() => updateBgCustom(selectedBgId, { speed: defaultBgConfig.speed })}
                      />
                    )}

                  {/* Specialized: Starfield Particle Count */}
                  {selectedBgId === "starfield" && (
                    <CustomRangeSlider
                      label="Star count"
                      value={currentBgConfig.particleCount || 160}
                      min={60}
                      max={350}
                      step={10}
                      displayValue={String(currentBgConfig.particleCount || 160)}
                      defaultValue={defaultBgConfig.particleCount || 160}
                      onChange={(val) => updateBgCustom("starfield", { particleCount: val })}
                      onReset={() =>
                        updateBgCustom("starfield", { particleCount: defaultBgConfig.particleCount })
                      }
                    />
                  )}

                  {/* Specialized: Neural Network Nodes */}
                  {selectedBgId === "constellation" && (
                    <CustomRangeSlider
                      label="Node count"
                      value={currentBgConfig.particleCount || 55}
                      min={20}
                      max={90}
                      step={5}
                      displayValue={String(currentBgConfig.particleCount || 55)}
                      defaultValue={defaultBgConfig.particleCount || 55}
                      onChange={(val) => updateBgCustom("constellation", { particleCount: val })}
                      onReset={() =>
                        updateBgCustom("constellation", { particleCount: defaultBgConfig.particleCount })
                      }
                    />
                  )}

                  {/* Specialized: Aurora Silk Wave Amp */}
                  {selectedBgId === "aurora" && (
                    <>
                      <CustomRangeSlider
                        label="Wave amplitude"
                        value={currentBgConfig.waveAmp || 45}
                        min={15}
                        max={75}
                        step={5}
                        displayValue={`${currentBgConfig.waveAmp || 45}px`}
                        defaultValue={defaultBgConfig.waveAmp || 45}
                        onChange={(val) => updateBgCustom("aurora", { waveAmp: val })}
                        onReset={() =>
                          updateBgCustom("aurora", { waveAmp: defaultBgConfig.waveAmp })
                        }
                      />
                      <CustomRangeSlider
                        label="Wave frequency"
                        value={currentBgConfig.waveFreq || 0.0025}
                        min={0.001}
                        max={0.005}
                        step={0.0005}
                        displayValue={(currentBgConfig.waveFreq || 0.0025).toFixed(4)}
                        defaultValue={defaultBgConfig.waveFreq || 0.0025}
                        onChange={(val) => updateBgCustom("aurora", { waveFreq: val })}
                        onReset={() =>
                          updateBgCustom("aurora", { waveFreq: defaultBgConfig.waveFreq })
                        }
                      />
                    </>
                  )}

                  {/* Specialized: Cyber Rain Trail Length */}
                  {selectedBgId === "matrix" && (
                    <>
                      <CustomRangeSlider
                        label="Stream density"
                        value={currentBgConfig.trailLength || 28}
                        min={10}
                        max={50}
                        step={2}
                        displayValue={String(currentBgConfig.trailLength || 28)}
                        defaultValue={defaultBgConfig.trailLength || 28}
                        onChange={(val) => updateBgCustom("matrix", { trailLength: val })}
                        onReset={() =>
                          updateBgCustom("matrix", { trailLength: defaultBgConfig.trailLength })
                        }
                      />
                      <div className="slider-item-row">
                        <label className="slider-name-label">Character set</label>
                        <div className="char-set-toggle-row">
                          {(
                            [
                              { id: "matrix", label: "Kana & Hex" },
                              { id: "binary", label: "Binary (0/1)" },
                              { id: "ascii", label: "Letters" },
                            ] as { id: "matrix" | "binary" | "ascii"; label: string }[]
                          ).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className={`pill-option-btn ${currentBgConfig.charSet === c.id ? "active" : ""}`}
                              onClick={() => updateBgCustom("matrix", { charSet: c.id })}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Specialized: Fireflies Count */}
                  {selectedBgId === "fireflies" && (
                    <CustomRangeSlider
                      label="Particle count"
                      value={currentBgConfig.particleCount || 40}
                      min={15}
                      max={80}
                      step={5}
                      displayValue={String(currentBgConfig.particleCount || 40)}
                      defaultValue={defaultBgConfig.particleCount || 40}
                      onChange={(val) => updateBgCustom("fireflies", { particleCount: val })}
                      onReset={() =>
                        updateBgCustom("fireflies", { particleCount: defaultBgConfig.particleCount })
                      }
                    />
                  )}

                  {/* Brightness & Contrast */}
                  <CustomRangeSlider
                    label="Brightness"
                    value={currentBgConfig.brightness || 1.0}
                    min={0.6}
                    max={1.4}
                    step={0.05}
                    displayValue={`${Math.round((currentBgConfig.brightness || 1.0) * 100)}%`}
                    defaultValue={defaultBgConfig.brightness || 1.0}
                    onChange={(val) => updateBgCustom(selectedBgId, { brightness: val })}
                    onReset={() =>
                      updateBgCustom(selectedBgId, { brightness: defaultBgConfig.brightness })
                    }
                  />

                  <CustomRangeSlider
                    label="Contrast"
                    value={currentBgConfig.contrast || 1.0}
                    min={0.6}
                    max={1.4}
                    step={0.05}
                    displayValue={`${Math.round((currentBgConfig.contrast || 1.0) * 100)}%`}
                    defaultValue={defaultBgConfig.contrast || 1.0}
                    onChange={(val) => updateBgCustom(selectedBgId, { contrast: val })}
                    onReset={() =>
                      updateBgCustom(selectedBgId, { contrast: defaultBgConfig.contrast })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. CHAT */}
          {activeTab === "chat" && (
            <div className="settings-category-view">
              <div className="pane-section">
                <h3 className="section-title">Message style</h3>
                <p className="section-desc">Change the layout and spacing of messages in the room.</p>
                <div className="option-choice-grid">
                  {(
                    [
                      { id: "modern", label: "Modern", desc: "Rounded bubbles with compact spacing" },
                      { id: "spacious", label: "Spacious", desc: "Larger padding with airy spacing" },
                      { id: "inline", label: "Inline", desc: "Flat borderless Discord-style text" },
                    ] as { id: MessageStyle; label: string; desc: string }[]
                  ).map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      className={`option-choice-card ${settings.messageStyle === style.id ? "selected" : ""}`}
                      onClick={() => updateSetting("messageStyle", style.id)}
                    >
                      <span className="choice-card-title">{style.label}</span>
                      <span className="choice-card-desc">{style.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. PROFILE */}
          {activeTab === "profile" && (
            <div className="settings-category-view">
              <div className="pane-section">
                <h3 className="section-title">Display identity</h3>
                <p className="section-desc">Your nickname and color shown in this room.</p>

                <div className="form-group-block">
                  <label htmlFor="settings-profile-name" className="field-label">
                    Display name
                  </label>
                  <input
                    id="settings-profile-name"
                    type="text"
                    value={profileName}
                    onChange={(e) => handleProfileNameChange(e.target.value)}
                    onBlur={handleApplyProfile}
                    maxLength={16}
                    placeholder="Enter name (max 16)..."
                    className={`clean-text-input ${profileError ? "has-error" : ""}`}
                  />
                  {profileError && <span className="field-error-hint">{profileError}</span>}
                </div>

                <div className="form-group-block">
                  <label className="field-label">Name color</label>
                  <div className="theme-swatches-grid">
                    {USER_COLORS.map((c) => {
                      const isSelected = profileColor === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          className={`theme-color-swatch ${isSelected ? "selected" : ""}`}
                          style={{ backgroundColor: c }}
                          onClick={() => {
                            setProfileColor(c);
                            if (onUpdateUser && !profileError) {
                              onUpdateUser({ name: profileName.trim() || currentUser?.name, color: c });
                            }
                          }}
                          title={c}
                        >
                          {isSelected && <Check size={14} color="#09090b" strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Message Bubble Preview */}
                <div className="live-preview-box">
                  <span className="preview-heading">Preview</span>
                  <div className="preview-message-item">
                    <div className="preview-header-row">
                      <span className="preview-author-name" style={{ color: profileColor }}>
                        {profileName.trim() || currentUser?.name || "You"}
                      </span>
                      <span className="preview-time-stamp">12:00 PM</span>
                    </div>
                    <div className="preview-bubble-sample">
                      Hey everyone! Here is how your messages look in the chat.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. SOUND & NOTIFICATIONS */}
          {activeTab === "sound" && (
            <div className="settings-category-view">
              <div className="pane-section">
                <h3 className="section-title">Audio</h3>
                <div className="settings-toggle-row">
                  <div>
                    <span className="toggle-title">Message sound</span>
                    <p className="toggle-desc">Play a subtle audio chime when new messages arrive.</p>
                  </div>
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={!settings.soundMuted}
                      onChange={(e) => updateSetting("soundMuted", !e.target.checked)}
                      className="switch-checkbox"
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
              </div>

              <div className="pane-section">
                <h3 className="section-title">Notifications</h3>
                <div className="settings-toggle-row">
                  <div>
                    <span className="toggle-title">Browser notifications</span>
                    <p className="toggle-desc">Show desktop notifications when Loopin is in the background.</p>
                  </div>
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={settings.notificationsEnabled}
                      onChange={async (e) => {
                        const next = e.target.checked;
                        if (next && typeof Notification !== "undefined") {
                          const res = await Notification.requestPermission();
                          updateSetting("notificationsEnabled", res === "granted");
                        } else {
                          updateSetting("notificationsEnabled", false);
                        }
                      }}
                      className="switch-checkbox"
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 6. ACCESSIBILITY & PERFORMANCE */}
          {activeTab === "accessibility" && (
            <div className="settings-category-view">
              <div className="pane-section">
                <h3 className="section-title">Motion</h3>
                <div className="settings-toggle-row">
                  <div>
                    <span className="toggle-title">No animations</span>
                    <p className="toggle-desc">Disables all background animations and interface transitions.</p>
                  </div>
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={settings.noAnimations}
                      onChange={(e) => updateSetting("noAnimations", e.target.checked)}
                      className="switch-checkbox"
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
              </div>

              <div className="pane-section">
                <h3 className="section-title">Performance</h3>
                <div className="settings-toggle-row">
                  <div>
                    <span className="toggle-title">Performance mode</span>
                    <p className="toggle-desc">
                      Caps canvas FPS, lowers resolution, disables blur, and swaps animated backgrounds for static ones to save battery on low-power devices.
                    </p>
                  </div>
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={settings.performanceMode}
                      onChange={(e) => updateSetting("performanceMode", e.target.checked)}
                      className="switch-checkbox"
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 7. PRIVACY & DATA */}
          {activeTab === "privacy" && (
            <div className="settings-category-view">
              <div className="pane-section">
                <h3 className="section-title">Local storage</h3>
                <p className="section-desc">All user data, settings, and room history stay strictly on your device.</p>

                {confirmClear ? (
                  <div className="confirm-wipe-card">
                    <AlertTriangle size={16} className="text-danger" />
                    <span className="confirm-wipe-text">
                      Clear all local data and recent rooms immediately?
                    </span>
                    <div className="confirm-wipe-actions">
                      <button
                        type="button"
                        className="btn-neutral-outline"
                        onClick={() => setConfirmClear(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-danger-solid"
                        onClick={clearAllData}
                      >
                        Yes, clear everything
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-neutral-outline"
                    onClick={() => setConfirmClear(true)}
                  >
                    Clear all local data
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="settings-footer-bar">
        <button
          type="button"
          className="btn-text-subtle"
          onClick={resetAllDefaults}
        >
          Reset all to defaults
        </button>

        <button
          type="button"
          className="btn-accent-done"
          onClick={onClose}
          style={{
            backgroundColor: "var(--primary-accent)",
            color: "var(--primary-accent-contrast)",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );

  // When Peek mode is active, render docked solid panel without native <dialog> backdrop
  if (isPeek) {
    return <aside className="settings-peek-panel" aria-label="Settings peek pane">{modalInner}</aside>;
  }

  // Full two-pane dialog
  return (
    <dialog
      ref={dialogRef}
      className="settings-wide-dialog"
      aria-labelledby="settings-dialog-title"
      aria-modal="true"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      {modalInner}
    </dialog>
  );
};
