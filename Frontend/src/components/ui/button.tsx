import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:translate-y-px",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-white/10 bg-[#121D2B] text-[#E8ECEF] shadow-sm hover:bg-white/5 hover:text-[#E8ECEF]",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        sun: "bg-sun text-foreground shadow-sm hover:bg-sun/90 active:translate-y-px",
        cream:
          "bg-[#121D2B] text-[#E8ECEF] border border-white/10 shadow-sm hover:bg-[#152335] active:translate-y-px",
        voice:
          "bg-primary text-primary-foreground shadow-voice hover:scale-105 hover:shadow-voice-active active:scale-95",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-xl px-3.5 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-10 w-10 rounded-2xl",
        touch: "min-h-14 rounded-2xl px-7 py-4 text-base font-extrabold",
        voice: "h-28 w-28 rounded-full text-xl font-extrabold sm:h-32 sm:w-32",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
