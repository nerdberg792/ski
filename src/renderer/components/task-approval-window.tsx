import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Action, PendingAction } from "@/types/actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Globe, Terminal, Play, FileText, ChevronDown } from "lucide-react";

interface TaskApprovalWindowProps {
  pendingAction: PendingAction;
  onApprove: () => void;
  onCancel: () => void;
  className?: string;
  position?: "below-prompt" | "standalone" | "inline";
}

// Helper function to get icon component based on action
const getActionIcon = (action: Action) => {
  const iconName = action.iconName?.toLowerCase() || "";
  const actionName = action.name.toLowerCase();

  if (iconName.includes("message") || actionName.includes("message") || actionName.includes("send")) {
    return MessageSquare;
  } else if (iconName.includes("browser") || iconName.includes("web") || actionName.includes("open") || actionName.includes("browse")) {
    return Globe;
  } else if (iconName.includes("terminal") || iconName.includes("command") || actionName.includes("execute")) {
    return Terminal;
  } else if (iconName.includes("file") || iconName.includes("document")) {
    return FileText;
  } else {
    return Play; // Default icon
  }
};

// Helper function to get action verb
const getActionVerb = (action: Action): string => {
  if (action.actionVerb) {
    return action.actionVerb;
  }

  // Infer from action name
  const name = action.name.toLowerCase();
  if (name.includes("send")) return "Send";
  if (name.includes("open")) return "Open";
  if (name.includes("execute") || name.includes("run")) return "Execute";
  if (name.includes("create")) return "Create";
  if (name.includes("delete")) return "Delete";
  if (name.includes("update")) return "Update";

  return "Proceed"; // Default
};

export function TaskApprovalWindow({
  pendingAction,
  onApprove,
  onCancel,
  className,
  position = "below-prompt",
}: TaskApprovalWindowProps) {
  const { action, parameters } = pendingAction;
  const ActionIcon = getActionIcon(action);
  const actionVerb = getActionVerb(action);

  // Inline mode: blend into parent card without borders/background
  if (position === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
        className={cn("w-full", className)}
      >
        {/* Inline content - no card wrapper */}
        <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
          {/* Tab-like header with icon and action name */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
              <ActionIcon className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">{action.name}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-white/40" />
          </div>

          {/* Description */}
          <p className="text-sm text-white/70 leading-relaxed">
            {action.description}
          </p>

          {/* Parameters if any */}
          {parameters && Object.keys(parameters).length > 0 && (
            <div className="space-y-1">
              {Object.entries(parameters).map(([key, value]) => (
                <p
                  key={key}
                  className="text-sm text-white/70 leading-relaxed"
                >
                  <span className="font-medium text-white/90">{key}:</span> {String(value)}
                </p>
              ))}
            </div>
          )}

          {/* Action buttons - combined, half width, right-aligned */}
          <div className="flex justify-end pt-2">
            <div className="flex items-center gap-2 w-1/2">
              <Button
                onClick={onCancel}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white/90 hover:text-white rounded-lg border-none shadow-none font-medium h-9"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="default"
                onClick={onApprove}
                className="flex-1 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-lg font-medium border-none shadow-none h-9"
              >
                {actionVerb}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Standalone/below-prompt mode: render as separate card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 25,
      }}
      className={cn(
        "pointer-events-auto w-full",
        position === "standalone" && "mt-4",
        className,
      )}
    >
      <Card
        className="w-full rounded-xl overflow-hidden p-0 flex flex-col bg-white/95 backdrop-blur-md border border-glass-border shadow-glass-lg"
      >
        {/* Content */}
        <CardContent
          className="px-6 py-5 flex-shrink-0"
        >
          <div className="flex flex-col gap-3">
            {/* Tab-like header with icon and action name */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/10 rounded-lg">
                <ActionIcon className="w-4 h-4 text-black/70" />
                <span className="text-sm font-medium text-black/80">{action.name}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-black/40" />
            </div>

            {/* Description */}
            <p className="text-sm text-black/70 leading-relaxed">
              {action.description}
            </p>

            {/* Parameters if any */}
            {parameters && Object.keys(parameters).length > 0 && (
              <div className="space-y-1">
                {Object.entries(parameters).map(([key, value]) => (
                  <p
                    key={key}
                    className="text-sm text-black/70 leading-relaxed"
                  >
                    <span className="font-medium text-black/90">{key}:</span> {String(value)}
                  </p>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* Actions */}
        <div
          className="px-6 py-5 flex-shrink-0 flex justify-end border-t border-glass-border bg-white/5"
        >
          <div className="flex items-center gap-2 w-1/2">
            <Button
              onClick={onCancel}
              className="flex-1 bg-black/10 hover:bg-black/20 text-black/70 hover:text-black/90 rounded-lg border-none shadow-none font-medium h-9"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="default"
              onClick={onApprove}
              className="flex-1 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-lg font-medium border-none shadow-none h-9"
            >
              {actionVerb}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

