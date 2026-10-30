import React, { useRef, useEffect } from "react";
import { useSettings, type BackgroundType, type BackgroundCustomConfig, DEFAULT_BG_CONFIG } from "../hooks/useSettings";

function hexOrRgbToRgba(color: string, alpha: number): string {
  if (!color) return `rgba(250, 204, 21, ${alpha})`;
  const trimmed = color.trim();
  if (trimmed.startsWith("#")) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (trimmed.startsWith("rgb(")) {
    return trimmed.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  }
  if (trimmed.startsWith("rgba(")) {
    return trimmed.replace(/[\d\.]+\)$/, `${alpha})`);
  }
  return trimmed;
}

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
  const baseBgColor = settings.backgroundColor || "#09090b";
  const noAnimations = settings.noAnimations;
  const performanceMode = settings.performanceMode;

  const config: BackgroundCustomConfig =
    settings.bgCustom[type] || DEFAULT_BG_CONFIG[type] || DEFAULT_BG_CONFIG["minimal-dark"];

  // If performance mode is off, thumbnail animates!
  // If performance mode is on, thumbnail animates on hover, or renders a crisp static initial snapshot frame.
  const shouldAnimate =
    !noAnimations &&
    type !== "minimal-dark" &&
    (!thumbnail ? !performanceMode : (!performanceMode || isHovered));

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
    let isTabVisible = typeof document !== "undefined" ? !document.hidden : true;

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };

    if (!thumbnail) {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    const setSize = () => {
      let w = window.innerWidth;
      let h = window.innerHeight;
      if (thumbnail) {
        const parent = canvas.parentElement;
        const rect = parent?.getBoundingClientRect();
        w = rect && rect.width > 0 ? rect.width : 160;
        h = rect && rect.height > 0 ? rect.height : 80;
      }
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

    let resizeObserver: ResizeObserver | null = null;
    if (!thumbnail) {
      window.addEventListener("resize", handleResize, { passive: true });
    } else if (canvas.parentElement && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(canvas.parentElement);
    }

    const speed = Math.max(0.1, config.speed || 1.0);

    // Helper to paint base background
    const clearBackground = () => {
      ctx.fillStyle = baseBgColor;
      ctx.fillRect(0, 0, width, height);
    };

    try {
      // ── 0. Minimal Dark ──
    if (type === "minimal-dark") {
      clearBackground();
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7
      );
      grad.addColorStop(0, "rgba(255, 255, 255, 0.02)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // ── 1. Animated Blueprint Grid (Subtle, refined dark blueprint) ──
    else if (type === "blueprint-grid") {
      let scanY = 0;
      const gridSize = thumbnail ? 16 : 28;

      const render = () => {
        if (!thumbnail && !isTabVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        clearBackground();

        // Subtle coordinate grid
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";

        for (let x = 0; x <= width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        for (let y = 0; y <= height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Major grid lines & crosshairs
        const majorSize = gridSize * 4;
        ctx.strokeStyle = "rgba(56, 189, 248, 0.16)";
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += majorSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y <= height; y += majorSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Animated scanning beam
        if (shouldAnimate) {
          scanY = (scanY + 1.2 * speed) % (height + 40);
        }
        const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY);
        grad.addColorStop(0, "rgba(56, 189, 248, 0)");
        grad.addColorStop(1, "rgba(56, 189, 248, 0.14)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 30, width, 30);

        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(width, scanY);
        ctx.stroke();

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    // ── 2. Animated Real Doodles Wallpaper ──
    else if (type === "telegram-doodle") {
      const doodleCount = thumbnail ? 16 : 42;
      const doodles = Array.from({ length: doodleCount }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4 * speed,
        vy: (Math.random() - 0.5) * 0.4 * speed,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01 * speed,
        scale: thumbnail ? 0.65 : 0.85 + Math.random() * 0.4,
        type: i % 6, // 0: SpeechBubble, 1: PaperPlane, 2: Heart, 3: Star, 4: InfinityLoop, 5: Smiley
      }));

      const drawDoodleItem = (itemType: number, scale: number) => {
        ctx.save();
        ctx.scale(scale, scale);
        ctx.lineWidth = 1.4;

        if (itemType === 0) {
          // Chat bubble
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === "function") {
            (ctx as any).roundRect(-14, -10, 28, 20, 6);
          } else {
            ctx.rect(-14, -10, 28, 20);
          }
          ctx.moveTo(-4, 10);
          ctx.lineTo(-8, 16);
          ctx.lineTo(2, 10);
          ctx.stroke();
          // Text lines inside
          ctx.beginPath();
          ctx.moveTo(-8, -4);
          ctx.lineTo(8, -4);
          ctx.moveTo(-8, 2);
          ctx.lineTo(4, 2);
          ctx.stroke();
        } else if (itemType === 1) {
          // Paper Airplane
          ctx.beginPath();
          ctx.moveTo(16, 0);
          ctx.lineTo(-14, -12);
          ctx.lineTo(-6, 0);
          ctx.lineTo(-14, 12);
          ctx.closePath();
          ctx.moveTo(16, 0);
          ctx.lineTo(-6, 0);
          ctx.stroke();
        } else if (itemType === 2) {
          // Heart
          ctx.beginPath();
          ctx.moveTo(0, 10);
          ctx.bezierCurveTo(-14, 0, -14, -10, 0, -5);
          ctx.bezierCurveTo(14, -10, 14, 0, 0, 10);
          ctx.stroke();
        } else if (itemType === 3) {
          // Sparkle 4-point star
          ctx.beginPath();
          ctx.moveTo(0, -14);
          ctx.quadraticCurveTo(0, 0, 14, 0);
          ctx.quadraticCurveTo(0, 0, 0, 14);
          ctx.quadraticCurveTo(0, 0, -14, 0);
          ctx.quadraticCurveTo(0, 0, 0, -14);
          ctx.stroke();
        } else if (itemType === 4) {
          // Infinity Loop (Loopin brand motif)
          ctx.beginPath();
          ctx.arc(-7, 0, 6, 0, Math.PI * 2);
          ctx.arc(7, 0, 6, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Smiley face
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.stroke();
          // Eyes
          ctx.beginPath();
          ctx.arc(-4, -3, 1.5, 0, Math.PI * 2);
          ctx.arc(4, -3, 1.5, 0, Math.PI * 2);
          ctx.fill();
          // Smile
          ctx.beginPath();
          ctx.arc(0, 1, 6, 0.2 * Math.PI, 0.8 * Math.PI);
          ctx.stroke();
        }
        ctx.restore();
      };

      const render = () => {
        if (!thumbnail && !isTabVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        clearBackground();

        for (const d of doodles) {
          if (shouldAnimate) {
            d.x += d.vx;
            d.y += d.vy;
            d.rot += d.rotSpeed;

            if (d.x < -30) d.x = width + 30;
            if (d.x > width + 30) d.x = -30;
            if (d.y < -30) d.y = height + 30;
            if (d.y > height + 30) d.y = -30;
          }

          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot);

          // Subtle doodle color (accent or soft white outline)
          const isAccent = d.type === 4 || d.type === 3;
          ctx.strokeStyle = isAccent ? accentColor : "rgba(255, 255, 255, 0.16)";
          ctx.fillStyle = isAccent ? accentColor : "rgba(255, 255, 255, 0.16)";

          drawDoodleItem(d.type, d.scale);
          ctx.restore();
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    // ── 3. Warp Starfield ──
    else if (type === "starfield") {
      const numStars = Math.floor(thumbnail ? 50 : (config.particleCount || 160));
      const stars = Array.from({ length: numStars }, () => {
        const z = Math.random() * (width - 20) + 10;
        return {
          x: (Math.random() - 0.5) * width * 1.8,
          y: (Math.random() - 0.5) * height * 1.8,
          z,
          pz: z + (thumbnail ? 16 : 28),
        };
      });

      const render = () => {
        if (!thumbnail && !isTabVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        clearBackground();

        const vOffset = (config.verticalOffset || 0) / 100;
        const cx = width / 2;
        const cy = height * (0.5 - vOffset * 0.4);
        const starSpeed = (shouldAnimate ? (thumbnail ? 2.0 : 3.0) : 0.05) * speed;

        for (const s of stars) {
          s.pz = s.z;
          if (shouldAnimate) {
            s.z -= starSpeed;
            if (s.z <= 10) {
              s.z = width;
              s.pz = width;
              s.x = (Math.random() - 0.5) * width * 1.8;
              s.y = (Math.random() - 0.5) * height * 1.8;
            }
          }

          const k = (thumbnail ? 110 : 220) / s.z;
          const px = s.x * k + cx;
          const py = s.y * k + cy;

          const prevK = (thumbnail ? 110 : 220) / s.pz;
          const prevPx = s.x * prevK + cx;
          const prevPy = s.y * prevK + cy;

          if (px >= 0 && px < width && py >= 0 && py < height) {
            const depth = Math.max(0, 1 - s.z / width);
            ctx.lineWidth = Math.max(0.8, depth * 2);
            ctx.strokeStyle = depth > 0.65 ? accentColor : `rgba(255, 255, 255, ${depth * 0.8})`;

            ctx.beginPath();
            ctx.moveTo(prevPx, prevPy);
            ctx.lineTo(px, py);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(px, py, Math.max(0.6, depth * 1.5), 0, Math.PI * 2);
            ctx.fillStyle = depth > 0.65 ? accentColor : "#ffffff";
            ctx.fill();
          }
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    // ── 4. Neon Waves (Harmonic Silk Mathematical Waves) ──
    else if (type === "waves" || type === "aurora") {
      let t = 0;
      const ribbons = Math.min(8, Math.max(2, config.ribbonCount || 5));
      const amp = config.waveAmp || 42;
      const freq = config.waveFreq || 0.003;
      const vOffset = (config.verticalOffset || 0) / 100;

      const render = () => {
        if (!thumbnail && !isTabVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        clearBackground();

        if (shouldAnimate) {
          t += 0.015 * speed;
        }

        const baselineY = height * (0.5 - vOffset * 0.4);

        for (let i = 0; i < ribbons; i++) {
          const frac = (i + 1) / (ribbons + 1);
          const phase = i * 0.8;
          const currentAmp = amp * (0.8 + frac * 0.6) * (thumbnail ? 0.6 : 1.0);

          ctx.beginPath();
          ctx.moveTo(0, height);

          const step = thumbnail ? 12 : 6;
          for (let x = 0; x <= width + step; x += step) {
            const y1 = Math.sin(x * freq + t + phase) * currentAmp;
            const y2 = Math.cos(x * freq * 0.7 - t * 0.8 + phase * 1.2) * (currentAmp * 0.5);
            const y = baselineY + y1 + y2 + (i - ribbons / 2) * (thumbnail ? 10 : 24);
            ctx.lineTo(x, y);
          }

          ctx.lineTo(width, height);
          ctx.closePath();

          const grad = ctx.createLinearGradient(0, baselineY - currentAmp, 0, height);
          const alpha = thumbnail ? 0.35 : 0.15 + frac * 0.15;
          grad.addColorStop(0, hexOrRgbToRgba(accentColor, alpha));
          grad.addColorStop(1, "rgba(9, 9, 11, 0.05)");

          ctx.fillStyle = i % 2 === 0 ? grad : `rgba(255, 255, 255, ${alpha * 0.35})`;
          ctx.fill();

          ctx.lineWidth = thumbnail ? 1.0 : 1.6;
          ctx.strokeStyle = i % 2 === 0 ? accentColor : "rgba(255, 255, 255, 0.4)";
          ctx.stroke();
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    // ── 5. Particle Vortex (Swirling Gravitational Singularity) ──
    else if (type === "vortex") {
      let t = 0;
      const count = thumbnail ? 40 : (config.particleCount || 130);
      const particles = Array.from({ length: count }, () => ({
        radius: Math.random() * Math.min(width, height) * 0.45 + 10,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (0.01 + Math.random() * 0.02) * speed,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.3,
      }));

      const render = () => {
        if (!thumbnail && !isTabVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        clearBackground();

        const cx = width / 2;
        const cy = height / 2;

        if (shouldAnimate) {
          t += 0.02 * speed;
        }

        for (const p of particles) {
          if (shouldAnimate) {
            p.angle += p.angularSpeed;
            p.radius -= 0.25 * speed;
            if (p.radius <= 5) {
              p.radius = Math.min(width, height) * 0.45;
              p.angle = Math.random() * Math.PI * 2;
            }
          }

          const px = cx + Math.cos(p.angle) * p.radius;
          const py = cy + Math.sin(p.angle) * (p.radius * 0.7);

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.radius < 60 ? accentColor : `rgba(255, 255, 255, ${p.alpha})`;
          ctx.fill();
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    // ── 6. Neural Network Constellation ──
    else if (type === "constellation") {
      const nodeCount = Math.floor(thumbnail ? 18 : (config.particleCount || 55));
      const maxDist = thumbnail ? 50 : 120;
      const nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6 * speed,
        vy: (Math.random() - 0.5) * 0.6 * speed,
        r: Math.random() * 1.6 + 1.0,
      }));

      const render = () => {
        if (!thumbnail && !isTabVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        clearBackground();

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
              const alpha = (1 - dist / maxDist) * (thumbnail ? 0.45 : 0.28);
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

    // ── 7. Cyber Rain ──
    else if (type === "matrix") {
      const fontSize = thumbnail ? 8 : 13;
      const columns = Math.floor(width / fontSize);
      const drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -40));
      const glyphs = "0123456789ABCDEF<>/*&+=#@{}[]~";

      const render = () => {
        if (!thumbnail && !isTabVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        ctx.fillStyle = "rgba(9, 9, 11, 0.25)";
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const char = glyphs[Math.floor(Math.random() * glyphs.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          // Leading bright glyph
          ctx.fillStyle = "#ffffff";
          ctx.fillText(char, x, y);

          // Stream glyph
          ctx.fillStyle = accentColor;
          ctx.fillText(char, x, y - fontSize);

          if (shouldAnimate) {
            if (y > height && Math.random() > 0.975) {
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

    // ── 8. Fireflies ──
    else if (type === "fireflies") {
      const numFlies = Math.floor(thumbnail ? 16 : (config.particleCount || 40));
      const flies = Array.from({ length: numFlies }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8 * speed,
        vy: (Math.random() - 0.5) * 0.8 * speed,
        r: Math.random() * 2 + 1.2,
        phase: Math.random() * Math.PI * 2,
        blinkSpeed: Math.random() * 0.04 + 0.02,
      }));

      const render = () => {
        if (!thumbnail && !isTabVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        clearBackground();

        for (const f of flies) {
          if (shouldAnimate) {
            f.x += f.vx;
            f.y += f.vy;
            f.phase += f.blinkSpeed * speed;

            if (f.x < 0) f.x = width;
            if (f.x > width) f.x = 0;
            if (f.y < 0) f.y = height;
            if (f.y > height) f.y = 0;
          }

          const brightness = (Math.sin(f.phase) + 1) * 0.5;
          const glowR = f.r * (thumbnail ? 3 : 5) * brightness;

          if (glowR > 0) {
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowR);
            g.addColorStop(0, accentColor);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(f.x, f.y, glowR, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.9})`;
          ctx.fill();
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    // ── 9. Synthwave 80s Grid ──
    else if (type === "retro-grid") {
      let gridOffset = 0;

      const render = () => {
        if (!thumbnail && !isTabVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        clearBackground();

        if (shouldAnimate) {
          gridOffset = (gridOffset + 0.02 * speed) % 1;
        }

        const horizonY = height * 0.55;
        const sunX = width / 2;
        const sunRadius = thumbnail ? 24 : 55;

        // Sun
        const sunGrad = ctx.createLinearGradient(sunX, horizonY - sunRadius * 2, sunX, horizonY);
        sunGrad.addColorStop(0, "#fbbf24");
        sunGrad.addColorStop(1, "#f43f5e");
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, horizonY - sunRadius * 0.2, sunRadius, Math.PI, 0, false);
        ctx.fill();

        // Sun slices
        ctx.fillStyle = baseBgColor;
        const sliceCount = thumbnail ? 3 : 6;
        for (let s = 1; s <= sliceCount; s++) {
          const sliceH = (s / sliceCount) * (thumbnail ? 3 : 6);
          const sliceY = horizonY - sunRadius * 0.2 - s * (thumbnail ? 5 : 10);
          ctx.fillRect(sunX - sunRadius, sliceY, sunRadius * 2, sliceH);
        }

        // Horizon line
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(width, horizonY);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Perspective grid lines
        const groundHeight = height - horizonY;
        const numHorizLines = thumbnail ? 7 : 14;
        for (let i = 0; i < numHorizLines; i++) {
          const p = (i + gridOffset) / numHorizLines;
          const y = horizonY + Math.pow(p, 2.2) * groundHeight;
          const alpha = Math.min(0.6, Math.pow(p, 1.2) * 0.6);
          ctx.strokeStyle = `rgba(250, 204, 21, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        const numVertLines = thumbnail ? 10 : 22;
        for (let i = -numVertLines / 2; i <= numVertLines / 2; i++) {
          const bottomX = sunX + i * (width / (thumbnail ? 8 : 12));
          ctx.strokeStyle = "rgba(250, 204, 21, 0.22)";
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

    // ── 10. Topographic Elevation Contours (Enhanced Customization) ──
    else if (type === "topographic") {
      let t = 0;
      const vOffset = (config.verticalOffset || 0) / 100;
      const numLines = thumbnail ? 8 : Math.max(4, Math.min(24, config.contourDensity || 14));
      const amp = (config.waveAmp || 40) * (thumbnail ? 0.4 : 1.0);
      const freqMult = config.waveFreq ? config.waveFreq / 0.003 : 1.0;
      const lineThick = config.lineThickness || 1.5;

      const render = () => {
        if (!thumbnail && !isTabVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        clearBackground();

        if (shouldAnimate) {
          t += 0.008 * speed;
        }

        const centerY = height * (0.5 - vOffset * 0.45);

        for (let i = 0; i < numLines; i++) {
          const frac = (i + 1) / (numLines + 1);
          const baseRadius = frac * Math.max(width, height) * 0.75;
          const isAccent = i % 3 === 0;

          ctx.beginPath();
          ctx.lineWidth = isAccent ? lineThick * (thumbnail ? 0.8 : 1.1) : lineThick * 0.7;
          ctx.strokeStyle = isAccent
            ? accentColor
            : `rgba(255, 255, 255, ${thumbnail ? 0.25 : 0.08 + frac * 0.12})`;

          const points = thumbnail ? 24 : 64;
          for (let p = 0; p <= points; p++) {
            const angle = (p / points) * Math.PI * 2;
            const wave1 = Math.sin(angle * 3 * freqMult + t + i * 0.4) * (amp * 0.55);
            const wave2 = Math.cos(angle * 5 * freqMult - t * 0.8 + i * 0.2) * (amp * 0.35);
            const r = baseRadius + wave1 + wave2;

            const px = width * 0.5 + Math.cos(angle) * r * (width / Math.max(width, height));
            const py = centerY + Math.sin(angle) * r;

            if (p === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.closePath();
          ctx.stroke();
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }

    // ── 11. WebGL Fluid Mesh ──
    else if (type === "webgl-mesh") {
      let t = 0;
      const vOffset = (config.verticalOffset || 0) / 100;
      const cols = thumbnail ? 10 : 22;
      const rows = thumbnail ? 7 : 14;

      const render = () => {
        if (!thumbnail && !isTabVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        clearBackground();

        if (shouldAnimate) {
          t += 0.012 * speed;
        }

        const cellW = width / cols;
        const cellH = height / rows;
        const centerYShift = vOffset * height * 0.45;

        ctx.lineWidth = thumbnail ? 0.8 : 1.0;

        for (let r = 0; r <= rows; r++) {
          ctx.beginPath();
          for (let c = 0; c <= cols; c++) {
            const baseX = c * cellW;
            const baseY = r * cellH + centerYShift;

            const waveX = Math.sin(c * 0.4 + t + r * 0.2) * (thumbnail ? 4 : 14);
            const waveY = Math.cos(r * 0.5 - t + c * 0.3) * (thumbnail ? 5 : 16);
            const px = baseX + waveX;
            const py = baseY + waveY;

            if (c === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.strokeStyle = `rgba(250, 204, 21, ${thumbnail ? 0.22 : 0.08 + (r / rows) * 0.12})`;
          ctx.stroke();
        }

        for (let c = 0; c <= cols; c++) {
          ctx.beginPath();
          for (let r = 0; r <= rows; r++) {
            const baseX = c * cellW;
            const baseY = r * cellH + centerYShift;

            const waveX = Math.sin(c * 0.4 + t + r * 0.2) * (thumbnail ? 4 : 14);
            const waveY = Math.cos(r * 0.5 - t + c * 0.3) * (thumbnail ? 5 : 16);
            const px = baseX + waveX;
            const py = baseY + waveY;

            if (r === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.strokeStyle = `rgba(255, 255, 255, ${thumbnail ? 0.14 : 0.06})`;
          ctx.stroke();
        }

        if (shouldAnimate) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      render();
    }
  } catch (err) {
    console.warn("ChatBackground render error:", err);
  }

  return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
      if (!thumbnail) {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [type, accentColor, baseBgColor, shouldAnimate, config, thumbnail, performanceMode, isHovered]);

  return (
    <div
      className={`chat-bg-layer chat-bg-${type} ${thumbnail ? "chat-bg-thumbnail" : ""} ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="chat-bg-canvas" />

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
