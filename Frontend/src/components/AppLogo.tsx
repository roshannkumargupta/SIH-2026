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
    md: "size-10 sm:size-11",
    lg: "size-14 sm:size-16",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-3xl",
  };

  const content = (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`relative shrink-0 ${sizeClasses[size]} rounded-2xl overflow-hidden shadow-sm transition-transform duration-200 group-hover:scale-105 border border-primary/20 bg-primary/10 flex items-center justify-center`}
      >
        <img
          src={brainLogoImg}
          alt="SmritiSetu Brain Logo"
          className="w-full h-full object-contain p-1"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-display font-bold tracking-tight text-foreground ${textSizes[size]} transition-colors group-hover:text-primary`}
            >
              SmritiSetu
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold tracking-wide uppercase">
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
        className="group inline-flex items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="SmritiSetu Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};
