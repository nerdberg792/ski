import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChatEntry, PromptWindow } from "@/types/chat";
import { useAutoHeight } from "@/hooks/useAutoHeight";
import { PromptInputBox } from "@/components/prompt-input-box";
import { cn } from "@/lib/utils";

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
}: PromptWindowProps) {
  const { containerRef, contentRef, containerStyle } = useAutoHeight(500);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-auto w-full flex flex-col gap-0", className)}
      style={{
        ...containerStyle,
        zIndex,
        boxShadow: "0 0 20px rgba(255, 105, 180, 0.08), 0 0 40px rgba(255, 20, 147, 0.05), 0 0 60px rgba(255, 105, 180, 0.03)",
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
        className="w-full rounded-xl overflow-hidden p-0"
        style={{
          background: "transparent",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          border: "none",
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
          className="px-5 pt-4 pb-3 relative"
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div 
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-800"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
              }}
            >
              {win.entries.find(e => e.kind === "response")?.sourceLabel ?? "Sky"}
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={() => onClose(win.id)}
                className="rounded-lg border border-slate-200/50 bg-white/40 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white/60 transition-colors"
              >
                Close
              </button>
            ) : null}
          </div>
          <CardTitle className="text-slate-900 text-base font-medium leading-tight">
            {win.prompt}
          </CardTitle>
        </div>
        
        {/* Response section with different transparency */}
        <CardContent 
          ref={contentRef as unknown as React.Ref<HTMLDivElement>}
          className="min-h-[300px] px-5 py-4"
          style={{
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
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
          <div className="flex flex-col gap-4">
            {win.entries
              .filter((e) => e.kind !== "prompt")
              .map((entry) => (
                <EntryBlock key={entry.id} entry={entry} />
              ))}
          </div>
        </CardContent>
      </Card>
      {/* Input box below response card - no gap, blends seamlessly */}
      {showInput && inputValue !== undefined && onInputChange && onSubmit ? (
        <PromptInputBox
          inputValue={inputValue}
          onInputChange={onInputChange}
          onSubmit={onSubmit}
          isProcessing={isProcessing}
          onCollapse={onCollapse}
          onNewChat={onNewChat}
          inputRef={inputRef}
        />
      ) : null}
    </div>
  );
}

function EntryBlock({ entry }: { entry: ChatEntry }) {
  return (
    <div className="flex flex-col gap-3">
      {entry.sourceLabel && (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs">
            {entry.sourceLabel}
          </Badge>
        </div>
      )}
      {entry.heading ? (
        <div className="text-slate-900 font-semibold text-base leading-snug">
          {entry.heading}
        </div>
      ) : null}
      {entry.body ? (
        <p className="text-slate-700 leading-relaxed text-[15px]">
          {entry.body}
        </p>
      ) : null}
      {entry.bullets ? (
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-[15px] leading-relaxed">
          {entry.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : null}
      {entry.footnote ? (
        <p className="text-xs text-slate-500 mt-2">{entry.footnote}</p>
      ) : null}
    </div>
  );
}


