import { cn } from "@/lib/utils";
import skyLogo from "@/assets/sky-logo.png";

interface LogoProps {
  className?: string;
  isExpanded?: boolean;
}

export function Logo({ className, isExpanded = false }: LogoProps) {
  return (
    <div className={cn("flex items-center flex-shrink-0", className)} style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
      <img 
        src={skyLogo} 
        alt="Sky Logo" 
        className={cn(
          "w-auto object-contain transition-all duration-300",
          isExpanded ? "h-12" : "h-10"
        )}
        style={{
          filter: "drop-shadow(0 0 12px rgba(244, 114, 182, 0.9)) drop-shadow(0 0 6px rgba(244, 114, 182, 0.7)) drop-shadow(0 0 3px rgba(244, 114, 182, 0.5)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))",
        }}
      />
    </div>
  );
}

