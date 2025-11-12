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
  return (
    <div className="flex flex-1 items-center gap-2 min-w-0">
      <form
        onSubmit={onSubmit}
        className={cn(
          "flex flex-1 items-center gap-0 rounded-2xl py-2 relative overflow-hidden min-w-0",
          isExpanded ? "pl-2 pr-0.5" : "pl-3 pr-0"
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
            "bg-transparent border-none outline-none text-white text-base py-0 placeholder-glass min-w-0",
            isExpanded ? "flex-1 pr-1" : "flex-1 pr-0"
          )}
          style={{
            textShadow: "-0.1px -0.1px 0 white, 0.1px -0.1px 0 white, -0.1px 0.1px 0 white, 0.1px 0.1px 0 white, -0.1px 0 0 white, 0.1px 0 0 white, 0 -0.1px 0 white, 0 0.1px 0 white",
          }}
          autoFocus
        />
        {isExpanded ? (
          <button
            onClick={onCollapse}
            className="rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white/90 flex-shrink-0"
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
            className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white/90 flex-shrink-0 ml-0.5"
            style={{ 
              WebkitAppRegion: "no-drag",
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
      <div className="flex items-center gap-2 flex-shrink-0 overflow-visible">
        {/* Attach button with dropdown */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 text-sm font-medium transition-all"
          style={{
            WebkitAppRegion: "no-drag",
            borderRadius: "40px",
            paddingTop: "1.5px",
            paddingBottom: "1.5px",
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 8px rgba(255, 105, 180, 0.15), 0 0 4px rgba(255, 20, 147, 0.1)",
            color: "rgba(255, 192, 203, 0.95)",
            textShadow: "0 0 8px rgba(255, 192, 203, 0.5)",
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
          className="flex items-center gap-1.5 px-3 text-sm font-medium transition-all"
          style={{
            WebkitAppRegion: "no-drag",
            borderRadius: "40px",
            paddingTop: "1.5px",
            paddingBottom: "1.5px",
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 8px rgba(255, 105, 180, 0.15), 0 0 4px rgba(255, 20, 147, 0.1)",
            color: "rgba(255, 192, 203, 0.95)",
            textShadow: "0 0 8px rgba(255, 192, 203, 0.5)",
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
            className="flex items-center gap-1.5 px-3 text-sm font-medium transition-all"
            style={{
              WebkitAppRegion: "no-drag",
              borderRadius: "40px",
              paddingTop: "1.5px",
              paddingBottom: "1.5px",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 8px rgba(255, 105, 180, 0.15), 0 0 4px rgba(255, 20, 147, 0.1)",
              color: "rgba(255, 192, 203, 0.95)",
              textShadow: "0 0 8px rgba(255, 192, 203, 0.5)",
            } as React.CSSProperties}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        )}
      </div>
    </div>
  );
}

