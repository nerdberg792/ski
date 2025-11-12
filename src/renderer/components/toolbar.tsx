import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Globe2,
  Paperclip,
  Settings,
  Plus,
  CheckCircle2,
} from "lucide-react";

interface ToolbarProps {
  searchEnabled: boolean;
  onToggleSearch: () => void;
  onNewChat: () => void;
}

export function Toolbar({ searchEnabled, onToggleSearch, onNewChat }: ToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ background: "transparent" }}>
      <Button
        variant="secondary"
        className={cn(
          "gap-2 rounded-2xl px-4 text-xs font-medium text-white/80 shadow-lg",
          searchEnabled && "text-white",
        )}
        onClick={onToggleSearch}
        style={{
          background: searchEnabled 
            ? "rgba(51, 65, 85, 0.5)" 
            : "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
          textShadow: "-0.08px -0.08px 0 white, 0.08px -0.08px 0 white, -0.08px 0.08px 0 white, 0.08px 0.08px 0 white, -0.08px 0 0 white, 0.08px 0 0 white, 0 -0.08px 0 white, 0 0.08px 0 white",
        }}
      >
        {searchEnabled ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
        ) : (
          <Globe2 className="h-4 w-4" />
        )}
        Search Web
      </Button>
      <div className="flex items-center gap-2 text-white/70" style={{ background: "transparent" }}>
        <Button
          variant="ghost"
          className="gap-2 rounded-full px-3"
          size="sm"
          style={{
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
            textShadow: "-0.08px -0.08px 0 white, 0.08px -0.08px 0 white, -0.08px 0.08px 0 white, 0.08px 0.08px 0 white, -0.08px 0 0 white, 0.08px 0 0 white, 0 -0.08px 0 white, 0 0.08px 0 white",
          }}
        >
          <Paperclip className="h-4 w-4" />
          Attach
        </Button>
        <Button
          variant="ghost"
          className="gap-2 rounded-full px-3"
          size="sm"
          style={{
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
            textShadow: "-0.08px -0.08px 0 white, 0.08px -0.08px 0 white, -0.08px 0.08px 0 white, 0.08px 0.08px 0 white, -0.08px 0 0 white, 0.08px 0 0 white, 0 -0.08px 0 white, 0 0.08px 0 white",
          }}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
        <Button
          variant="glow"
          className="gap-2 px-4 text-xs font-semibold"
          size="sm"
          onClick={onNewChat}
          style={{
            background: "linear-gradient(to right, rgba(244, 114, 182, 0.6), rgba(168, 85, 247, 0.6), rgba(59, 130, 246, 0.6))",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
            textShadow: "-0.08px -0.08px 0 white, 0.08px -0.08px 0 white, -0.08px 0.08px 0 white, 0.08px 0.08px 0 white, -0.08px 0 0 white, 0.08px 0 0 white, 0 -0.08px 0 white, 0 0.08px 0 white",
          }}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
    </div>
  );
}

