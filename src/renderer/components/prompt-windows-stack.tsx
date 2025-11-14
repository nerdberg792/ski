import { PromptWindow } from "@/types/chat";
import { PromptWindow as PromptWindowCard } from "@/components/prompt-window";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PromptWindowsStackProps {
  windows: PromptWindow[];
  onClose?: (id: string) => void;
  onBringToFront?: (id: string) => void;
  onRevealCard?: (id: string) => void;
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

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-50 flex items-start justify-center",
        className,
      )}
      aria-hidden={ordered.length === 0}
    >
      <motion.div
        className="w-[min(720px,95vw)] relative"
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
            const elevationPerCard = 20;
            const peekHeight = 60;

            // Calculate positions
            const baseOffset = -depth * elevationPerCard;
            
            return (
              <motion.div
                key={win.id}
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
                  // Move cards ABOVE revealed card DOWN and OUT of viewport
                  y: revealedCardId && depth < ordered.findIndex(w => w.id === revealedCardId)
                    ? 800 // Move down 800px to push out of viewport
                    : 0,
                  zIndex: 100 + (ordered.length - index),
                  scale: isRevealed ? 1 : 1 - 0.02 * depth,
                  opacity: isTopWindow || isRevealed ? 1 : 0.5,
                }}
                transition={{
                  layout: {
                    type: "tween",
                    duration: 0.35,
                    ease: [0.25, 0.1, 0.25, 1.0],
                  },
                  y: {
                    type: "tween",
                    duration: 0.4,
                    ease: [0.25, 0.1, 0.25, 1.0],
                  },
                  scale: {
                    type: "tween",
                    duration: 0.35,
                    ease: [0.25, 0.1, 0.25, 1.0],
                  },
                  opacity: {
                    type: "tween",
                    duration: 0.3,
                    ease: "easeOut",
                  },
                  top: {
                    type: "tween",
                    duration: 0.4,
                    ease: [0.25, 0.1, 0.25, 1.0],
                  },
                }}
                style={{
                  pointerEvents: "auto",
                  cursor: depth === 0 || isRevealed ? "default" : "pointer",
                  height: depth === 0 || isRevealed ? "auto" : `${peekHeight}px`,
                  overflow: depth === 0 || isRevealed ? "visible" : "hidden",
                  transformStyle: "preserve-3d",
                }}
                onClick={(e) => {
                  if (depth > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (isRevealed && onBringToFront) {
                      // Second click: zoom and bring to front
                      onBringToFront(win.id);
                    } else if (!isRevealed && onRevealCard) {
                      // First click: reveal the card
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
                    filter: depth === 0 || isRevealed ? "none" : "blur(0.5px)",
                    scale: isRevealed ? 1 : 1 - 0.05 * depth,
                  }}
                  transition={{
                    filter: {
                      type: "tween",
                      duration: 0.3,
                      ease: "easeOut",
                    },
                    scale: {
                      type: "tween",
                      duration: 0.35,
                      ease: [0.25, 0.1, 0.25, 1.0],
                    },
                  }}
                  style={{
                    pointerEvents: depth === 0 || isRevealed ? "auto" : "none",
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <PromptWindowCard
                    win={win}
                    zIndex={100 + (ordered.length - index)}
                    onClose={onClose}
                    showInput={isTopWindow}
                    inputValue={isTopWindow ? inputValue : undefined}
                    onInputChange={isTopWindow ? onInputChange : undefined}
                    onSubmit={isTopWindow ? onSubmit : undefined}
                    isProcessing={isTopWindow ? isProcessing : undefined}
                    onCollapse={isTopWindow ? onCollapse : undefined}
                    onNewChat={isTopWindow ? onNewChat : undefined}
                    inputRef={isTopWindow ? inputRef : undefined}
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
