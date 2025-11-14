import { ChatInputBar } from "@/components/chat-input-bar";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PromptInputBoxProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isProcessing?: boolean;
  onCollapse?: () => void;
  onNewChat?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
  className?: string;
}

export function PromptInputBox({
  inputValue,
  onInputChange,
  onSubmit,
  isProcessing = false,
  onCollapse,
  onNewChat,
  inputRef,
  className,
}: PromptInputBoxProps) {
  const hasText = inputValue.trim().length > 0;
  const [isInputVisible, setIsInputVisible] = useState(false);
  
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-1.5 px-1.5 py-1 min-w-0",
        className
      )}
      style={{
        WebkitAppRegion: "no-drag",
        transition: "all 350ms cubic-bezier(0.25, 0.1, 0.25, 1.0)",
      } as React.CSSProperties}
    >
      <div 
        onClick={() => {
          // Toggle input: if visible, blur it; if hidden, focus it
          if (inputRef && 'current' in inputRef && inputRef.current) {
            if (isInputVisible) {
              inputRef.current.blur();
            } else {
              inputRef.current.focus();
            }
          }
        }}
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        className="cursor-pointer"
      >
        <Logo isExpanded={true} />
      </div>
      <ChatInputBar
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
        isProcessing={isProcessing}
        onCollapse={onCollapse}
        onNewChat={onNewChat}
        isExpanded={true}
        inputRef={inputRef}
        onInputVisibilityChange={setIsInputVisible}
      />
    </div>
  );
}

