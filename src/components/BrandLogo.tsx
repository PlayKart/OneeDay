import React from "react";
import { useStore } from "../store/useStore";

interface BrandLogoProps {
  size?: number;
  className?: string;
  styleOverride?: "monolith" | "infinite" | "eclipse" | "zen";
}

export function BrandLogo({ size = 24, className = "", styleOverride }: BrandLogoProps) {
  const { selectedLogoStyle } = useStore();
  const style = styleOverride || selectedLogoStyle;

  switch (style) {
    case "monolith":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-300 hover:scale-105 ${className}`}
        >
          {/* Ambient Glow */}
          <defs>
            <radialGradient id="monolithGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="monolithGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill="url(#monolithGlow)" />
          {/* Clean architectural pillars */}
          <rect x="9.5" y="5" width="5" height="14" rx="1.5" fill="url(#monolithGrad)" className="drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]" />
          <line x1="12" y1="6" x2="12" y2="18" stroke="#09090b" strokeWidth="0.5" strokeDasharray="1 1" />
        </svg>
      );

    case "infinite":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-300 hover:scale-105 ${className}`}
        >
          <defs>
            <linearGradient id="infiniteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
          {/* Perfect hyper-thin infinity curve with a refined path */}
          <path
            d="M7 9C4.5 9 3 10.5 3 12C3 13.5 4.5 15 7 15C9.5 15 11.5 13 13.5 11C15.5 9 17.5 7 20 7C22.5 7 24 8.5 24 10C24 11.5 22.5 13 20 13C17.5 13 15.5 11 13.5 9C11.5 7 9.5 5 7 5C4.5 5 3 6.5 3 8"
            stroke="url(#infiniteGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
          />
        </svg>
      );

    case "eclipse":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-300 hover:scale-105 ${className}`}
        >
          <defs>
            <linearGradient id="eclipseGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="60%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          {/* Modern astronomical alignment logo */}
          <circle cx="12" cy="12" r="8" stroke="url(#eclipseGrad)" strokeWidth="1.5" className="opacity-40" />
          <circle cx="10" cy="12" r="6" fill="url(#eclipseGrad)" className="drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
          <circle cx="13.5" cy="10.5" r="5" fill="#030303" />
        </svg>
      );

    case "zen":
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-300 hover:scale-105 ${className}`}
        >
          <defs>
            <linearGradient id="zenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          {/* Organic, high-contrast, pure Japanese minimalist tear arches */}
          <path
            d="M12 3C12 3 6 9 6 13C6 16.3137 8.68629 19 12 19C15.3137 19 18 16.3137 18 13C18 9 12 3 12 3Z"
            stroke="url(#zenGrad)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 7C12 7 9 11 9 13.5C9 15.1569 10.3431 16.5 12 16.5"
            stroke="#ffffff"
            strokeWidth="1"
            strokeLinecap="round"
            className="opacity-75"
          />
        </svg>
      );
  }
}
