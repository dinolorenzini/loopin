import React, { useRef, useEffect, useState } from "react";
import {
  X,
  Palette,
  Image as ImageIcon,
  MessageSquare,
  User as UserIcon,
  Volume2,
  Sliders,
  Shield,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Check,
  Plus,
  Maximize2,
  FileText,
  Trash2,
  Eye,
  type LucideIcon,
} from "lucide-react";
import {
  useSettings,
  THEME_PRESETS,
  BG_BASE_COLORS,
  BACKGROUND_LIST,
  DEFAULT_BG_CONFIG,
  type SettingsCategory,
  type BackgroundType,
  type ThemeMode,
  type MessageStyle,
} from "../hooks/useSettings";
import { USER_COLORS } from "../hooks/useUser";
import { ChatBackground } from "./ChatBackground";
import { LegalModal, type LegalDocType } from "./LegalModal";
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

  const [hoveredBg, setHoveredBg] = useState<BackgroundType | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isPeekingBackground, setIsPeekingBackground] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>("tos");

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
      setIsPeekingBackground(false);
      setConfirmClear(false);
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      setIsPeekingBackground(false);
      if (dialog.open) {
        dialog.close();
      }
      triggerRef?.current?.focus();
    }
  }, [isOpen, triggerRef]);

  // Handle Tab Switch & Remember
  const handleSelectTab = (tab: SettingsCategory) => {
    setIsPeekingBackground(false);
    setActiveTab(tab);
    updateSetting("activeCategory", tab);
    if (contentPaneRef.current) {
      contentPaneRef.current.scrollTop = 0;
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

  const selectedBgId = settings.background || "minimal-dark";
  const defaultBgConfig = DEFAULT_BG_CONFIG[selectedBgId] || DEFAULT_BG_CONFIG["minimal-dark"];
  const currentBgConfig = settings.bgCustom?.[selectedBgId] || defaultBgConfig;

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

  return (
    <>
      {isPeekingBackground && (
        <div
          className="peeking-floating-badge"
          onClick={() => setIsPeekingBackground(false)}
          title="Click to restore settings modal"
        >
          <Eye size={14} className="text-accent" />
          <span>Viewing background &bull; Click to return</span>
        </div>
      )}

      <dialog
        ref={dialogRef}
        className={`settings-wide-dialog ${isPeekingBackground ? "peeking-background" : ""}`}
        aria-labelledby="settings-dialog-title"
        aria-modal="true"
        onClose={onClose}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            onClose();
          }
        }}
      >
      <div className="settings-box-container">
        {/* Fixed Header */}
        <div className="settings-header-bar">
          <h2 id="settings-dialog-title" className="settings-modal-title">
            Settings
          </h2>

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

        {/* Consistent Sized Body Split */}
        <div className="settings-body-split">
          {/* Left Category Rail (Fixed 220px) */}
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

          {/* Right Content Pane (Always Scrollable, Never Resizes Modal) */}
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
                        aria-label="Custom Hex Color Picker"
                      />
                      <span
                        className="custom-hex-swatch-circle"
                        style={{ backgroundColor: settings.themeColor }}
                      >
                        <Plus size={14} color="#09090b" />
                      </span>
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
              </div>
            )}

            {/* 2. BACKGROUND */}
            {activeTab === "background" && (
              <div className="settings-category-view">
                {/* Background Base Color */}
                <div className="pane-section">
                  <div className="section-title-wrap">
                    <h3 className="section-title">Background base color</h3>
                    <span className="section-title-hint">Custom canvas tint &amp; tone</span>
                  </div>
                  <div className="bg-base-color-row">
                    {BG_BASE_COLORS.map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        className={`bg-color-swatch-btn ${settings.backgroundColor === c.color ? "selected" : ""}`}
                        style={{ backgroundColor: c.color }}
                        onClick={() => updateSetting("backgroundColor", c.color)}
                        title={c.name}
                      >
                        {settings.backgroundColor === c.color && <Check size={14} color="#fff" strokeWidth={3} />}
                      </button>
                    ))}
                    <label className="custom-color-picker-label" title="Custom base color">
                      <input
                        type="color"
                        value={settings.backgroundColor || "#09090b"}
                        onChange={(e) => updateSetting("backgroundColor", e.target.value)}
                        className="native-color-picker-input"
                      />
                      <Plus size={14} />
                    </label>
                  </div>
                </div>

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
                  <div className="section-title-wrap">
                    <h3 className="section-title">Animated</h3>
                    <span className="section-title-hint">Hover to preview background</span>
                  </div>
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
                        className={`btn-link-action ${isPeekingBackground ? "active" : ""}`}
                        onMouseEnter={() => setIsPeekingBackground(true)}
                        onMouseLeave={() => setIsPeekingBackground(false)}
                        onClick={() => setIsPeekingBackground((prev) => !prev)}
                        title="Hover to lower opacity and preview background"
                      >
                        <Eye size={13} /> {isPeekingBackground ? "Peeking background..." : "View full screen"}
                      </button>
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
                        <>
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

                          <CustomRangeSlider
                            label="Vertical position / Screen coverage"
                            value={currentBgConfig.verticalOffset ?? 0}
                            min={-100}
                            max={100}
                            step={5}
                            displayValue={`${(currentBgConfig.verticalOffset ?? 0) > 0 ? "+" : ""}${currentBgConfig.verticalOffset ?? 0}%`}
                            defaultValue={0}
                            onChange={(val) => updateBgCustom(selectedBgId, { verticalOffset: val })}
                            onReset={() => updateBgCustom(selectedBgId, { verticalOffset: 0 })}
                          />
                        </>
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

                    {/* Specialized: Topographic */}
                    {selectedBgId === "topographic" && (
                      <>
                        <CustomRangeSlider
                          label="Elevation contour lines"
                          value={currentBgConfig.contourDensity || 12}
                          min={4}
                          max={24}
                          step={2}
                          displayValue={String(currentBgConfig.contourDensity || 12)}
                          defaultValue={defaultBgConfig.contourDensity || 12}
                          onChange={(val) => updateBgCustom("topographic", { contourDensity: val })}
                          onReset={() =>
                            updateBgCustom("topographic", { contourDensity: defaultBgConfig.contourDensity })
                          }
                        />
                        <CustomRangeSlider
                          label="Elevation wave amplitude"
                          value={currentBgConfig.waveAmp || 40}
                          min={15}
                          max={80}
                          step={5}
                          displayValue={`${currentBgConfig.waveAmp || 40}px`}
                          defaultValue={defaultBgConfig.waveAmp || 40}
                          onChange={(val) => updateBgCustom("topographic", { waveAmp: val })}
                          onReset={() => updateBgCustom("topographic", { waveAmp: defaultBgConfig.waveAmp })}
                        />
                        <CustomRangeSlider
                          label="Contour line thickness"
                          value={currentBgConfig.lineThickness || 1.5}
                          min={1}
                          max={3.5}
                          step={0.5}
                          displayValue={`${(currentBgConfig.lineThickness || 1.5).toFixed(1)}px`}
                          defaultValue={defaultBgConfig.lineThickness || 1.5}
                          onChange={(val) => updateBgCustom("topographic", { lineThickness: val })}
                          onReset={() =>
                            updateBgCustom("topographic", { lineThickness: defaultBgConfig.lineThickness })
                          }
                        />
                        <CustomRangeSlider
                          label="Contour elevation scale"
                          value={currentBgConfig.waveFreq || 0.003}
                          min={0.001}
                          max={0.006}
                          step={0.0005}
                          displayValue={(currentBgConfig.waveFreq || 0.003).toFixed(4)}
                          defaultValue={defaultBgConfig.waveFreq || 0.003}
                          onChange={(val) => updateBgCustom("topographic", { waveFreq: val })}
                          onReset={() => updateBgCustom("topographic", { waveFreq: defaultBgConfig.waveFreq })}
                        />
                      </>
                    )}

                    {/* Specialized: Waves */}
                    {selectedBgId === "waves" && (
                      <>
                        <CustomRangeSlider
                          label="Wave amplitude"
                          value={currentBgConfig.waveAmp || 42}
                          min={15}
                          max={90}
                          step={5}
                          displayValue={`${currentBgConfig.waveAmp || 42}px`}
                          defaultValue={defaultBgConfig.waveAmp || 42}
                          onChange={(val) => updateBgCustom("waves", { waveAmp: val })}
                          onReset={() => updateBgCustom("waves", { waveAmp: defaultBgConfig.waveAmp })}
                        />
                        <CustomRangeSlider
                          label="Wave frequency"
                          value={currentBgConfig.waveFreq || 0.003}
                          min={0.001}
                          max={0.006}
                          step={0.0005}
                          displayValue={(currentBgConfig.waveFreq || 0.003).toFixed(4)}
                          defaultValue={defaultBgConfig.waveFreq || 0.003}
                          onChange={(val) => updateBgCustom("waves", { waveFreq: val })}
                          onReset={() => updateBgCustom("waves", { waveFreq: defaultBgConfig.waveFreq })}
                        />
                        <CustomRangeSlider
                          label="Ribbon layers"
                          value={currentBgConfig.ribbonCount || 5}
                          min={2}
                          max={8}
                          step={1}
                          displayValue={String(currentBgConfig.ribbonCount || 5)}
                          defaultValue={defaultBgConfig.ribbonCount || 5}
                          onChange={(val) => updateBgCustom("waves", { ribbonCount: val })}
                          onReset={() => updateBgCustom("waves", { ribbonCount: defaultBgConfig.ribbonCount })}
                        />
                      </>
                    )}

                    {/* Specialized: Vortex */}
                    {selectedBgId === "vortex" && (
                      <CustomRangeSlider
                        label="Particle count"
                        value={currentBgConfig.particleCount || 130}
                        min={40}
                        max={260}
                        step={10}
                        displayValue={String(currentBgConfig.particleCount || 130)}
                        defaultValue={defaultBgConfig.particleCount || 130}
                        onChange={(val) => updateBgCustom("vortex", { particleCount: val })}
                        onReset={() => updateBgCustom("vortex", { particleCount: defaultBgConfig.particleCount })}
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

                  {/* Interactive Live Style Preview in Settings */}
                  <div className="chat-style-live-preview-wrap">
                    <span className="preview-label-tag">Live Style Preview</span>
                    <div className="chat-style-live-preview-card" data-preview-style={settings.messageStyle}>
                      <div className="preview-msg-row preview-other">
                        <span className="preview-author-name" style={{ color: "#38bdf8" }}>Alex</span>
                        <div className="preview-bubble other">
                          Hey! Welcome to the ephemeral chat.
                        </div>
                        <span className="preview-time-tag">10:42 AM</span>
                      </div>
                      <div className="preview-msg-row preview-me">
                        <span className="preview-author-name" style={{ color: settings.themeColor }}>You</span>
                        <div
                          className="preview-bubble me"
                          style={{
                            backgroundColor: settings.messageStyle === "inline" ? "transparent" : settings.themeColor,
                            color: settings.messageStyle === "inline" ? "var(--text-primary)" : "var(--primary-accent-contrast)",
                          }}
                        >
                          Looking sleek! Style updates instantly.
                        </div>
                        <span className="preview-time-tag">10:43 AM · Seen</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pane-section">
                  <h3 className="section-title">Chat width</h3>
                  <p className="section-desc">Choose between a centered column and edge-to-edge full width.</p>
                  <div className="option-choice-grid">
                    {(
                      [
                        { id: "contained", label: "Centered", desc: "Restrained centered column (max ~880px)" },
                        { id: "full", label: "Full width", desc: "Edge-to-edge viewport width" },
                      ] as { id: "contained" | "full"; label: string; desc: string }[]
                    ).map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        className={`option-choice-card ${settings.chatWidth === w.id ? "selected" : ""}`}
                        onClick={() => updateSetting("chatWidth", w.id)}
                      >
                        <span className="choice-card-title">{w.label}</span>
                        <span className="choice-card-desc">{w.desc}</span>
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyProfile();
                        }
                      }}
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
                {/* Legal Documents */}
                <div className="pane-section">
                  <h3 className="section-title">Legal &amp; Compliance</h3>
                  <p className="section-desc">Review our transparent ephemeral chat policies and acceptable use agreements.</p>
                  <div className="legal-doc-cards-grid">
                    <div className="legal-doc-card">
                      <div className="legal-doc-card-info">
                        <FileText size={16} className="text-accent" />
                        <div>
                          <span className="legal-doc-card-title">Terms of Service</span>
                          <span className="legal-doc-card-sub">Acceptable use, volatility, and disclaimers</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-neutral-outline"
                        onClick={() => {
                          setLegalDocType("tos");
                          setIsLegalOpen(true);
                        }}
                      >
                        Read Terms
                      </button>
                    </div>

                    <div className="legal-doc-card">
                      <div className="legal-doc-card-info">
                        <Shield size={16} className="text-accent" />
                        <div>
                          <span className="legal-doc-card-title">Privacy Policy</span>
                          <span className="legal-doc-card-sub">Data minimization, RAM storage, and deletion</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-neutral-outline"
                        onClick={() => {
                          setLegalDocType("privacy");
                          setIsLegalOpen(true);
                        }}
                      >
                        Read Policy
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Local Storage Management */}
                <div className="pane-section">
                  <h3 className="section-title">Device Storage</h3>
                  <p className="section-desc">Client data saved locally in your browser&rsquo;s <code>localStorage</code>:</p>

                  <div className="storage-items-list">
                    <div className="storage-item-row">
                      <span className="storage-item-key">loopin_user</span>
                      <span className="storage-item-desc">Your display name and selected name color</span>
                    </div>
                    <div className="storage-item-row">
                      <span className="storage-item-key">loopin_settings_v4</span>
                      <span className="storage-item-desc">Themes, shader settings, and audio preferences</span>
                    </div>
                    <div className="storage-item-row">
                      <span className="storage-item-key">loopin_recent_rooms</span>
                      <span className="storage-item-desc">Shortcuts to your recently visited rooms</span>
                    </div>
                  </div>

                  <div className="storage-danger-zone">
                    {confirmClear ? (
                      <div className="confirm-wipe-card">
                        <AlertTriangle size={16} className="text-danger" />
                        <span className="confirm-wipe-text">
                          Clear all stored nicknames, settings, and room shortcuts on this browser?
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
                            Yes, wipe local data
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-neutral-outline btn-wipe-data"
                        onClick={() => setConfirmClear(true)}
                      >
                        <Trash2 size={14} /> Clear all local data
                      </button>
                    )}
                  </div>
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
            onClick={() => setShowResetConfirm(true)}
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

      {/* Confirmation Dialog for Reset All to Defaults */}
      {showResetConfirm && (
        <div className="reset-confirm-backdrop" onClick={() => setShowResetConfirm(false)}>
          <div className="reset-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="reset-confirm-header">
              <div className="reset-warning-badge">
                <AlertTriangle size={18} color="#f59e0b" />
              </div>
              <div>
                <h3 className="reset-confirm-title">Reset all settings to defaults?</h3>
                <p className="reset-confirm-subtitle">
                  This will restore your themes, animated background shaders, sound effects, and layout preferences to their initial defaults. Your nickname and room history will not be lost.
                </p>
              </div>
            </div>
            <div className="reset-confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-warning-solid"
                onClick={() => {
                  resetAllDefaults();
                  setShowResetConfirm(false);
                }}
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Documents Modal */}
      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialDoc={legalDocType}
      />
    </dialog>
  </>
  );
};
