import { PromptWindow } from "@/types/chat";
import { PromptWindow as PromptWindowCard } from "@/components/prompt-window";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

interface PromptWindowsStackProps {
  windows: PromptWindow[];
  onClose?: (id: string) => void;
  onBringToFront?: (id: string) => void;
  onRevealCard?: (id: string | null) => void;
  revealedCardId?: string | null;
  className?: string;
  // Input props - only used for top window
  inputValue?: string;
  onInputChange?: (value: string) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  isProcessing?: boolean;
  onCollapse?: () => void;
  onNewChat?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

export function PromptWindowsStack({
  windows,
  onClose,
  onBringToFront,
  onRevealCard,
  revealedCardId,
  className,
  inputValue,
  onInputChange,
  onSubmit,
  isProcessing,
  onCollapse,
  onNewChat,
  inputRef,
}: PromptWindowsStackProps) {
  // Newest first for rendering
  const ordered = [...windows].sort((a, b) => b.createdAt - a.createdAt);
  const [revealedCardHeight, setRevealedCardHeight] = useState<number | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Calculate how much to push cards down when revealing
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cardTopMargin = 20; // marginTop from the container
  const gapBetweenCards = 20; // Gap between revealed card and pushed card
  const peekAmountAtBottom = 80; // Minimum amount of card visible at bottom

  // Measure revealed card height to calculate push distance
  useEffect(() => {
    if (revealedCardId) {
      let rafId: number | null = null;
      let isScheduled = false;
      
      const measureHeight = () => {
        const revealedCardElement = cardRefs.current.get(revealedCardId);
        if (revealedCardElement) {
          const height = revealedCardElement.offsetHeight;
          setRevealedCardHeight(height);
        }
        isScheduled = false;
      };

      // Throttled measure using requestAnimationFrame
      const throttledMeasure = () => {
        if (!isScheduled) {
          isScheduled = true;
          rafId = requestAnimationFrame(measureHeight);
        }
      };

      // Initial measure after a short delay
      const timeoutId = setTimeout(measureHeight, 100);
      
      // Measure on window resize (already throttled by rAF)
      window.addEventListener('resize', throttledMeasure);
      
      // Use ResizeObserver with throttling to track content changes
      const revealedCardElement = cardRefs.current.get(revealedCardId);
      let resizeObserver: ResizeObserver | null = null;
      
      if (revealedCardElement) {
        resizeObserver = new ResizeObserver(throttledMeasure);
        resizeObserver.observe(revealedCardElement);
      }
      
      return () => {
        clearTimeout(timeoutId);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        window.removeEventListener('resize', throttledMeasure);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    } else {
      setRevealedCardHeight(null);
    }
  }, [revealedCardId, ordered]);

  // Calculate the push down offset based on revealed card height
  const calculatePushDownOffset = (pushedCardDepth: number) => {
    if (!revealedCardHeight || !revealedCardId) {
      // Default fallback - don't push if no revealed card
      return 0;
    }

    const revealedCardIndex = ordered.findIndex(w => w.id === revealedCardId);
    if (revealedCardIndex === -1) return 0;

    const elevationPerCard = 22; // 20px peek + 2px gap
    const revealedCardBaseOffset = -revealedCardIndex * elevationPerCard;
    const pushedCardBaseOffset = -pushedCardDepth * elevationPerCard;
    
    // Calculate where the revealed card is positioned (absolute position in viewport)
    // The card starts at cardTopMargin, adjusted by its base offset
    const revealedCardTop = cardTopMargin + revealedCardBaseOffset;
    const revealedCardBottom = revealedCardTop + revealedCardHeight;
    
    // Calculate ideal position for pushed card top (revealed card bottom + gap)
    const idealPushedCardTop = revealedCardBottom + gapBetweenCards;
    
    // Calculate the maximum allowed position (keeping peek amount visible)
    const maxPushedCardTop = viewportHeight - peekAmountAtBottom;
    
    // Use the smaller of the two to ensure card stays visible
    const targetPushedCardTop = Math.min(idealPushedCardTop, maxPushedCardTop);
    
    // The pushed card's natural position (without y transform)
    const pushedCardNaturalTop = cardTopMargin + pushedCardBaseOffset;
    
    // Calculate the y offset needed (from natural position to target position)
    const pushDownOffset = targetPushedCardTop - pushedCardNaturalTop;
    
    return Math.max(0, pushDownOffset); // Don't push up, only down
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-50 flex items-start justify-center",
        className,
      )}
      aria-hidden={ordered.length === 0}
    >
      <motion.div
        className="w-[min(640px,92vw)] relative"
        style={{
          perspective: "1000px",
          perspectiveOrigin: "center center",
        }}
        initial={{ marginTop: 20, opacity: 0 }}
        animate={{
          marginTop: revealedCardId ? 20 : 20,
          opacity: 1,
        }}
        transition={{
          marginTop: {
            type: "tween",
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1.0],
          },
          opacity: {
            type: "tween",
            duration: 0.35,
            ease: "easeOut",
          },
        }}
      >
        <AnimatePresence mode="sync">
          {ordered.map((win, index) => {
            const depth = index;
            const isTopWindow = depth === 0;
            const isRevealed = revealedCardId === win.id;
            const elevationPerCard = 22; // 20px peek + 2px gap
            const peekHeight = 60;

            // Calculate positions
            const baseOffset = -depth * elevationPerCard;
            const isPushedToBottom = revealedCardId && depth < ordered.findIndex(w => w.id === revealedCardId);
            
            // Calculate how much to push this card down (if it's being pushed)
            const pushDownOffset = isPushedToBottom ? calculatePushDownOffset(depth) : 0;
            
            // Calculate max height for revealed card to prevent it from covering pushed cards
            let maxRevealedCardHeight: number | undefined = undefined;
            if (isRevealed) {
              // Available space = viewport height - card top margin - gap - peek amount
              maxRevealedCardHeight = viewportHeight - cardTopMargin - gapBetweenCards - peekAmountAtBottom;
            }
            
            return (
              <motion.div
                key={win.id}
                ref={(el) => {
                  if (el) {
                    cardRefs.current.set(win.id, el);
                  } else {
                    cardRefs.current.delete(win.id);
                  }
                }}
                className="absolute left-0 right-0"
                layout
                initial={{
                  top: baseOffset,
                  zIndex: 100 + (ordered.length - index),
                  scale: 0.92,
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  top: baseOffset,
                  // Move cards ABOVE revealed card DOWN but keep part visible at bottom
                  y: pushDownOffset,
                  zIndex: 100 + (ordered.length - index),
                  scale: isRevealed ? 1 : 1 - 0.02 * depth,
                  // Cards pushed to bottom should be fully visible for easy clicking
                  opacity: isTopWindow || isRevealed || isPushedToBottom ? 1 : 0.5,
                }}
                transition={{
                  layout: {
                    type: "tween",
                    duration: 0.25,
                    ease: [0.25, 0.1, 0.25, 1.0],
                  },
                  y: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  },
                  scale: {
                    type: "tween",
                    duration: 0.25,
                    ease: [0.25, 0.1, 0.25, 1.0],
                  },
                  opacity: {
                    type: "tween",
                    duration: 0.2,
                    ease: "easeOut",
                  },
                  top: {
                    type: "tween",
                    duration: 0.25,
                    ease: [0.25, 0.1, 0.25, 1.0],
                  },
                }}
                style={{
                  pointerEvents: "auto",
                  cursor: isPushedToBottom ? "pointer" : (depth === 0 || isRevealed ? "default" : "pointer"),
                  height: depth === 0 || isRevealed || isPushedToBottom ? "auto" : `${peekHeight}px`,
                  overflow: depth === 0 || isRevealed || isPushedToBottom ? "visible" : "hidden",
                  transformStyle: "preserve-3d",
                }}
                onClick={(e) => {
                  // Handle clicks on pushed cards OR non-top cards
                  if (isPushedToBottom || depth > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (isPushedToBottom && onRevealCard) {
                      // Clicked on pushed card: reverse the reveal action
                      onRevealCard(null);
                    } else if (isRevealed && onBringToFront) {
                      // Second click on revealed card: zoom and bring to front
                      onBringToFront(win.id);
                    } else if (!isRevealed && onRevealCard) {
                      // First click on stacked card: reveal the card
                      onRevealCard(win.id);
                    }
                  }
                }}
                onMouseDown={(e) => {
                  if (depth > 0) {
                    e.stopPropagation();
                  }
                }}
              >
                <motion.div
                  initial={{
                    filter: "blur(2px)",
                  }}
                  animate={{
                    // Cards pushed to bottom should be clear (no blur) for easy clicking
                    filter: depth === 0 || isRevealed || isPushedToBottom ? "none" : "blur(0.5px)",
                    scale: isRevealed ? 1 : 1 - 0.05 * depth,
                  }}
                  transition={{
                    filter: {
                      type: "tween",
                      duration: 0.2,
                      ease: "easeOut",
                    },
                    scale: {
                      type: "tween",
                      duration: 0.25,
                      ease: [0.25, 0.1, 0.25, 1.0],
                    },
                  }}
                  style={{
                    pointerEvents: depth === 0 || isRevealed || isPushedToBottom ? "auto" : "none",
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <PromptWindowCard
                    win={win}
                    zIndex={100 + (ordered.length - index)}
                    onClose={onClose}
                    showInput={isTopWindow && !isPushedToBottom}
                    inputValue={isTopWindow && !isPushedToBottom ? inputValue : undefined}
                    onInputChange={isTopWindow && !isPushedToBottom ? onInputChange : undefined}
                    onSubmit={isTopWindow && !isPushedToBottom ? onSubmit : undefined}
                    isProcessing={isTopWindow && !isPushedToBottom ? isProcessing : undefined}
                    onCollapse={isTopWindow && !isPushedToBottom ? onCollapse : undefined}
                    onNewChat={isTopWindow && !isPushedToBottom ? onNewChat : undefined}
                    inputRef={isTopWindow && !isPushedToBottom ? inputRef : undefined}
                    maxHeight={isRevealed ? maxRevealedCardHeight : undefined}
                    isStacked={depth > 0 && !isRevealed && !isPushedToBottom}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
