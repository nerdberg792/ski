import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all transition-opacity duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-white/90 text-slate-900 hover:bg-white hover:opacity-100 opacity-90 shadow-[0_0_12px_rgba(244,114,182,0.4)]",
        secondary: "bg-white/10 text-white hover:bg-white/15 hover:opacity-100 opacity-90 shadow-[0_0_12px_rgba(244,114,182,0.4)]",
        ghost: "text-white/80 hover:bg-white/10 hover:text-white hover:opacity-100 opacity-72 shadow-[0_0_8px_rgba(244,114,182,0.3)]",
        glow: "bg-gradient-to-r from-pink-400 via-purple-400 to-blue-500 text-slate-900 shadow-lg shadow-purple-900/30 hover:opacity-95 opacity-90 shadow-[0_0_16px_rgba(244,114,182,0.5)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

