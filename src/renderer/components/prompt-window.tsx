import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChatEntry, PromptWindow } from "@/types/chat";
import { useAutoHeight } from "@/hooks/useAutoHeight";
import { PromptInputBox } from "@/components/prompt-input-box";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

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
}: PromptWindowProps) {
  const { containerRef, contentRef } = useAutoHeight(500);
  const [isAnimating, setIsAnimating] = useState(true);
  const [maxContentHeight, setMaxContentHeight] = useState<number | null>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const inputBoxRef = useRef<HTMLDivElement>(null);
  const isStreaming = win.status === "streaming";

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
        className
      )}
      style={{
        height: containerHeight !== null ? `${containerHeight}px` : undefined,
        transitionDuration: isAnimating ? "0ms" : "200ms",
        transitionTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
        zIndex,
        boxShadow: "0 0 50px rgba(0, 0, 0, 0.10), 0 0 100px rgba(0, 0, 0, 0.06), 0 0 150px rgba(0, 0, 0, 0.04), 0 8px 32px rgba(0, 0, 0, 0.08)",
        filter: "drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))",
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
        className="w-full rounded-xl overflow-hidden p-0 flex flex-col flex-1 min-h-0"
        style={{
          background: "transparent",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          border: "none",
          borderBottom: isStacked ? "2px solid transparent" : "none",
          boxShadow: "none",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Conversation header with function name in a pill */}
        <div 
          ref={headerRef}
          className="px-5 pt-4 pb-3 relative flex-shrink-0"
          style={{
            background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.95) 50%, rgba(248, 248, 248, 0.92) 100%)",
            backdropFilter: "blur(60px) saturate(120%)",
            WebkitBackdropFilter: "blur(60px) saturate(120%)",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.03)",
            transition: "all 200ms cubic-bezier(0.25, 0.1, 0.25, 1.0)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div 
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-800"
              style={{
                background: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(30px)",
                WebkitBackdropFilter: "blur(30px)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.03)",
              }}
            >
              {win.entries.find(e => e.kind === "response")?.sourceLabel ?? "Sky"}
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={() => onClose(win.id)}
                className="rounded-lg border border-slate-200/50 bg-white/40 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white/60 hover:opacity-100 opacity-72 transition-opacity transition-colors"
              >
                Close
              </button>
            ) : null}
          </div>
          <CardTitle className="text-slate-900 text-base font-semibold leading-tight" style={{ color: "rgb(15, 23, 42)" }}>
            {win.prompt}
          </CardTitle>
        </div>
        
        {/* Response section with different transparency */}
        <CardContent 
          ref={contentRef as unknown as React.Ref<HTMLDivElement>}
          className={cn(
            "px-5 py-4",
            maxContentHeight !== null ? "overflow-y-auto scrollbar-thin scrollbar-thumb-pink-300/30 scrollbar-track-transparent flex-1" : "flex-shrink-0"
          )}
          style={{
            background: "linear-gradient(to bottom, rgba(252, 252, 252, 0.95) 0%, rgba(248, 248, 248, 0.88) 40%, rgba(245, 245, 245, 0.80) 100%)",
            backdropFilter: "blur(60px) saturate(120%)",
            WebkitBackdropFilter: "blur(60px) saturate(120%)",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.4)",
            maxHeight: maxContentHeight !== null ? `${maxContentHeight}px` : undefined,
            scrollbarWidth: maxContentHeight !== null ? "thin" : undefined,
            scrollbarColor: maxContentHeight !== null ? "rgba(120, 120, 120, 0.25) transparent" : undefined,
            transition: "all 200ms cubic-bezier(0.25, 0.1, 0.25, 1.0)",
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
          <div className="flex flex-col gap-4">
            {win.entries
              .filter((e) => e.kind !== "prompt")
              .map((entry) => (
                <EntryBlock key={entry.id} entry={entry} winStatus={win.status} />
              ))}
          </div>
        </CardContent>
      </Card>
      {/* Input box below response card - no gap, blends seamlessly */}
      {showInput && inputValue !== undefined && onInputChange && onSubmit ? (
        <div ref={inputBoxRef} className="flex-shrink-0">
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
      transition: "all 200ms cubic-bezier(0.25, 0.1, 0.25, 1.0)",
    }}>
      {entry.sourceLabel && (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs">
            {entry.sourceLabel}
          </Badge>
        </div>
      )}
      {entry.heading ? (
        <div className="font-semibold text-base leading-snug" style={{ color: "rgb(15, 23, 42)" }}>
          {entry.heading}
        </div>
      ) : null}
      {entry.body ? (
        <p className={cn(
          "leading-relaxed text-[15px]",
          isStreaming && "animate-pulse"
        )} style={{ color: "rgb(30, 41, 59)" }}>
          {entry.body}
        </p>
      ) : null}
      {entry.bullets ? (
        <ul className="list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed" style={{ color: "rgb(30, 41, 59)" }}>
          {entry.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : null}
      {entry.footnote ? (
        <p className="text-xs mt-2" style={{ color: "rgb(100, 116, 139)" }}>{entry.footnote}</p>
      ) : null}
    </div>
  );
}


