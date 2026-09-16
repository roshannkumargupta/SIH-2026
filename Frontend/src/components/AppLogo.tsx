import React from "react";
import { Link } from "@tanstack/react-router";
import brainLogoImg from "@/assets/brain-logo.png";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
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
  const sizeClasses = {
    sm: "size-8",
    md: "size-11 sm:size-12",
    lg: "size-16 sm:size-20",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl sm:text-3xl",
    lg: "text-3xl sm:text-4xl",
  };

  const content = (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        className={`relative shrink-0 ${sizeClasses[size]} rounded-2xl overflow-hidden shadow-md transition-transform duration-200 group-hover:scale-105 border border-sun/30 bg-surface flex items-center justify-center`}
      >
        <img
          src={brainLogoImg}
          alt="SmritiSetu Brain Logo"
          className="w-full h-full object-contain p-0.5"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`font-display font-bold tracking-tight text-cream ${textSizes[size]} transition-colors group-hover:text-sun`}
            >
              SmritiSetu
            </span>
            <span className="hidden sm:inline-block rounded-full bg-sun/15 border border-sun/40 px-2 py-0.5 text-[10px] font-semibold text-sun">
              स्मृति सेतु
            </span>
          </div>
          <span className="text-[10px] text-cream/70 font-medium tracking-wide uppercase">
            Cognitive Care Companion
          </span>
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        to="/"
        className="group inline-flex items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sun/60"
        aria-label="SmritiSetu Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};
