import React from "react";
import { Link } from "@tanstack/react-router";
import brainLogoImg from "@/assets/golden-brain-emblem.png";
import brandLockupImg from "@/assets/brand-lockup-transparent.png";

interface AppLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  asLink?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = "md",
  showText = true,
  className = "",
  asLink = true,
}) => {
  const emblemSizes = {
    sm: "w-8 h-9",
    md: "w-10 h-11 sm:w-11 sm:h-12",
    lg: "w-14 h-16 sm:w-16 sm:h-18",
    xl: "w-20 h-23 sm:w-24 sm:h-28",
  };

  const lockupSizes = {
    sm: "h-9 w-auto max-w-[170px]",
    md: "h-11 sm:h-12 w-auto max-w-[210px]",
    lg: "h-14 sm:h-16 w-auto max-w-[280px]",
    xl: "h-20 sm:h-24 w-auto max-w-[400px]",
  };

  const content = (
    <div className={`flex items-center select-none ${className}`}>
      {showText ? (
        <img
          src={brandLockupImg}
          alt="SmritiSetu - Cognitive Care Companion"
          className={`${lockupSizes[size]} object-contain drop-shadow-[0_2px_12px_rgba(245,199,126,0.2)] transition-transform duration-300 group-hover:scale-102`}
          loading="eager"
        />
      ) : (
        <div
          className={`relative shrink-0 ${emblemSizes[size]} transition-transform duration-300 group-hover:scale-105 flex items-center justify-center`}
        >
          <img
            src={brainLogoImg}
            alt="SmritiSetu Brain Emblem"
            className="w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(245,199,126,0.3)]"
            loading="eager"
          />
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        to="/"
        className="group inline-flex items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="SmritiSetu Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};
