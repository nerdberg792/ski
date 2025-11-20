import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChatEntry, PromptWindow } from "@/types/chat";
import type { PendingAction } from "@/types/actions";
import { useAutoHeight } from "@/hooks/useAutoHeight";
import { PromptInputBox } from "@/components/prompt-input-box";
import { TaskApprovalWindow } from "@/components/task-approval-window";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { SpotifyInlineControls } from "@/components/spotify-inline-controls";
import { useSpotify } from "@/hooks/useSpotify";

interface PromptWindowProps {
  win: PromptWindow;
  zIndex: number;
  onClose?: (id: string) => void;
  className?: string;
  // Input props - only used for top window
  inputValue?: string;
  onInputChange?: (value: string) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  isProcessing?: boolean;
  onCollapse?: () => void;
  onNewChat?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
  showInput?: boolean;
  maxHeight?: number; // Maximum height constraint for revealed cards
  isStacked?: boolean; // Whether this card is in the stack (not top card)
  // Action approval props - for inline decision window
  pendingAction?: PendingAction | null;
  onActionApprove?: () => void;
  onActionCancel?: () => void;
}

export function PromptWindow({
  win,
  zIndex,
  onClose,
  className,
  inputValue,
  onInputChange,
  onSubmit,
  isProcessing,
  onCollapse,
  onNewChat,
  inputRef,
  showInput = false,
  maxHeight,
  isStacked = false,
  pendingAction,
  onActionApprove,
  onActionCancel,
}: PromptWindowProps) {
  const { containerRef, contentRef } = useAutoHeight(500);
  const [isAnimating, setIsAnimating] = useState(true);
  const [maxContentHeight, setMaxContentHeight] = useState<number | null>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const inputBoxRef = useRef<HTMLDivElement>(null);
  const isStreaming = win.status === "streaming";

  // Check if Spotify controls should be shown - ONLY if prompt explicitly mentions Spotify
  // This prevents false positives when asking about other things (like Chrome tabs)
  // We check the prompt only, not entries, to avoid false matches
  const promptMentionsSpotify = /\bspotify\b/i.test(win.prompt);

  // Also check if a Spotify action was executed - look for very specific action result messages
  const hasSpotifyAction = win.entries.some(e => {
    const body = e.body || "";
    // Match only very specific Spotify action result patterns (exact phrases)
    return (
      /^playing spotify$/i.test(body.trim()) ||
      /^paused spotify$/i.test(body.trim()) ||
      /^volume set to \d+%$/i.test(body.trim()) ||
      /^skipped to (next|previous) track$/i.test(body.trim()) ||
      /^toggled (play\/pause|shuffle|repeat)$/i.test(body.trim()) ||
      /^now playing:/i.test(body.trim()) ||
      /^playing: .+ - .+$/i.test(body.trim()) // "Playing: Artist - Song"
    );
  });

  const { status: spotifyStatus, isConfigured: spotifyConfigured } = useSpotify();
  // Only show if prompt mentions Spotify OR a Spotify action was executed
  const shouldShowSpotify = (promptMentionsSpotify || hasSpotifyAction) && spotifyConfigured;

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(false);
      });
    });
  }, []);

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout | null = null;

    const updateDimensions = () => {
      if (!containerRef.current || !headerRef.current || !contentRef.current) return;

      const viewportHeight = window.innerHeight;
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const headerHeight = headerRef.current.getBoundingClientRect().height;
      const inputBoxHeight = inputBoxRef.current?.getBoundingClientRect().height || (showInput ? 60 : 0);

      // Use minimal padding from top since we want card to stick to top for long content
      const topPadding = 20; // Minimal top padding
      const bottomPadding = 20; // Bottom padding

      // Calculate natural content height (header + content + input)
      // Use scrollHeight to get the natural content height regardless of current constraints
      // This gives us the true height the content wants to be
      const contentNaturalHeight = contentRef.current.scrollHeight;
      const naturalTotalHeight = headerHeight + contentNaturalHeight + inputBoxHeight;

      // Calculate max available height
      let maxHeightFromTop = viewportHeight - topPadding - bottomPadding;

      // If maxHeight is provided (for revealed cards), use it as the constraint
      if (maxHeight !== undefined && maxHeight < maxHeightFromTop) {
        maxHeightFromTop = maxHeight;
      }

      // If natural height fits within available space, use natural height and no scrolling
      if (naturalTotalHeight <= maxHeightFromTop) {
        setContainerHeight(naturalTotalHeight);
        setMaxContentHeight(null);
      } else {
        // If natural height exceeds available space, constrain container
        // and enable scrolling within the content area
        setContainerHeight(maxHeightFromTop);
        const availableContentHeight = maxHeightFromTop - headerHeight - inputBoxHeight;
        if (availableContentHeight > 200) {
          setMaxContentHeight(availableContentHeight);
        } else {
          setMaxContentHeight(200); // Minimum content height when scrolling
        }
      }
    };

    const debouncedUpdate = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateDimensions, 50);
    };

    // Delay to ensure DOM is ready
    const initialTimeout = setTimeout(updateDimensions, 100);
    window.addEventListener('resize', debouncedUpdate);
    const resizeObserver = new ResizeObserver(debouncedUpdate);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }
    if (inputBoxRef.current) {
      resizeObserver.observe(inputBoxRef.current);
    }

    return () => {
      clearTimeout(initialTimeout);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedUpdate);
      resizeObserver.disconnect();
    };
  }, [showInput, win.entries.length, maxHeight]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-auto w-full flex flex-col gap-0 rounded-xl overflow-hidden",
        "transition-[scale,opacity,translate,height] ease-out will-change-transform",
        isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100",
        "bg-transparent shadow-none", // Container is now transparent
        className
      )}
      style={{
        height: containerHeight !== null ? `${containerHeight}px` : undefined,
        transitionDuration: isAnimating ? "0ms" : "300ms",
        transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        zIndex,
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        // Only prevent clicks on the top card from bubbling up
        // Cards below should allow clicks to bubble up to bring them to front
        if (showInput) {
          e.stopPropagation();
        }
      }}
    >
      <Card
        className="w-full rounded-xl overflow-hidden p-0 flex flex-col flex-1 min-h-0 bg-white/95 backdrop-blur-xl border border-glass-border shadow-glass-lg"
      >
        {/* Conversation header with function name in a pill */}
        <div
          ref={headerRef}
          className="px-6 pt-5 pb-0 relative flex-shrink-0"
        >
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0 mr-4 flex gap-2">
              <span className="text-white/50 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </span>
              <CardTitle className='text-white text-[15px] leading-relaxed font-normal tracking-normal truncate'>
                {win.prompt}
              </CardTitle>
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={() => onClose(win.id)}
                className="rounded-full p-1.5 text-sky-200/70 hover:text-white hover:bg-white/10 transition-all duration-200 flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            ) : null}
          </div>
        </div>

        {/* Response section with different transparency */}
        <CardContent
          ref={contentRef as unknown as React.Ref<HTMLDivElement>}
          className={cn(
            "px-6 pt-2 pb-5",
            maxContentHeight !== null ? "overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent flex-1" : "flex-shrink-0"
          )}
          style={{
            maxHeight: maxContentHeight !== null ? `${maxContentHeight}px` : undefined,
            scrollbarWidth: maxContentHeight !== null ? "thin" : undefined,
            scrollbarColor: maxContentHeight !== null ? "rgba(255, 255, 255, 0.2) transparent" : undefined,
          } as React.CSSProperties}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="flex flex-col gap-5 text-sky-100/90">
            {/* Spotify inline controls - show if window has Spotify-related content */}
            {shouldShowSpotify && <SpotifyInlineControls />}
            {win.entries
              .filter((e) => e.kind !== "prompt")
              .map((entry) => (
                <EntryBlock key={entry.id} entry={entry} winStatus={win.status} />
              ))}

            {/* Inline Task Approval Window */}
            {pendingAction && onActionApprove && onActionCancel && (
              <div className="mt-2">
                <TaskApprovalWindow
                  pendingAction={pendingAction}
                  onApprove={onActionApprove}
                  onCancel={onActionCancel}
                  position="inline"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Input box below response card - no gap, blends seamlessly */}
      {showInput && inputValue !== undefined && onInputChange && onSubmit ? (
        <div ref={inputBoxRef} className="flex-shrink-0 bg-transparent border-none">
          <PromptInputBox
            inputValue={inputValue}
            onInputChange={onInputChange}
            onSubmit={onSubmit}
            isProcessing={isProcessing}
            onCollapse={onCollapse}
            onNewChat={onNewChat}
            inputRef={inputRef}
          />
        </div>
      ) : null}
    </div>
  );
}

function EntryBlock({ entry, winStatus }: { entry: ChatEntry; winStatus?: PromptWindow["status"] }) {
  const isStreaming = winStatus === "streaming";

  return (
    <div className="flex flex-col gap-3" style={{
      transition: "all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    }}>
      {entry.heading ? (
        <div className="font-semibold text-base leading-snug text-white">
          {entry.heading}
        </div>
      ) : null}
      {entry.body ? (
        <p className={cn(
          "leading-relaxed text-[15px] text-sky-100/90 font-normal",
          isStreaming && "animate-pulse"
        )}>
          {entry.body}
        </p>
      ) : null}
      {entry.bullets ? (
        <ul className="list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed text-sky-100/90 font-normal">
          {entry.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : null}
      {entry.footnote ? (
        <p className="text-xs mt-2 text-sky-200/60">{entry.footnote}</p>
      ) : null}
    </div>
  );
}
