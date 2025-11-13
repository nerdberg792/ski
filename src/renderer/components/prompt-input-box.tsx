import { ChatInputBar } from "@/components/chat-input-bar";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

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
  
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-1.5 px-1.5 py-1 min-w-0",
        className
      )}
      style={{
        WebkitAppRegion: "no-drag",
      } as React.CSSProperties}
    >
      <Logo isExpanded={true} />
      <ChatInputBar
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
        isProcessing={isProcessing}
        onCollapse={onCollapse}
        onNewChat={onNewChat}
        isExpanded={true}
        inputRef={inputRef}
      />
    </div>
  );
}

