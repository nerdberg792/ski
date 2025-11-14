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
          "flex items-center gap-0 rounded-2xl relative overflow-hidden transition-all duration-300 flex-shrink-0",
          isExpanded ? "pl-2 pr-0.5 py-2" : "pl-1.5 pr-0 py-1.5",
          !showInput && "cursor-pointer"
        )}
        style={{ 
          WebkitAppRegion: "no-drag",
          background: "transparent",
          backdropFilter: "blur(40px) saturate(120%)",
          WebkitBackdropFilter: "blur(40px) saturate(120%)",
          boxShadow: "none",
          border: "none",
        } as React.CSSProperties}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
            }
          }}
          placeholder=""
          className={cn(
            "bg-transparent border-none outline-none text-white text-base py-0 placeholder-glass",
            showInput
              ? inputValue.trim()
                ? isExpanded
                  ? "w-auto min-w-[80px] max-w-[300px] pr-1"
                  : "w-auto min-w-[80px] max-w-[200px] pr-1"
                : "w-[80px] pr-1"
              : "w-0",
            "transition-all duration-300 ease-in-out"
          )}
          style={{
            textShadow: "-0.1px -0.1px 0 white, 0.1px -0.1px 0 white, -0.1px 0.1px 0 white, 0.1px 0.1px 0 white, -0.1px 0 0 white, 0.1px 0 0 white, 0 -0.1px 0 white, 0 0.1px 0 white",
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
          className="flex items-center gap-1.5 px-3 text-sm font-medium transition-all hover:opacity-70 hover:scale-[1.02]"
          style={{
            WebkitAppRegion: "no-drag",
            borderRadius: "40px",
            paddingTop: "1.5px",
            paddingBottom: "1.5px",
            background: "radial-gradient(ellipse at top, rgba(255, 255, 255, 0.22) 0%, rgba(245, 245, 250, 0.14) 30%, rgba(220, 225, 235, 0.08) 60%, rgba(180, 190, 210, 0.03) 100%)",
            backdropFilter: "blur(60px) saturate(150%)",
            WebkitBackdropFilter: "blur(60px) saturate(150%)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            boxShadow: "0 0 30px rgba(0, 0, 0, 0.08), 0 0 50px rgba(0, 0, 0, 0.05), 0 0 80px rgba(0, 0, 0, 0.03), 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 2px 6px rgba(255, 255, 255, 0.3), inset 0 -2px 6px rgba(0, 0, 0, 0.08), inset 0 0 40px rgba(255, 255, 255, 0.06)",
            color: "rgba(255, 255, 255, 0.95)",
            textShadow: "0 0 12px rgba(200, 200, 200, 0.4), 0 0 20px rgba(150, 150, 150, 0.2)",
            filter: "drop-shadow(0 0 15px rgba(0, 0, 0, 0.1))",
          } as React.CSSProperties}
        >
          <Paperclip className="h-4 w-4" />
          <span>Attach</span>
          <div className="w-px h-4 bg-white/20 mx-0.5" />
          <ChevronDown className="h-3 w-3" />
        </button>
        
        {/* Settings button */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 text-sm font-medium transition-all hover:opacity-70 hover:scale-[1.02]"
          style={{
            WebkitAppRegion: "no-drag",
            borderRadius: "40px",
            paddingTop: "1.5px",
            paddingBottom: "1.5px",
            background: "radial-gradient(ellipse at top, rgba(255, 255, 255, 0.22) 0%, rgba(245, 245, 250, 0.14) 30%, rgba(220, 225, 235, 0.08) 60%, rgba(180, 190, 210, 0.03) 100%)",
            backdropFilter: "blur(60px) saturate(150%)",
            WebkitBackdropFilter: "blur(60px) saturate(150%)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            boxShadow: "0 0 30px rgba(0, 0, 0, 0.08), 0 0 50px rgba(0, 0, 0, 0.05), 0 0 80px rgba(0, 0, 0, 0.03), 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 2px 6px rgba(255, 255, 255, 0.3), inset 0 -2px 6px rgba(0, 0, 0, 0.08), inset 0 0 40px rgba(255, 255, 255, 0.06)",
            color: "rgba(255, 255, 255, 0.95)",
            textShadow: "0 0 12px rgba(200, 200, 200, 0.4), 0 0 20px rgba(150, 150, 150, 0.2)",
            filter: "drop-shadow(0 0 15px rgba(0, 0, 0, 0.1))",
          } as React.CSSProperties}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </button>
        
        {/* New Chat button - only visible in expanded mode */}
        {isExpanded && (
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 text-sm font-medium transition-all hover:opacity-70 hover:scale-[1.02]"
            style={{
              WebkitAppRegion: "no-drag",
              borderRadius: "40px",
              paddingTop: "1.5px",
              paddingBottom: "1.5px",
              background: "radial-gradient(ellipse at top, rgba(255, 255, 255, 0.22) 0%, rgba(245, 245, 250, 0.14) 30%, rgba(220, 225, 235, 0.08) 60%, rgba(180, 190, 210, 0.03) 100%)",
              backdropFilter: "blur(60px) saturate(150%)",
              WebkitBackdropFilter: "blur(60px) saturate(150%)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              boxShadow: "0 0 30px rgba(0, 0, 0, 0.08), 0 0 50px rgba(0, 0, 0, 0.05), 0 0 80px rgba(0, 0, 0, 0.03), 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 2px 6px rgba(255, 255, 255, 0.3), inset 0 -2px 6px rgba(0, 0, 0, 0.08), inset 0 0 40px rgba(255, 255, 255, 0.06)",
              color: "rgba(255, 255, 255, 0.95)",
              textShadow: "0 0 12px rgba(200, 200, 200, 0.4), 0 0 20px rgba(150, 150, 150, 0.2)",
              filter: "drop-shadow(0 0 15px rgba(0, 0, 0, 0.1))",
            } as React.CSSProperties}
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

