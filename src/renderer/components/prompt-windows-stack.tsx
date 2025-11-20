import { PromptWindow } from "@/types/chat";
import { PromptWindow as PromptWindowCard } from "@/components/prompt-window";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import type { PendingAction } from "@/types/actions";
import { TaskApprovalWindow } from "@/components/task-approval-window";

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
  // Action approval props
  pendingAction?: PendingAction | null;
  onActionApprove?: () => void;
  onActionCancel?: () => void;
  // Hold gesture progress callback
  onHoldProgressChange?: (progress: number, cardId: string | null) => void;
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
  pendingAction,
  onActionApprove,
  onActionCancel,
  onHoldProgressChange,
}: PromptWindowsStackProps) {
  // Newest first for rendering
  const ordered = [...windows].sort((a, b) => b.createdAt - a.createdAt);
  const [revealedCardHeight, setRevealedCardHeight] = useState<number | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Hold-and-reveal gesture state
  const [holdingCardId, setHoldingCardId] = useState<string | null>(null);
  const holdProgressMotion = useMotionValue(0); // Use motion value for smooth animation
  const [holdProgress, setHoldProgress] = useState(0); // Keep state for threshold checking
  const holdTimerRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);
  const HOLD_DURATION = 500; // ms - total duration to reach 100%
  const COMMIT_THRESHOLD = 0.6; // 60% - point of no return

  // Calculate how much to push cards down when revealing
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cardTopMargin = 20; // marginTop from the container
  const gapBetweenCards = 20; // Gap between revealed card and pushed card
  const peekAmountAtBottom = 80; // Minimum amount of card visible at bottom

  // Measure revealed card height to calculate push distance
  useEffect(() => {
    if (revealedCardId) {
      // Measure the revealed card's height
      const measureHeight = () => {
        const revealedCardElement = cardRefs.current.get(revealedCardId);
        if (revealedCardElement) {
          const height = revealedCardElement.getBoundingClientRect().height;
          setRevealedCardHeight(height);
        }
      };

      // Initial measure
      measureHeight();

      // Set up ResizeObserver to track height changes
      let resizeObserver: ResizeObserver | null = null;
      const revealedCardElement = cardRefs.current.get(revealedCardId);

      if (revealedCardElement) {
        resizeObserver = new ResizeObserver(() => {
          measureHeight();
        });
        resizeObserver.observe(revealedCardElement);
      }

      return () => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    } else if (holdingCardId) {
      // During hold gesture, measure the held card's height
      const measureHeight = () => {
        const heldCardElement = cardRefs.current.get(holdingCardId);
        if (heldCardElement) {
          const height = heldCardElement.getBoundingClientRect().height;
          setRevealedCardHeight(height);
        }
      };

      measureHeight();

      // Set up ResizeObserver for held card
      let resizeObserver: ResizeObserver | null = null;
      const heldCardElement = cardRefs.current.get(holdingCardId);

      if (heldCardElement) {
        resizeObserver = new ResizeObserver(() => {
          measureHeight();
        });
        resizeObserver.observe(heldCardElement);
      }

      return () => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    } else {
      setRevealedCardHeight(null);
    }
  }, [revealedCardId, holdingCardId, ordered]);

  // Cleanup hold gesture timers
  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) {
        cancelAnimationFrame(holdTimerRef.current);
      }
    };
  }, []);

  // Reset hold progress when not holding
  useEffect(() => {
    if (!holdingCardId) {
      setHoldProgress(0);
      holdStartTimeRef.current = null;
    }
  }, [holdingCardId]);

  // Notify parent of hold progress changes
  useEffect(() => {
    if (onHoldProgressChange) {
      onHoldProgressChange(holdProgress, holdingCardId);
    }
  }, [holdProgress, holdingCardId, onHoldProgressChange]);

  // Calculate the push down offset based on revealed/held card height
  const calculatePushDownOffset = (pushedCardDepth: number, targetCardId?: string | null) => {
    // Use provided cardId or fall back to revealedCardId
    const cardId = targetCardId || revealedCardId;

    if (!revealedCardHeight || !cardId) {
      // Default fallback - don't push if no revealed/held card
      return 0;
    }

    const cardIndex = ordered.findIndex(w => w.id === cardId);
    if (cardIndex === -1) return 0;

    const elevationPerCard = 22; // 20px peek + 2px gap
    const cardBaseOffset = -cardIndex * elevationPerCard;
    const pushedCardBaseOffset = -pushedCardDepth * elevationPerCard;

    // Calculate where the revealed/held card is positioned (absolute position in viewport)
    // The card starts at cardTopMargin, adjusted by its base offset
    const cardTop = cardTopMargin + cardBaseOffset;
    const cardBottom = cardTop + revealedCardHeight;

    // Calculate ideal position for pushed card top (card bottom + gap)
    const idealPushedCardTop = cardBottom + gapBetweenCards;

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

  // Hold gesture handlers
  const startHold = (cardId: string) => {
    setHoldingCardId(cardId);
    holdStartTimeRef.current = Date.now();

    const animateProgress = () => {
      if (holdStartTimeRef.current === null) return;

      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);

      // Update motion value for smooth animation (doesn't trigger re-render)
      holdProgressMotion.set(progress);

      // Update state every frame for smooth interpolation
      setHoldProgress(progress);

      if (progress < 1) {
        holdTimerRef.current = requestAnimationFrame(animateProgress);
      }
    };

    holdTimerRef.current = requestAnimationFrame(animateProgress);
  };

  const endHold = (cardId: string) => {
    if (holdTimerRef.current !== null) {
      cancelAnimationFrame(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Check if we passed the commit threshold
    if (holdProgress >= COMMIT_THRESHOLD && onRevealCard) {
      // Commit to reveal
      onRevealCard(cardId);
    }
    // If below threshold, just reset (cards will snap back via state reset)

    setHoldingCardId(null);
  };

  const cancelHold = () => {
    if (holdTimerRef.current !== null) {
      cancelAnimationFrame(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldingCardId(null);
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
          // Only push down container when fully revealed, not during hold
          marginTop: revealedCardId && revealedCardHeight
            ? 20 + (revealedCardHeight * 0.5) // Fully revealed state
            : 20, // Default state (no push during hold)
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
            const elevationPerCard = 12; // Reduced gap for tighter stack
            const peekHeight = 60;

            // Calculate positions
            const baseOffset = -depth * elevationPerCard;
            const isPushedToBottom = revealedCardId && depth < ordered.findIndex(w => w.id === revealedCardId);

            // Check if this card is being held or if a card below it is being held
            const isBeingHeld = holdingCardId === win.id;
            const isAboveHeldCard = holdingCardId && depth < ordered.findIndex(w => w.id === holdingCardId);

            // Calculate how much to push this card down
            let pushDownOffset = 0;
            if (isPushedToBottom) {
              // Fully revealed state
              pushDownOffset = calculatePushDownOffset(depth);
            } else if (isAboveHeldCard && holdingCardId && !isBeingHeld && revealedCardHeight) {
              // Progressive reveal based on hold progress - ONLY for cards ABOVE the held card
              // Use the same calculation as fully revealed, but interpolate with holdProgress
              const targetOffset = calculatePushDownOffset(depth, holdingCardId);
              pushDownOffset = targetOffset * holdProgress;
            }
            // Note: held card itself (isBeingHeld) gets NO pushDownOffset - it stays in place

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
                  scale: 0.95,
                  opacity: 0,
                  y: 300, // Start from bottom
                  rotateX: -10,
                }}
                animate={{
                  top: baseOffset,
                  // Move cards ABOVE revealed card DOWN but keep part visible at bottom
                  y: pushDownOffset,
                  zIndex: 100 + (ordered.length - index),
                  // Interpolate scale for held card
                  scale: isRevealed
                    ? 1
                    : isBeingHeld
                      ? 1 - 0.03 * depth * (1 - holdProgress) // Gradually scale up to 1
                      : 1 - 0.03 * depth,
                  // Interpolate opacity for held card
                  opacity: isTopWindow || isRevealed || isPushedToBottom
                    ? 1
                    : isBeingHeld
                      ? Math.max(0.4, 1 - depth * 0.15) + ((1 - Math.max(0.4, 1 - depth * 0.15)) * holdProgress) // Gradually increase to 1
                      : Math.max(0.4, 1 - depth * 0.15),
                  // Interpolate rotateX for held card
                  rotateX: isRevealed
                    ? 0
                    : isBeingHeld
                      ? depth * 2 * (1 - holdProgress) // Gradually reduce rotation to 0
                      : depth * 2,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  y: -20,
                  transition: { duration: 0.2 }
                }}
                transition={{
                  layout: { type: "spring", stiffness: 300, damping: 30 },
                  top: { type: "spring", stiffness: 300, damping: 30 },
                  // Use instant transition for properties driven by holdProgress to prevent jitter
                  y: isAboveHeldCard && holdingCardId && !isBeingHeld ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 },
                  scale: isBeingHeld ? { duration: 0 } : { duration: 0.2 },
                  opacity: isBeingHeld ? { duration: 0 } : { duration: 0.2 },
                  rotateX: isBeingHeld ? { duration: 0 } : { duration: 0.4 },
                  filter: isBeingHeld ? { duration: 0 } : { duration: 0.2 },
                }}
                style={{
                  pointerEvents: "auto",
                  cursor: isPushedToBottom ? "pointer" : (depth === 0 || isRevealed || isBeingHeld ? "default" : "pointer"),
                  // Gradually increase height for held card
                  height: depth === 0 || isRevealed || isPushedToBottom
                    ? "auto"
                    : isBeingHeld
                      ? holdProgress > 0.3 ? "auto" : `${peekHeight}px` // Show full height after 30% progress
                      : `${peekHeight}px`,
                  // Gradually show overflow for held card
                  overflow: depth === 0 || isRevealed || isPushedToBottom
                    ? "visible"
                    : isBeingHeld
                      ? holdProgress > 0.3 ? "visible" : "hidden"
                      : "hidden",
                  transformStyle: "preserve-3d",
                  border: depth === 0 ? "5px solid rgba(0,0,0,0)" : undefined,
                  backgroundClip: depth === 0 ? "padding-box" : undefined,
                }}
                onClick={(e) => {
                  // Handle clicks on pushed cards OR revealed cards (second click)
                  if (isPushedToBottom || depth > 0) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (isPushedToBottom && onRevealCard) {
                      // Clicked on pushed card: reverse the reveal action
                      onRevealCard(null);
                    } else if (isRevealed && onBringToFront) {
                      // Second click on revealed card: zoom and bring to front
                      onBringToFront(win.id);
                    }
                    // For stacked cards, we now use hold gesture instead of click
                  }
                }}
                onMouseDown={(e) => {
                  // Start hold gesture for stacked cards (not top, not revealed, not pushed)
                  if (depth > 0 && !isRevealed && !isPushedToBottom) {
                    e.preventDefault();
                    e.stopPropagation();
                    startHold(win.id);
                  }
                }}
                onMouseUp={(e) => {
                  // End hold gesture
                  if (holdingCardId === win.id) {
                    e.preventDefault();
                    e.stopPropagation();
                    endHold(win.id);
                  }
                }}
                onMouseLeave={() => {
                  // Cancel hold if mouse leaves card
                  if (holdingCardId === win.id) {
                    cancelHold();
                  }
                }}
              >
                <motion.div
                  initial={{
                    filter: "blur(4px)",
                  }}
                  animate={{
                    // Interpolate blur for held card
                    filter: depth === 0 || isRevealed || isPushedToBottom
                      ? "blur(0px)"
                      : isBeingHeld
                        ? `blur(${Math.max(0, depth * 1 * (1 - holdProgress))}px)` // Gradually reduce blur to 0
                        : `blur(${depth * 1}px)`,
                    // Interpolate scale for held card
                    scale: isRevealed
                      ? 1
                      : isBeingHeld
                        ? 1 - 0.02 * depth * (1 - holdProgress) // Gradually scale up to 1
                        : 1 - 0.02 * depth,
                  }}
                  transition={{
                    filter: { duration: 0.2 },
                    scale: { duration: 0.2 },
                  }}
                  style={{
                    pointerEvents: depth === 0 || isRevealed || isPushedToBottom || isBeingHeld ? "auto" : "none",
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
                    pendingAction={isTopWindow && !isPushedToBottom ? pendingAction : undefined}
                    onActionApprove={isTopWindow && !isPushedToBottom ? onActionApprove : undefined}
                    onActionCancel={isTopWindow && !isPushedToBottom ? onActionCancel : undefined}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div >
    </div >
  );
}
