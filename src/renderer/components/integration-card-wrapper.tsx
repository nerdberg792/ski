import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type IntegrationPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface IntegrationCardWrapperProps {
  children: ReactNode;
  position?: IntegrationPosition;
  className?: string;
  zIndex?: number;
  /**
   * Whether to show the card. If false, returns null.
   */
  show?: boolean;
}

/**
 * Reusable wrapper for external app integration cards (Spotify, etc.)
 * Positions cards away from the centered prompt windows to avoid overlaps.
 * 
 * The prompt windows are centered with width of min(640px, 92vw), so integration
 * cards should be positioned in corners to avoid overlap.
 * 
 * @example
 * ```tsx
 * <IntegrationCardWrapper position="bottom-right" show={isConnected}>
 *   <SpotifyControlCard />
 * </IntegrationCardWrapper>
 * ```
 */
export function IntegrationCardWrapper({
  children,
  position = "bottom-right",
  className,
  zIndex = 30,
  show = true,
}: IntegrationCardWrapperProps) {
  if (!show) {
    return null;
  }

  const positionClasses = {
    "top-left": "top-6 left-6",
    "top-right": "top-32 right-8", // Positioned well below menu bar and away from center
    "bottom-left": "bottom-40 left-8", // Positioned well above Dock and away from center
    "bottom-right": "bottom-40 right-8", // Positioned well above Dock and away from center
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed",
        positionClasses[position],
        className
      )}
      style={{
        WebkitAppRegion: "no-drag",
        zIndex,
      } as React.CSSProperties}
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  );
}

