import { PromptWindow } from "@/types/chat";
import { PromptWindow as PromptWindowCard } from "@/components/prompt-window";
import { cn } from "@/lib/utils";

interface PromptWindowsStackProps {
  windows: PromptWindow[];
  onClose?: (id: string) => void;
  onBringToFront?: (id: string) => void;
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
  className,
  inputValue,
  onInputChange,
  onSubmit,
  isProcessing,
  onCollapse,
  onNewChat,
  inputRef,
}: PromptWindowsStackProps) {
  // Newest first for rendering so transforms rely on index
  const ordered = [...windows].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-50 flex items-start justify-center",
        className,
      )}
      aria-hidden={ordered.length === 0}
    >
      <div
        className="mt-10 w-[min(720px,95vw)] relative"
        style={{
          transform: "translateZ(0)",
        }}
      >
        {ordered.map((win, index) => {
          const depth = index;
          const isTopWindow = depth === 0;
          // Each card below is elevated by 10px more than the previous
          const elevationPerCard = 20;
          // Show enough of the header to be clickable (about 60px)
          const peekHeight = 60;
          // Negative offset lifts cards below upward by 10px increments
          const liftOffset = -depth * elevationPerCard;
          // Calculate nested dialog scale
          const nestedScale = 1 - 0.1 * depth;
          const nestedTranslate = -depth * 1.25;
          
          return (
            <div
              key={win.id}
              className="absolute left-0 right-0"
              style={{
                top: `${liftOffset}px`,
                zIndex: 100 + (ordered.length - index),
                pointerEvents: "auto",
                cursor: depth === 0 ? "default" : "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                height: depth === 0 ? "auto" : `${peekHeight}px`,
                overflow: depth === 0 ? "visible" : "hidden",
                willChange: "transform, opacity",
              }}
              onClick={(e) => {
                // Click on the visible top portion of cards below to bring them to front
                if (depth > 0 && onBringToFront) {
                  e.preventDefault();
                  e.stopPropagation();
                  onBringToFront(win.id);
                }
              }}
              onMouseDown={(e) => {
                // Also handle mousedown to ensure clicks are captured
                if (depth > 0 && onBringToFront) {
                  e.stopPropagation();
                }
              }}
            >
              <div
                style={{
                  opacity: depth === 0 ? 1 : 0.5,
                  filter: depth === 0 ? "none" : "blur(0.5px)",
                  transform: `scale(${nestedScale}) translateY(${nestedTranslate}rem)`,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  pointerEvents: depth === 0 ? "auto" : "none",
                  willChange: "transform, opacity, filter",
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


