import React from "react";
import { motion } from "motion/react";

interface MonolithLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | number;
  className?: string;
}

export function MonolithLogo({ size = "md", className = "" }: MonolithLogoProps) {
  let boxSize = 44;

  if (size === "sm") {
    boxSize = 32;
  } else if (size === "md") {
    boxSize = 44;
  } else if (size === "lg") {
    boxSize = 64;
  } else if (size === "xl") {
    boxSize = 80;
  } else if (typeof size === "number") {
    boxSize = size;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative flex items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.05] backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden shrink-0 select-none ${className}`}
      style={{
        width: boxSize,
        height: boxSize,
      }}
    >
      {/* Soft white reflection overlays mimicking premium glass depth */}
      <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-white/[0.06] pointer-events-none" />
      
      {/* Monolith Pillar SVG */}
      <svg
        viewBox="0 0 100 100"
        fill="currentColor"
        className="text-white w-[55%] h-[55%] pointer-events-none"
      >
        {/* Vector representation of the beveled vertical monolith pillar:
            - Left edge is sharp at X=41
            - Bottom edge is sharp at Y=80
            - Right edge is sharp at X=59
            - Top left edge is sharp at Y=20, X=41
            - Top-right corner is elegantly beveled/chamfered from (53,20) to (59,26)
        */}
        <path d="M 41 20 L 53 20 L 59 26 L 59 80 L 41 80 Z" />
      </svg>
    </motion.div>
  );
}
