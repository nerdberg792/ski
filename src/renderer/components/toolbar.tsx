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
            ? "rgba(51, 65, 85, 0.35)" 
            : "rgba(15, 23, 42, 0.25)",
          backdropFilter: "blur(50px) saturate(110%)",
          WebkitBackdropFilter: "blur(50px) saturate(110%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 50px rgba(0, 0, 0, 0.1), 0 0 80px rgba(0, 0, 0, 0.05)",
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
          className="gap-2 rounded-full px-3 hover:scale-[1.02] transition-transform"
          size="sm"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.08) 0%, rgba(15, 23, 42, 0.2) 60%, rgba(15, 23, 42, 0.12) 100%)",
            backdropFilter: "blur(50px) saturate(110%)",
            WebkitBackdropFilter: "blur(50px) saturate(110%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.1), inset 0 -2px 4px rgba(0, 0, 0, 0.12), inset 0 0 30px rgba(255, 255, 255, 0.03), 0 0 60px rgba(0, 0, 0, 0.1), 0 0 90px rgba(0, 0, 0, 0.05)",
            textShadow: "-0.08px -0.08px 0 white, 0.08px -0.08px 0 white, -0.08px 0.08px 0 white, 0.08px 0.08px 0 white, -0.08px 0 0 white, 0.08px 0 0 white, 0 -0.08px 0 white, 0 0.08px 0 white",
          }}
        >
          <Paperclip className="h-4 w-4" />
          Attach
        </Button>
        <Button
          variant="ghost"
          className="gap-2 rounded-full px-3 hover:scale-[1.02] transition-transform"
          size="sm"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.08) 0%, rgba(15, 23, 42, 0.2) 60%, rgba(15, 23, 42, 0.12) 100%)",
            backdropFilter: "blur(50px) saturate(110%)",
            WebkitBackdropFilter: "blur(50px) saturate(110%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.1), inset 0 -2px 4px rgba(0, 0, 0, 0.12), inset 0 0 30px rgba(255, 255, 255, 0.03), 0 0 60px rgba(0, 0, 0, 0.1), 0 0 90px rgba(0, 0, 0, 0.05)",
            textShadow: "-0.08px -0.08px 0 white, 0.08px -0.08px 0 white, -0.08px 0.08px 0 white, 0.08px 0.08px 0 white, -0.08px 0 0 white, 0.08px 0 0 white, 0 -0.08px 0 white, 0 0.08px 0 white",
          }}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
        <Button
          variant="glow"
          className="gap-2 px-4 text-xs font-semibold hover:scale-[1.02] transition-transform"
          size="sm"
          onClick={onNewChat}
          style={{
            background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(200, 200, 200, 0.18) 40%, rgba(150, 150, 150, 0.12) 70%, rgba(120, 120, 120, 0.08) 100%)",
            backdropFilter: "blur(50px) saturate(110%)",
            WebkitBackdropFilter: "blur(50px) saturate(110%)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.18), inset 0 -2px 4px rgba(0, 0, 0, 0.1), inset 0 0 30px rgba(255, 255, 255, 0.05), 0 0 70px rgba(0, 0, 0, 0.12), 0 0 100px rgba(0, 0, 0, 0.06)",
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

