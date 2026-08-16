import React from "react";

interface AICoachIconProps {
  size?: number;
  className?: string;
  active?: boolean;
  animate?: boolean;
}

/**
 * Precision geometric AI Coach emblem for OneDay.
 * Replaces generic robot/chatbot icons with a disciplined, high-contrast,
 * architectural intelligence symbol (faceted 4-point prism nexus).
 */
export function AICoachIcon({
  size = 16,
  className = "",
  active = false,
  animate = false,
}: AICoachIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${animate ? "animate-pulse" : ""} ${className}`}
      aria-label="OneDay AI Coach"
    >
      {/* Outer 4-point geometric intelligence prism */}
      <path
        d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
        fill="currentColor"
        fillOpacity={active ? "1" : "0.85"}
      />

      {/* Internal disciplined diamond core cutout for optical clarity at small scales */}
      <path
        d="M12 7.5L15.5 12L12 16.5L8.5 12L12 7.5Z"
        fill={active ? "#09090b" : "#09090b"}
      />

      {/* Center sharp monolith micro-core */}
      <circle
        cx="12"
        cy="12"
        r="1.25"
        fill="currentColor"
        fillOpacity={active ? "1" : "0.9"}
      />
    </svg>
  );
}

interface AICoachAvatarProps {
  size?: "sm" | "md" | "lg" | number;
  active?: boolean;
  animate?: boolean;
  className?: string;
}

/**
 * Packaged avatar badge for AI Coach everywhere in the app.
 * Provides the perfect high-contrast surface, fine border, and optical centering.
 */
export function AICoachAvatar({
  size = "md",
  active = false,
  animate = false,
  className = "",
}: AICoachAvatarProps) {
  let boxDimensions = "w-7 h-7";
  let iconSize = 13;
  let rounded = "rounded-lg";

  if (size === "sm") {
    boxDimensions = "w-6 h-6";
    iconSize = 12;
    rounded = "rounded-md";
  } else if (size === "md") {
    boxDimensions = "w-7 h-7";
    iconSize = 14;
    rounded = "rounded-lg";
  } else if (size === "lg") {
    boxDimensions = "w-9 h-9";
    iconSize = 18;
    rounded = "rounded-xl";
  } else if (typeof size === "number") {
    boxDimensions = "";
    iconSize = Math.round(size * 0.55);
    rounded = "rounded-lg";
  }

  const customStyle = typeof size === "number" ? { width: size, height: size } : {};

  return (
    <div
      style={customStyle}
      className={`
        ${boxDimensions} ${rounded} flex items-center justify-center shrink-0 transition-all select-none relative overflow-hidden
        ${
          active
            ? "bg-white/[0.09] text-white border border-white/[0.18] shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]"
            : "bg-white/[0.04] text-slate-300 border border-white/[0.07] hover:border-white/[0.14] hover:text-white"
        }
        ${className}
      `}
    >
      <AICoachIcon size={iconSize} active={active} animate={animate} />
    </div>
  );
}
