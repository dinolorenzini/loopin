import React, { useRef, useEffect } from "react";
import type { BackgroundType } from "../hooks/useSettings";

interface ChatBackgroundProps {
  type: BackgroundType;
  accentColor?: string;
  noAnimations?: boolean;
}

export const ChatBackground: React.FC<ChatBackgroundProps> = ({
  type,
  accentColor = "#facc15",
  noAnimations = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // If animations are disabled or type is a static background, do not run canvas animation
    if (noAnimations || type === "minimal-dark" || type === "telegram-doodle" || type === "geometric-grid") {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Performance adaptation for lower-end devices like Chromebooks (Item 21)
    const isLowEnd = typeof navigator !== "undefined" && (navigator.hardwareConcurrency || 4) <= 4;
    const particleMultiplier = isLowEnd ? 0.35 : 1.0;

    let isPaused = false;
    const handleVisibilityChange = () => {
      isPaused = document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // ── 1. Starfield Engine (yukiloz7 inspired) ──
    if (type === "starfield") {
      const numStars = Math.floor(180 * particleMultiplier);
      const stars: { x: number; y: number; z: number; pz: number }[] = [];
      const speed = 2.2;

      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: (Math.random() - 0.5) * width * 2,
          y: (Math.random() - 0.5) * height * 2,
          z: Math.random() * width,
          pz: width,
        });
      }

      const render = () => {
        if (!isPaused) {
          ctx.fillStyle = "rgba(9, 9, 11, 0.4)";
          ctx.fillRect(0, 0, width, height);

          const cx = width / 2;
          const cy = height / 2;

          ctx.strokeStyle = accentColor;
          ctx.fillStyle = "#ffffff";

          for (const s of stars) {
            s.z -= speed;
            if (s.z <= 0) {
              s.z = width;
              s.pz = width;
              s.x = (Math.random() - 0.5) * width * 2;
              s.y = (Math.random() - 0.5) * height * 2;
            }

            const k = 180 / s.z;
            const px = s.x * k + cx;
            const py = s.y * k + cy;

            if (px >= 0 && px < width && py >= 0 && py < height) {
              const size = Math.max(0.6, (1 - s.z / width) * 2.5);
              const prevK = 180 / s.pz;
              const prevPx = s.x * prevK + cx;
              const prevPy = s.y * prevK + cy;

              ctx.beginPath();
              ctx.moveTo(prevPx, prevPy);
              ctx.lineTo(px, py);
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(px, py, size, 0, Math.PI * 2);
              ctx.fill();
            }
            s.pz = s.z;
          }
        }
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    }

    // ── 2. Constellation Network Engine (adrian-ortega inspired) ──
    else if (type === "constellation") {
      const nodeCount = Math.floor(70 * particleMultiplier);
      const maxDistance = 110;
      const nodes: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];

      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.7,
          vy: (Math.random() - 0.5) * 0.7,
          radius: Math.random() * 2 + 1,
        });
      }

      const render = () => {
        if (!isPaused) {
          ctx.clearRect(0, 0, width, height);

          for (let i = 0; i < nodes.length; i++) {
            const p = nodes[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.fill();

            for (let j = i + 1; j < nodes.length; j++) {
              const p2 = nodes[j];
              const dx = p.x - p2.x;
              const dy = p.y - p2.y;
              const dist = Math.hypot(dx, dy);

              if (dist < maxDistance) {
                const alpha = (1 - dist / maxDistance) * 0.25;
                ctx.strokeStyle = `rgba(250, 204, 21, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }
          }
        }
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    }

    // ── 3. Aurora Liquid Waves Engine (soju22 inspired) ──
    else if (type === "aurora") {
      let step = 0;
      const waveCount = 3;

      const render = () => {
        if (!isPaused) {
          ctx.clearRect(0, 0, width, height);
          step += 0.015;

          for (let i = 0; i < waveCount; i++) {
            ctx.beginPath();
            const yOffset = height * (0.6 + i * 0.12);
            ctx.moveTo(0, height);

            for (let x = 0; x <= width; x += 15) {
              const y = yOffset + Math.sin(x * 0.003 + step + i * 1.5) * 45 + Math.cos(x * 0.002 - step) * 25;
              ctx.lineTo(x, y);
            }

            ctx.lineTo(width, height);
            ctx.closePath();

            const gradient = ctx.createLinearGradient(0, yOffset - 50, 0, height);
            gradient.addColorStop(0, i === 0 ? "rgba(250, 204, 21, 0.08)" : "rgba(245, 158, 11, 0.05)");
            gradient.addColorStop(1, "rgba(9, 9, 11, 0)");
            ctx.fillStyle = gradient;
            ctx.fill();
          }
        }
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    }

    // ── 4. Cyber Rain / Matrix Engine ──
    else if (type === "matrix") {
      const fontSize = 14;
      const columns = Math.floor(width / fontSize);
      const drops: number[] = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));
      const chars = "01LOOPIN23456789";

      const render = () => {
        if (!isPaused) {
          ctx.fillStyle = "rgba(9, 9, 11, 0.15)";
          ctx.fillRect(0, 0, width, height);

          ctx.fillStyle = "rgba(250, 204, 21, 0.65)";
          ctx.font = `${fontSize}px monospace`;

          for (let i = 0; i < drops.length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            if (y > 0 && y < height) {
              ctx.fillText(char, x, y);
            }

            if (y > height && Math.random() > 0.975) {
              drops[i] = 0;
            }
            drops[i]++;
          }
        }
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    }

    // ── 5. Floating Fireflies / Embers Engine ──
    else if (type === "fireflies") {
      const emberCount = Math.floor(45 * particleMultiplier);
      const embers = Array.from({ length: emberCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 1,
        vy: -(Math.random() * 0.6 + 0.2),
        vx: (Math.random() - 0.5) * 0.3,
        alpha: Math.random(),
        pulseSpeed: Math.random() * 0.03 + 0.01,
      }));

      const render = () => {
        if (!isPaused) {
          ctx.clearRect(0, 0, width, height);

          for (const e of embers) {
            e.y += e.vy;
            e.x += e.vx;
            e.alpha += e.pulseSpeed;

            if (e.y < -10) e.y = height + 10;
            if (e.x < -10) e.x = width + 10;
            if (e.x > width + 10) e.x = -10;

            const opacity = (Math.sin(e.alpha) + 1) * 0.5 * 0.7;

            ctx.beginPath();
            ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(250, 204, 21, ${opacity})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#facc15";
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    }

    // ── 6. Retro Synth Grid Engine ──
    else if (type === "retro-grid") {
      let offset = 0;

      const render = () => {
        if (!isPaused) {
          ctx.clearRect(0, 0, width, height);
          offset = (offset + 0.6) % 30;

          const horizon = height * 0.55;
          ctx.strokeStyle = "rgba(250, 204, 21, 0.12)";
          ctx.lineWidth = 1;

          // Vertical perspective lines
          const fovLines = 24;
          for (let i = -fovLines; i <= fovLines; i++) {
            const xBottom = width / 2 + i * 40;
            ctx.beginPath();
            ctx.moveTo(width / 2, horizon);
            ctx.lineTo(xBottom, height);
            ctx.stroke();
          }

          // Horizontal moving lines
          for (let y = horizon; y < height; y += (y - horizon) * 0.2 + 8) {
            const yCurrent = y + offset * ((y - horizon) / height);
            if (yCurrent < height) {
              ctx.beginPath();
              ctx.moveTo(0, yCurrent);
              ctx.lineTo(width, yCurrent);
              ctx.stroke();
            }
          }
        }
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
    };
  }, [type, accentColor, noAnimations]);

  return (
    <div className={`chat-bg-layer chat-bg-${type}`} aria-hidden="true">
      {type !== "minimal-dark" && type !== "telegram-doodle" && type !== "geometric-grid" && !noAnimations && (
        <canvas ref={canvasRef} className="chat-bg-canvas" />
      )}
      {type === "telegram-doodle" && <div className="static-bg-doodle" />}
      {type === "geometric-grid" && <div className="static-bg-grid" />}
    </div>
  );
};
