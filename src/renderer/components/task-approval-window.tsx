import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Action, PendingAction } from "@/types/actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TaskApprovalWindowProps {
  pendingAction: PendingAction;
  onApprove: () => void;
  onCancel: () => void;
  className?: string;
  position?: "below-prompt" | "standalone";
}

export function TaskApprovalWindow({
  pendingAction,
  onApprove,
  onCancel,
  className,
  position = "below-prompt",
}: TaskApprovalWindowProps) {
  const { action, parameters } = pendingAction;

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
        className="w-full rounded-xl overflow-hidden p-0 flex flex-col"
        style={{
          background: "transparent",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          border: "none",
          boxShadow:
            "0 0 50px rgba(0, 0, 0, 0.10), 0 0 100px rgba(0, 0, 0, 0.06), 0 0 150px rgba(0, 0, 0, 0.04), 0 8px 32px rgba(0, 0, 0, 0.08)",
          filter: "drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))",
        }}
      >
        {/* Header */}
        <div
          className="px-5 pt-4 pb-3 relative flex-shrink-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.95) 50%, rgba(248, 248, 248, 0.92) 100%)",
            backdropFilter: "blur(60px) saturate(120%)",
            WebkitBackdropFilter: "blur(60px) saturate(120%)",
            boxShadow:
              "inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.03)",
          }}
        >
          <CardTitle
            className="text-slate-900 text-base font-semibold leading-tight mb-2"
            style={{ color: "rgb(15, 23, 42)" }}
          >
            Action Required
          </CardTitle>
          <p
            className="text-sm text-slate-600"
            style={{ color: "rgb(71, 85, 105)" }}
          >
            {action.description}
          </p>
        </div>

        {/* Content */}
        <CardContent
          className="px-5 py-4 flex-shrink-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(252, 252, 252, 0.95) 0%, rgba(248, 248, 248, 0.88) 40%, rgba(245, 245, 245, 0.80) 100%)",
            backdropFilter: "blur(60px) saturate(120%)",
            WebkitBackdropFilter: "blur(60px) saturate(120%)",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.4)",
          }}
        >
          <div className="flex flex-col gap-3">
            <div>
              <p
                className="font-semibold text-base leading-snug mb-1"
                style={{ color: "rgb(15, 23, 42)" }}
              >
                {action.name}
              </p>
              {parameters && Object.keys(parameters).length > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(parameters).map(([key, value]) => (
                    <p
                      key={key}
                      className="text-sm text-slate-600"
                      style={{ color: "rgb(71, 85, 105)" }}
                    >
                      <span className="font-medium">{key}:</span> {String(value)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {/* Actions */}
        <div
          className="px-5 py-4 flex-shrink-0 flex items-center justify-end gap-3"
          style={{
            background:
              "linear-gradient(to bottom, rgba(252, 252, 252, 0.95) 0%, rgba(248, 248, 248, 0.88) 100%)",
            backdropFilter: "blur(60px) saturate(120%)",
            WebkitBackdropFilter: "blur(60px) saturate(120%)",
            borderTop: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <Button
            variant="ghost"
            size="default"
            onClick={onCancel}
            className="opacity-90 hover:opacity-100"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="default"
            onClick={onApprove}
            className="opacity-90 hover:opacity-100"
          >
            Proceed
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

