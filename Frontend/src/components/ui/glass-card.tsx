import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  variant?: "default" | "mint" | "sky" | "amber" | "lavender" | "rose" | "subtle";
}

const variantStyles: Record<string, string> = {
  default: "bg-[#121D2B] border-white/8 shadow-xl text-[#E8ECEF]",
  mint: "bg-[#121D2B] border-[#6FAF9A]/25 shadow-xl text-[#E8ECEF]",
  sky: "bg-[#121D2B] border-sky-500/25 shadow-xl text-[#E8ECEF]",
  amber: "bg-[#121D2B] border-amber-500/25 shadow-xl text-[#E8ECEF]",
  lavender: "bg-[#121D2B] border-purple-500/25 shadow-xl text-[#E8ECEF]",
  rose: "bg-[#121D2B] border-rose-500/25 shadow-xl text-[#E8ECEF]",
  subtle: "bg-[#121D2B]/80 border-white/8 shadow-md text-[#E8ECEF]",
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hoverEffect = false, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-3xl border backdrop-blur-md transition-all duration-300 text-foreground",
          variantStyles[variant] || variantStyles["default"],
          hoverEffect && "hover:-translate-y-1 hover:shadow-2xl hover:border-white/15",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GlassCard.displayName = "GlassCard";
