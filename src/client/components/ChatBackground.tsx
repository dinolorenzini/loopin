import React, { useRef, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";

interface ChatBackgroundProps {
  className?: string;
}

export const ChatBackground: React.FC<ChatBackgroundProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const { settings } = useSettings();

  const {
    background: type,
    themeColor: accentColor = "#facc15",
    noAnimations = false,
    bgDim = 0.45,
    bgBlur = 0,
    shaderSpeed = 1.0,
  } = settings;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
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

    const isLowEnd = typeof navigator !== "undefined" && (navigator.hardwareConcurrency || 4) <= 4;
    const particleMultiplier = isLowEnd ? 0.45 : 1.0;
    const speed = Math.max(0.1, shaderSpeed);

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

    // ── 1. Warp Starfield (Hyperspace streaks) ──
    if (type === "starfield") {
      const numStars = Math.floor(220 * particleMultiplier);
      const stars = Array.from({ length: numStars }, () => ({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        pz: width,
      }));

      const render = () => {
        if (!isPaused) {
          ctx.fillStyle = "rgba(9, 9, 11, 0.35)";
          ctx.fillRect(0, 0, width, height);

          const cx = width / 2;
          const cy = height / 2;
          const starSpeed = 3.5 * speed;

          for (const s of stars) {
            s.pz = s.z;
            s.z -= starSpeed;
            if (s.z <= 10) {
              s.z = width;
              s.pz = width;
              s.x = (Math.random() - 0.5) * width * 2;
              s.y = (Math.random() - 0.5) * height * 2;
            }

            const k = 220 / s.z;
            const px = s.x * k + cx;
            const py = s.y * k + cy;

            const prevK = 220 / s.pz;
            const prevPx = s.x * prevK + cx;
            const prevPy = s.y * prevK + cy;

            if (px >= 0 && px < width && py >= 0 && py < height) {
              const depth = 1 - s.z / width;
              ctx.lineWidth = Math.max(0.8, depth * 2.5);
              ctx.strokeStyle = depth > 0.7 ? accentColor : `rgba(255, 255, 255, ${depth * 0.8})`;

              ctx.beginPath();
              ctx.moveTo(prevPx, prevPy);
              ctx.lineTo(px, py);
              ctx.stroke();

              // Star head
              ctx.beginPath();
              ctx.arc(px, py, Math.max(0.8, depth * 2), 0, Math.PI * 2);
              ctx.fillStyle = "#ffffff";
              ctx.fill();
            }
          }
        }
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    }

    // ── 2. Interactive Neural Constellation ──
    else if (type === "constellation") {
      const nodeCount = Math.floor(75 * particleMultiplier);
      const maxDist = 130;
      const nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8 * speed,
        vy: (Math.random() - 0.5) * 0.8 * speed,
        r: Math.random() * 2.2 + 1.2,
      }));

      const render = () => {
        if (!isPaused) {
          ctx.clearRect(0, 0, width, height);

          const mouse = mouseRef.current;

          for (let i = 0; i < nodes.length; i++) {
            const p = nodes[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            // Mouse repulsion / attraction
            if (mouse.active) {
              const mdx = mouse.x - p.x;
              const mdy = mouse.y - p.y;
              const mDist = Math.hypot(mdx, mdy);
              if (mDist < 140 && mDist > 0) {
                p.x -= (mdx / mDist) * 1.5;
                p.y -= (mdy / mDist) * 1.5;
              }
            }

            // Node core with glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            ctx.shadowBlur = 6;
            ctx.shadowColor = accentColor;
            ctx.fill();
            ctx.shadowBlur = 0;

            for (let j = i + 1; j < nodes.length; j++) {
              const p2 = nodes[j];
              const dx = p.x - p2.x;
              const dy = p.y - p2.y;
              const dist = Math.hypot(dx, dy);

              if (dist < maxDist) {
                const alpha = (1 - dist / maxDist) * 0.35;
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
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

    // ── 3. Aurora Silk Waves ──
    else if (type === "aurora") {
      let t = 0;
      const ribbons = [
        { color: "rgba(250, 204, 21, 0.12)", yBase: 0.65, amp: 45, freq: 0.0025 },
        { color: "rgba(56, 189, 248, 0.10)", yBase: 0.72, amp: 60, freq: 0.0020 },
        { color: "rgba(192, 132, 252, 0.09)", yBase: 0.78, amp: 50, freq: 0.0030 },
      ];

      const render = () => {
        if (!isPaused) {
          ctx.clearRect(0, 0, width, height);
          t += 0.015 * speed;

          for (const rib of ribbons) {
            ctx.beginPath();
            const y0 = height * rib.yBase;
            ctx.moveTo(0, height);

            for (let x = 0; x <= width; x += 12) {
              const y = y0 + Math.sin(x * rib.freq + t) * rib.amp + Math.cos(x * 0.001 - t * 0.8) * 30;
              ctx.lineTo(x, y);
            }

            ctx.lineTo(width, height);
            ctx.closePath();

            const grad = ctx.createLinearGradient(0, y0 - 80, 0, height);
            grad.addColorStop(0, rib.color);
            grad.addColorStop(1, "rgba(9, 9, 11, 0)");
            ctx.fillStyle = grad;
            ctx.fill();
          }
        }
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    }

    // ── 4. Cyber Rain (Authentic Matrix Stream) ──
    else if (type === "matrix") {
      const fontSize = 14;
      const cols = Math.floor(width / fontSize);
      const drops: number[] = Array.from({ length: cols }, () => Math.floor(Math.random() * -60));
      const chars = "01LOOPIN23456789ｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ";

      const render = () => {
        if (!isPaused) {
          ctx.fillStyle = "rgba(9, 9, 11, 0.18)";
          ctx.fillRect(0, 0, width, height);

          ctx.font = `600 ${fontSize}px monospace`;

          for (let i = 0; i < drops.length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            if (y > 0 && y < height + 30) {
              // Glowing leading head
              ctx.fillStyle = "#ffffff";
              ctx.shadowBlur = 8;
              ctx.shadowColor = accentColor;
              ctx.fillText(char, x, y);
              ctx.shadowBlur = 0;

              // Tail character
              ctx.fillStyle = accentColor;
              const prevChar = chars[Math.floor(Math.random() * chars.length)];
              ctx.fillText(prevChar, x, y - fontSize);
            }

            if (y > height && Math.random() > 0.98) {
              drops[i] = 0;
            }
            drops[i] += 1 * speed;
          }
        }
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    }

    // ── 5. Bioluminescent Fireflies ──
    else if (type === "fireflies") {
      const emberCount = Math.floor(55 * particleMultiplier);
      const embers = Array.from({ length: emberCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.5 + 1.2,
        vy: -(Math.random() * 0.5 + 0.2) * speed,
        vx: (Math.random() - 0.5) * 0.4 * speed,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: (Math.random() * 0.03 + 0.015) * speed,
      }));

      const render = () => {
        if (!isPaused) {
          ctx.clearRect(0, 0, width, height);

          for (const e of embers) {
            e.y += e.vy;
            e.x += e.vx + Math.sin(e.phase) * 0.3;
            e.phase += e.pulseSpeed;

            if (e.y < -20) e.y = height + 20;
            if (e.x < -20) e.x = width + 20;
            if (e.x > width + 20) e.x = -20;

            const alpha = (Math.sin(e.phase) + 1) * 0.5 * 0.85;

            // Soft radiant glow halo
            const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 5);
            grad.addColorStop(0, accentColor);
            grad.addColorStop(0.3, `rgba(250, 204, 21, ${alpha * 0.8})`);
            grad.addColorStop(1, "rgba(250, 204, 21, 0)");

            ctx.beginPath();
            ctx.arc(e.x, e.y, e.r * 5, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
          }
        }
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    }

    // ── 6. Synthwave 80s Cyber Horizon (FIXED & FULLY FUNCTIONAL) ──
    else if (type === "retro-grid") {
      let gridOffset = 0;
      const horizonY = height * 0.55;

      const render = () => {
        if (!isPaused) {
          ctx.clearRect(0, 0, width, height);
          gridOffset = (gridOffset + 0.012 * speed) % 1;

          // Horizon Sun with segment stripes
          const sunRadius = Math.min(width * 0.18, 110);
          const sunX = width / 2;
          const sunY = horizonY;

          // Glowing sun
          const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
          sunGrad.addColorStop(0, "#fde047");
          sunGrad.addColorStop(0.5, accentColor);
          sunGrad.addColorStop(1, "#f43f5e");

          ctx.save();
          ctx.beginPath();
          ctx.arc(sunX, sunY, sunRadius, Math.PI, 0, false);
          ctx.fillStyle = sunGrad;
          ctx.shadowBlur = 30;
          ctx.shadowColor = accentColor;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Sun horizontal blind slices
          ctx.fillStyle = "#09090b";
          for (let slice = 0; slice < 6; slice++) {
            const sliceY = sunY - sunRadius * 0.5 + slice * (sunRadius * 0.11);
            const sliceH = 2 + slice * 1.5;
            ctx.fillRect(sunX - sunRadius - 10, sliceY, (sunRadius + 10) * 2, sliceH);
          }
          ctx.restore();

          // Stars in the upper sky
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          for (let s = 0; s < 40; s++) {
            const sx = (Math.sin(s * 99) * 0.5 + 0.5) * width;
            const sy = (Math.cos(s * 33) * 0.5 + 0.5) * horizonY;
            ctx.fillRect(sx, sy, 1.5, 1.5);
          }

          // Ground Horizon glow line
          ctx.beginPath();
          ctx.moveTo(0, horizonY);
          ctx.lineTo(width, horizonY);
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 15;
          ctx.shadowColor = accentColor;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Ground 3D Perspective Grid
          const groundHeight = height - horizonY;
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 1;

          // Horizontal grid lines with perspective compression
          const numHorizLines = 16;
          for (let i = 0; i < numHorizLines; i++) {
            const p = (i + gridOffset) / numHorizLines;
            // Quadratic perspective curve
            const y = horizonY + Math.pow(p, 2.5) * groundHeight;
            const alpha = Math.min(1, Math.pow(p, 1.2) * 0.65);
            ctx.strokeStyle = `rgba(250, 204, 21, ${alpha})`;

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }

          // Radiating vertical perspective lines converging at (sunX, horizonY)
          const numVertLines = 28;
          for (let i = -numVertLines / 2; i <= numVertLines / 2; i++) {
            const bottomX = sunX + i * (width / 14);
            ctx.strokeStyle = "rgba(250, 204, 21, 0.25)";
            ctx.beginPath();
            ctx.moveTo(sunX, horizonY);
            ctx.lineTo(bottomX, height);
            ctx.stroke();
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
  }, [type, accentColor, noAnimations, shaderSpeed]);

  return (
    <div className={`chat-bg-layer chat-bg-${type} ${className}`} aria-hidden="true">
      {type !== "minimal-dark" && type !== "telegram-doodle" && type !== "geometric-grid" && !noAnimations && (
        <canvas ref={canvasRef} className="chat-bg-canvas" />
      )}
      {type === "telegram-doodle" && <div className="static-bg-doodle" />}
      {type === "geometric-grid" && <div className="static-bg-grid" />}

      {/* Dim & Blur Overlay (Bug 2: Background darkness & blur slider) */}
      <div
        className="chat-bg-overlay"
        style={{
          backgroundColor: `rgba(9, 9, 11, ${bgDim})`,
          backdropFilter: bgBlur > 0 ? `blur(${bgBlur}px)` : "none",
          WebkitBackdropFilter: bgBlur > 0 ? `blur(${bgBlur}px)` : "none",
        }}
      />
    </div>
  );
};
