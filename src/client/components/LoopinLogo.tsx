import React from "react";
import { useSettings } from "../hooks/useSettings";

interface LoopinLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const LoopinLogo: React.FC<LoopinLogoProps> = ({
  size = 32,
  className = "",
  glow = true,
}) => {
  const { settings } = useSettings();
  const color = settings.themeColor || "var(--primary-accent)";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      width={size}
      height={size}
      className={className}
      style={{ display: "block" }}
    >
      <defs>
        {glow && (
          <filter id={`loopin-glow-${size}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>
      <rect width="64" height="64" rx="16" fill="#09090b" />
      <rect width="64" height="64" rx="16" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      <path
        d="M22 24C16.477 24 12 28.477 12 34C12 39.523 16.477 44 22 44C27.523 44 32 39 32 34C32 29 36.477 24 42 24C47.523 24 52 28.477 52 34C52 39.523 47.523 44 42 44C36.477 44 32 39 32 34C32 29 27.523 24 22 24Z"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glow ? `url(#loopin-glow-${size})` : undefined}
      />
    </svg>
  );
};
