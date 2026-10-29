import React, { useRef, useEffect, useState } from "react";
import { useSettings, type BackgroundType, type BackgroundCustomConfig, DEFAULT_BG_CONFIG } from "../hooks/useSettings";

interface ChatBackgroundProps {
  className?: string;
  typeOverride?: BackgroundType;
  thumbnail?: boolean;
  isHovered?: boolean;
}

export const ChatBackground: React.FC<ChatBackgroundProps> = ({
  className = "",
  typeOverride,
  thumbnail = false,
  isHovered = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const { settings } = useSettings();

  const type = typeOverride || settings.background;
  const accentColor = settings.themeColor || "#facc15";
  const noAnimations = settings.noAnimations;
  const performanceMode = settings.performanceMode;

  const config: BackgroundCustomConfig =
    settings.bgCustom[type] || DEFAULT_BG_CONFIG[type] || DEFAULT_BG_CONFIG["minimal-dark"];

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const shouldAnimate =
    !noAnimations &&
    !prefersReducedMotion &&
    !performanceMode &&
    type !== "minimal-dark" &&
    type !== "blueprint-grid" &&
    type !== "telegram-doodle" &&
    (!thumbnail || isHovered);

  // Mouse tracking on full canvas
  useEffect(() => {
    if (thumbnail) return;
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [thumbnail]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isWindowFocused = typeof document !== "undefined" ? document.hasFocus() : true;
    let isTabVisible = typeof document !== "undefined" ? !document.hidden : true;

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    const onFocus = () => {
      isWindowFocused = true;
    };
    const onBlur = () => {
      isWindowFocused = false;
    };

    if (!thumbnail) {
      document.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener("focus", onFocus);
      window.addEventListener("blur", onBlur);
    }

    const setSize = () => {
      const parent = canvas.parentElement;
      const w = thumbnail && parent ? parent.clientWidth : window.innerWidth;
      const h = thumbnail && parent ? parent.clientHeight : window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, performanceMode ? 1 : thumbnail ? 1 : 1.5);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      return { width: w, height: h };
    };

    let { width, height } = setSize();

    const handleResize = () => {
      if (!canvas) return;
      const size = setSize();
      width = size.width;
      height = size.height;
    };

    if (!thumbnail) {
      window.addEventListener("resize", handleResize, { passive: true });
    }

    const speed = Math.max(0.1, config.speed || 1.0);

    // Initial clear
    ctx.clearRect(0, 0, width, height);

    // ── 1. Warp Starfield ──
    if (type === "starfield") {
      const numStars = Math.floor((config.particleCount || 160) * (thumbnail ? 0.4 : 1));
      const stars = Array.from({ length: numStars }, () => ({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        pz: width,
      }));

      const render = () => {
        if (!thumbnail && (!isTabVisible || !isWindowFocused)) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        ctx.fillStyle = "rgba(9, 9, 11, 0.4)";
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const starSpeed = (shouldAnimate ? 3.0 : 0.05) * speed;

        for (const s of stars) {
          s.pz = s.z;
          if (shouldAnimate) {
            s.z -= starSpeed;
            if (s.z <= 10) {
              s.z = width;
              s.pz = width;
              s.x = (Math.random() - 0.5) * width * 2;
              s.y = (Math.random() - 0.5) * height * 2;
            }
          }

          const k = 220 / s.z;
          const px = s.x * k + cx;
          const py = s.y * k + cy;

          const prevK = 220 / s.pz;
          const prevPx = s.x * prevK + cx;
          const prevPy = s.y * prevK + cy;

          if (px >= 0 && px < width && py >= 0 && py < height) {
            const depth = Math.max(0, 1 - s.z / width);
            ctx.lineWidth = Math.max(0.8, depth * 2);
            ctx.strokeStyle = depth > 0.7 ? accentColor : `rgba(255, 255, 255, ${depth * 0.7})`;

            ctx.beginPath();
            ctx.moveTo(prevPx, prevPy);
            ctx.lineTo(px, py);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(px, py, Math.max(0.6, depth * 1.5), 0, Math.PI * 2);
            ctx.fillStyle = depth > 0.7 ? accentColor : "#ffffff";
            ctx.fill();
          }
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    // ── 2. Neural Network Constellation ──
    else if (type === "constellation") {
      const nodeCount = Math.floor((config.particleCount || 55) * (thumbnail ? 0.35 : 1));
      const maxDist = thumbnail ? 70 : 120;
      const nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6 * speed,
        vy: (Math.random() - 0.5) * 0.6 * speed,
        r: Math.random() * 1.8 + 1.0,
      }));

      const render = () => {
        if (!thumbnail && (!isTabVisible || !isWindowFocused)) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        ctx.clearRect(0, 0, width, height);
        const mouse = mouseRef.current;

        for (let i = 0; i < nodes.length; i++) {
          const p = nodes[i];
          if (shouldAnimate) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            if (!thumbnail && mouse.active) {
              const mdx = mouse.x - p.x;
              const mdy = mouse.y - p.y;
              const mDist = Math.hypot(mdx, mdy);
              if (mDist < 120 && mDist > 0) {
                p.x -= (mdx / mDist) * 1.2;
                p.y -= (mdy / mDist) * 1.2;
              }
            }
          }

          // Node core
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = accentColor;
          ctx.fill();

          for (let j = i + 1; j < nodes.length; j++) {
            const p2 = nodes[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.hypot(dx, dy);

            if (dist < maxDist) {
              const alpha = (1 - dist / maxDist) * 0.28;
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    // ── 3. Aurora Silk Waves ──
    else if (type === "aurora") {
      let t = 0;
      const amp = config.waveAmp || 45;
      const freq = config.waveFreq || 0.0025;

      const ribbons = [
        { color: "rgba(250, 204, 21, 0.08)", yBase: 0.65, amp, freq },
        { color: "rgba(56, 189, 248, 0.07)", yBase: 0.72, amp: amp * 1.2, freq: freq * 0.9 },
        { color: "rgba(192, 132, 252, 0.06)", yBase: 0.78, amp: amp * 1.1, freq: freq * 1.2 },
      ];

      const render = () => {
        if (!thumbnail && (!isTabVisible || !isWindowFocused)) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        ctx.clearRect(0, 0, width, height);
        if (shouldAnimate) {
          t += 0.012 * speed;
        }

        for (const rib of ribbons) {
          ctx.beginPath();
          const y0 = height * rib.yBase;
          ctx.moveTo(0, height);

          for (let x = 0; x <= width; x += thumbnail ? 16 : 8) {
            const y = y0 + Math.sin(x * rib.freq + t) * rib.amp + Math.cos(x * 0.001 - t * 0.8) * 20;
            ctx.lineTo(x, y);
          }

          ctx.lineTo(width, height);
          ctx.closePath();

          const grad = ctx.createLinearGradient(0, y0 - 60, 0, height);
          grad.addColorStop(0, rib.color);
          grad.addColorStop(1, "rgba(9, 9, 11, 0)");
          ctx.fillStyle = grad;
          ctx.fill();
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    // ── 4. Cyber Rain ──
    else if (type === "matrix") {
      const fontSize = thumbnail ? 10 : 13;
      const cols = Math.floor(width / fontSize);
      const drops: number[] = Array.from({ length: cols }, () => Math.floor(Math.random() * -40));
      const chars =
        config.charSet === "binary"
          ? "01"
          : config.charSet === "ascii"
          ? "0123456789LOOPINXYZ"
          : "01LOOPIN23456789ｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ";

      const render = () => {
        if (!thumbnail && (!isTabVisible || !isWindowFocused)) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        ctx.fillStyle = "rgba(9, 9, 11, 0.2)";
        ctx.fillRect(0, 0, width, height);

        ctx.font = `500 ${fontSize}px var(--font-mono, monospace)`;

        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          if (y > 0 && y < height + 20) {
            ctx.fillStyle = "#ffffff";
            ctx.fillText(char, x, y);

            ctx.fillStyle = accentColor;
            const prevChar = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(prevChar, x, y - fontSize);
          }

          if (shouldAnimate) {
            if (y > height && Math.random() > 0.98) {
              drops[i] = 0;
            }
            drops[i] += 0.8 * speed;
          }
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    // ── 5. Fireflies ──
    else if (type === "fireflies") {
      const count = Math.floor((config.particleCount || 40) * (thumbnail ? 0.35 : 1));
      const embers = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.0 + 1.0,
        vy: -(Math.random() * 0.4 + 0.15) * speed,
        vx: (Math.random() - 0.5) * 0.3 * speed,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: (Math.random() * 0.02 + 0.01) * speed,
      }));

      const render = () => {
        if (!thumbnail && (!isTabVisible || !isWindowFocused)) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        ctx.clearRect(0, 0, width, height);

        for (const e of embers) {
          if (shouldAnimate) {
            e.y += e.vy;
            e.x += e.vx + Math.sin(e.phase) * 0.25;
            e.phase += e.pulseSpeed;

            if (e.y < -10) e.y = height + 10;
            if (e.x < -10) e.x = width + 10;
            if (e.x > width + 10) e.x = -10;
          }

          const alpha = (Math.sin(e.phase) + 1) * 0.5 * 0.7;

          // Soft aura
          const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 4);
          grad.addColorStop(0, accentColor);
          grad.addColorStop(0.4, `rgba(250, 204, 21, ${alpha * 0.6})`);
          grad.addColorStop(1, "rgba(250, 204, 21, 0)");

          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    // ── 6. Synthwave 80s ──
    else if (type === "retro-grid") {
      let gridOffset = 0;
      const horizonY = height * 0.55;

      const render = () => {
        if (!thumbnail && (!isTabVisible || !isWindowFocused)) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        ctx.clearRect(0, 0, width, height);
        if (shouldAnimate) {
          gridOffset = (gridOffset + 0.008 * speed) % 1;
        }

        const sunRadius = Math.min(width * 0.16, thumbnail ? 28 : 90);
        const sunX = width / 2;
        const sunY = horizonY;

        // Low-contrast restrained sun
        const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
        sunGrad.addColorStop(0, "#fde047");
        sunGrad.addColorStop(0.6, accentColor);
        sunGrad.addColorStop(1, "#f43f5e");

        ctx.save();
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, Math.PI, 0, false);
        ctx.fillStyle = sunGrad;
        ctx.fill();

        // Horizontal slices
        ctx.fillStyle = "#09090b";
        for (let slice = 0; slice < 5; slice++) {
          const sliceY = sunY - sunRadius * 0.4 + slice * (sunRadius * 0.12);
          const sliceH = 1.5 + slice * 1.2;
          ctx.fillRect(sunX - sunRadius - 5, sliceY, (sunRadius + 5) * 2, sliceH);
        }
        ctx.restore();

        // Ground horizon line
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(width, horizonY);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Perspective grid lines
        const groundHeight = height - horizonY;
        const numHorizLines = thumbnail ? 8 : 14;
        for (let i = 0; i < numHorizLines; i++) {
          const p = (i + gridOffset) / numHorizLines;
          const y = horizonY + Math.pow(p, 2.2) * groundHeight;
          const alpha = Math.min(0.5, Math.pow(p, 1.2) * 0.5);
          ctx.strokeStyle = `rgba(250, 204, 21, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        const numVertLines = thumbnail ? 12 : 22;
        for (let i = -numVertLines / 2; i <= numVertLines / 2; i++) {
          const bottomX = sunX + i * (width / 12);
          ctx.strokeStyle = "rgba(250, 204, 21, 0.18)";
          ctx.beginPath();
          ctx.moveTo(sunX, horizonY);
          ctx.lineTo(bottomX, height);
          ctx.stroke();
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (!thumbnail) {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("blur", onBlur);
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [type, accentColor, shouldAnimate, config, thumbnail, performanceMode]);

  return (
    <div
      className={`chat-bg-layer chat-bg-${type} ${thumbnail ? "chat-bg-thumbnail" : ""} ${className}`}
      aria-hidden="true"
    >
      {type !== "minimal-dark" && type !== "blueprint-grid" && type !== "telegram-doodle" && (
        <canvas ref={canvasRef} className="chat-bg-canvas" />
      )}
      {type === "telegram-doodle" && <div className="static-bg-doodle" />}
      {type === "blueprint-grid" && <div className="static-bg-grid" />}

      {/* Dim, Blur, Brightness, and Contrast Overlay */}
      {!thumbnail && (
        <div
          className="chat-bg-overlay"
          style={{
            backgroundColor: `rgba(9, 9, 11, ${config.dim ?? 0.2})`,
            backdropFilter: (config.blur ?? 0) > 0 ? `blur(${config.blur}px)` : "none",
            WebkitBackdropFilter: (config.blur ?? 0) > 0 ? `blur(${config.blur}px)` : "none",
            filter: `brightness(${config.brightness ?? 1}) contrast(${config.contrast ?? 1})`,
          }}
        />
      )}
    </div>
  );
};
