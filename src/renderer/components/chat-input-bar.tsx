import { Paperclip, ChevronDown, ChevronUp, Settings, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
}: ChatInputBarProps) {
  const hasText = inputValue.trim().length > 0;
  const isCollapsed = !isExpanded;
  
  return (
    <div className={cn(
      "flex items-center transition-all duration-300 min-w-0",
      isCollapsed ? "gap-5 flex-shrink-0" : hasText ? "gap-0 flex-1" : "gap-2 flex-1"
    )}>
      <form
        onSubmit={onSubmit}
        className={cn(
          "flex items-center gap-0 rounded-2xl relative overflow-hidden transition-all duration-300 flex-shrink-0",
          isExpanded ? "pl-2 pr-0.5 py-2" : "pl-1.5 pr-0 py-1.5"
        )}
        style={{ 
          WebkitAppRegion: "no-drag",
          background: "transparent",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
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
            isExpanded 
              ? inputValue.trim() 
                ? "w-auto min-w-[80px] max-w-[300px] pr-1" 
                : "w-[80px] pr-1"
              : inputValue.trim() 
                ? "w-auto min-w-[60px] pr-0" 
                : "w-[60px]",
            "transition-all duration-300 ease-in-out"
          )}
          style={{
            textShadow: "-0.1px -0.1px 0 white, 0.1px -0.1px 0 white, -0.1px 0.1px 0 white, 0.1px 0.1px 0 white, -0.1px 0 0 white, 0.1px 0 0 white, 0 -0.1px 0 white, 0 0.1px 0 white",
          }}
          autoFocus
        />
        {isExpanded ? (
          <button
            onClick={onCollapse}
            className="rounded-lg p-1 text-white/60 transition-opacity transition-colors hover:bg-white/10 hover:text-white/90 hover:opacity-100 opacity-72 flex-shrink-0"
            style={{ 
              WebkitAppRegion: "no-drag",
              textShadow: "0 0 20px rgba(244, 114, 182, 0.8), 0 0 10px rgba(244, 114, 182, 0.6), 0 0 5px rgba(244, 114, 182, 0.4)",
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            } as React.CSSProperties}
            title="Collapse window"
          >
            <ChevronDown 
              className="h-4 w-4" 
              style={{
                filter: "drop-shadow(-0.3px -0.3px 0 rgba(0, 0, 0, 1)) drop-shadow(0.3px -0.3px 0 rgba(0, 0, 0, 1)) drop-shadow(-0.3px 0.3px 0 rgba(0, 0, 0, 1)) drop-shadow(0.3px 0.3px 0 rgba(0, 0, 0, 1)) drop-shadow(0 -0.3px 0 rgba(0, 0, 0, 1)) drop-shadow(0 0.3px 0 rgba(0, 0, 0, 1)) drop-shadow(-0.3px 0 0 rgba(0, 0, 0, 1)) drop-shadow(0.3px 0 0 rgba(0, 0, 0, 1)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
              }}
            />
          </button>
        ) : (
          <button
            onClick={onExpand}
            className="rounded-lg text-white/60 transition-opacity transition-colors hover:bg-white/10 hover:text-white/90 hover:opacity-100 opacity-72 flex-shrink-0"
            style={{ 
              WebkitAppRegion: "no-drag",
              padding: "4px",
              paddingRight: "2px",
              textShadow: "0 0 20px rgba(244, 114, 182, 0.8), 0 0 10px rgba(244, 114, 182, 0.6), 0 0 5px rgba(244, 114, 182, 0.4)",
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            } as React.CSSProperties}
            title="Expand window"
          >
            <ChevronUp 
              className="h-4 w-4" 
              style={{
                filter: "drop-shadow(-0.3px -0.3px 0 rgba(0, 0, 0, 1)) drop-shadow(0.3px -0.3px 0 rgba(0, 0, 0, 1)) drop-shadow(-0.3px 0.3px 0 rgba(0, 0, 0, 1)) drop-shadow(0.3px 0.3px 0 rgba(0, 0, 0, 1)) drop-shadow(0 -0.3px 0 rgba(0, 0, 0, 1)) drop-shadow(0 0.3px 0 rgba(0, 0, 0, 1)) drop-shadow(-0.3px 0 0 rgba(0, 0, 0, 1)) drop-shadow(0.3px 0 0 rgba(0, 0, 0, 1)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
              }}
            />
          </button>
        )}
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
            background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 100%)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 0 15px rgba(244, 114, 182, 0.4), 0 0 30px rgba(244, 114, 182, 0.3), 0 0 50px rgba(168, 85, 247, 0.25), 0 0 80px rgba(244, 114, 182, 0.15), 0 0 120px rgba(168, 85, 247, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.1)",
            color: "rgba(255, 192, 203, 0.95)",
            textShadow: "0 0 10px rgba(255, 192, 203, 0.8), 0 0 20px rgba(244, 114, 182, 0.6), 0 0 30px rgba(244, 114, 182, 0.4)",
            filter: "drop-shadow(0 0 8px rgba(244, 114, 182, 0.5))",
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
            background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 100%)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 0 15px rgba(244, 114, 182, 0.4), 0 0 30px rgba(244, 114, 182, 0.3), 0 0 50px rgba(168, 85, 247, 0.25), 0 0 80px rgba(244, 114, 182, 0.15), 0 0 120px rgba(168, 85, 247, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.1)",
            color: "rgba(255, 192, 203, 0.95)",
            textShadow: "0 0 10px rgba(255, 192, 203, 0.8), 0 0 20px rgba(244, 114, 182, 0.6), 0 0 30px rgba(244, 114, 182, 0.4)",
            filter: "drop-shadow(0 0 8px rgba(244, 114, 182, 0.5))",
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
              background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 100%)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 0 15px rgba(244, 114, 182, 0.4), 0 0 30px rgba(244, 114, 182, 0.3), 0 0 50px rgba(168, 85, 247, 0.25), 0 0 80px rgba(244, 114, 182, 0.15), 0 0 120px rgba(168, 85, 247, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.1)",
              color: "rgba(255, 192, 203, 0.95)",
              textShadow: "0 0 10px rgba(255, 192, 203, 0.8), 0 0 20px rgba(244, 114, 182, 0.6), 0 0 30px rgba(244, 114, 182, 0.4)",
              filter: "drop-shadow(0 0 8px rgba(244, 114, 182, 0.5))",
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

