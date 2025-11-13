import * as React from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  nestedLevel?: number;
}

interface DialogBackdropProps {
  className?: string;
  onClick?: () => void;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  nestedLevel?: number;
}

const DialogBackdrop = React.forwardRef<HTMLDivElement, DialogBackdropProps>(
  ({ className, onClick, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-transparent backdrop-blur-sm transition-all duration-200",
        "data-ending-style:opacity-0 data-starting-style:opacity-0",
        className
      )}
      onClick={onClick}
      {...props}
    />
  )
);
DialogBackdrop.displayName = "DialogBackdrop";

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, nestedLevel = 0, ...props }, ref) => {
    const style = {
      "--nested-dialogs": nestedLevel,
    } as React.CSSProperties;

    return (
      <div
        ref={ref}
        className={cn(
          "transition-[scale,opacity,translate] duration-200 ease-in-out will-change-transform",
          "data-ending-style:opacity-0 data-starting-style:opacity-0",
          "-translate-y-[calc(1.25rem*var(--nested-dialogs))]",
          "scale-[calc(1-0.1*var(--nested-dialogs))]",
          "rounded-3xl",
          "data-ending-style:scale-98 data-starting-style:scale-98",
          className
        )}
        style={style}
        {...props}
      />
    );
  }
);
DialogContent.displayName = "DialogContent";

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ open, onOpenChange, children, className, nestedLevel = 0, ...props }, ref) => {
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(open);

    React.useEffect(() => {
      if (open) {
        setIsVisible(true);
        setIsAnimating(true);
        // Trigger animation after mount
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsAnimating(false);
          });
        });
      } else {
        setIsAnimating(true);
        // Wait for exit animation before hiding
        const timer = setTimeout(() => {
          setIsVisible(false);
          setIsAnimating(false);
        }, 200);
        return () => clearTimeout(timer);
      }
    }, [open]);

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className={cn("fixed inset-0 z-50 flex items-center justify-center", className)}
        {...props}
      >
        <DialogBackdrop
          data-starting-style={!open && isAnimating ? "" : undefined}
          data-ending-style={!open && isAnimating ? "" : undefined}
          onClick={() => onOpenChange?.(false)}
        />
        <DialogContent
          nestedLevel={nestedLevel}
          data-starting-style={open && isAnimating ? "" : undefined}
          data-ending-style={!open && isAnimating ? "" : undefined}
        >
          {children}
        </DialogContent>
      </div>
    );
  }
);
Dialog.displayName = "Dialog";

export { Dialog, DialogBackdrop, DialogContent };

