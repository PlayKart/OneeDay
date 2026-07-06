import React from "react";

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 24, className = "" }: BrandLogoProps) {
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
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      {/* Perfect ultra-thin infinity curve in high-contrast silver/white representing absolute consistency */}
      <path
        d="M7 9C4.5 9 3 10.5 3 12C3 13.5 4.5 15 7 15C9.5 15 11.5 13 13.5 11C15.5 9 17.5 7 20 7C22.5 7 24 8.5 24 10C24 11.5 22.5 13 20 13C17.5 13 15.5 11 13.5 9C11.5 7 9.5 5 7 5C4.5 5 3 6.5 3 8"
        stroke="url(#brandGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
