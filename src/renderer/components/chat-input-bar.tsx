import { Paperclip, ChevronDown, Settings, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface ChatInputBarProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isProcessing?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  isExpanded?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  onNewChat?: () => void;
  onInputVisibilityChange?: (visible: boolean) => void; // Callback to notify parent of input visibility
}

export function ChatInputBar({
  inputValue,
  onInputChange,
  onSubmit,
  isProcessing = false,
  onExpand,
  onCollapse,
  isExpanded = false,
  inputRef,
  onNewChat,
  onInputVisibilityChange,
}: ChatInputBarProps) {
  const hasText = inputValue.trim().length > 0;
  const isCollapsed = !isExpanded;
  const [showInput, setShowInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent when input visibility changes
  useEffect(() => {
    onInputVisibilityChange?.(showInput);
  }, [showInput, onInputVisibilityChange]);

  // Handle click outside to collapse the input (works in both expanded and collapsed states)
  useEffect(() => {
    if (!showInput) {
      return; // Only listen when input is showing
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowInput(false);
        // Blur the input if it has focus
        if (inputRef && 'current' in inputRef && inputRef.current) {
          inputRef.current.blur();
        }
      }
    };

    // Use capture phase to catch clicks before they bubble
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [showInput, inputRef]);

  // Auto-reveal input when it receives focus (e.g., when logo is clicked)
  // Auto-hide input when it loses focus (e.g., when logo is clicked again)
  useEffect(() => {
    if (!inputRef || !('current' in inputRef) || !inputRef.current) {
      return;
    }

    const input = inputRef.current;

    const handleFocus = () => {
      if (!showInput) {
        setShowInput(true);
      }
    };

    const handleBlur = () => {
      // Hide input when it loses focus (unless clicking within the container)
      // The click-outside handler will take care of this, but we also handle direct blur
      setTimeout(() => {
        if (document.activeElement !== input) {
          setShowInput(false);
        }
      }, 100);
    };

    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);

    return () => {
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
    };
  }, [inputRef, showInput]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-center transition-all duration-300 min-w-0",
        isCollapsed ? "gap-5 flex-shrink-0" : hasText ? "gap-0 flex-1" : "gap-2 flex-1"
      )}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => {
          // If input not showing, reveal the input box (works in both collapsed and expanded states)
          if (!showInput) {
            e.preventDefault();
            e.stopPropagation();
            setShowInput(true);
            // Focus the input after showing it
            setTimeout(() => {
              if (inputRef && 'current' in inputRef && inputRef.current) {
                inputRef.current.focus();
              }
            }, 100);
          }
        }}
        className={cn(
          "flex items-center gap-0 rounded-full relative overflow-hidden transition-all duration-300 flex-shrink-0",
          isExpanded ? "pl-4 pr-1 py-2.5" : "pl-2 pr-0 py-2",
          !showInput && !isExpanded && "cursor-pointer hover:bg-white/5",
          (showInput || isExpanded) && "bg-transparent" // Completely transparent when active or expanded, no border
        )}
        style={{
          WebkitAppRegion: "no-drag",
          // No backdrop filter or border
        } as React.CSSProperties}
      >
        <textarea
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
            }
          }}
          placeholder=""
          rows={1}
          className={cn(
            "bg-transparent border-none outline-none text-white text-base py-0 placeholder-glass resize-none overflow-hidden",
            showInput
              ? inputValue.trim()
                ? isExpanded
                  ? "w-auto min-w-[200px] max-w-full pr-2"
                  : "w-auto min-w-[150px] max-w-[600px] pr-2"
                : isExpanded
                  ? "w-[150px] pr-2"
                  : "w-[100px] pr-2"
              : "w-0",
            "transition-all duration-300 ease-in-out"
          )}
          style={{
            textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            minHeight: "1.5rem",
            maxHeight: "10rem",
          }}
          onInput={(e) => {
            // Auto-resize textarea based on content
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
          }}
          autoFocus
        />
      </form>

      {/* Action buttons: Attach, Settings, New Chat */}
      {!hasText && (
        <div
          className="flex items-center gap-2 flex-shrink-0 overflow-visible transition-all duration-300"
        >
          {/* Attach button with dropdown */}
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-0.5 text-sm font-medium transition-all hover:bg-white/20 hover:scale-[1.02] rounded-full bg-gradient-to-br from-white/15 via-white/10 to-white/5 border border-white/30 text-white shadow-[0_2px_8px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl"
          >
            <Paperclip className="h-4 w-4" />
            <span>Attach</span>
            <div className="w-px h-4 bg-white/20 mx-0.5" />
            <ChevronDown className="h-3 w-3" />
          </button>

          {/* Settings button */}
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-0.5 text-sm font-medium transition-all hover:bg-white/20 hover:scale-[1.02] rounded-full bg-gradient-to-br from-white/15 via-white/10 to-white/5 border border-white/30 text-white shadow-[0_2px_8px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>

          {/* New Chat button - only visible in expanded mode */}
          {isExpanded && (
            <button
              type="button"
              onClick={onNewChat}
              className="flex items-center gap-1 px-2 py-0.5 text-sm font-medium transition-all hover:bg-white/20 hover:scale-[1.02] rounded-full bg-gradient-to-br from-white/15 via-white/10 to-white/5 border border-white/30 text-white shadow-[0_2px_8px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>New Chat</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

