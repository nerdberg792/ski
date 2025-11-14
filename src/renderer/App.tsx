import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { ChatInputBar } from "@/components/chat-input-bar";
import type { ChatEntry } from "@/types/chat";
import { initialEntries, generateMockResponse } from "@/data/presets";
import { cn } from "@/lib/utils";
import { ExpandedBackground } from "@/components/expanded-background";
import { PromptWindowsStack } from "@/components/prompt-windows-stack";
import type { PromptWindow } from "@/types/chat";

function useSkyBridge() {
  return useMemo(() => window.sky, []);
}

export default function App() {
  const sky = useSkyBridge();
  const [entries, setEntries] = useState<ChatEntry[]>(initialEntries);
  const [searchEnabled, setSearchEnabled] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [promptWindows, setPromptWindows] = useState<PromptWindow[]>([]);
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribeVisibility = sky?.onVisibilityChange?.((value) => {
      setIsVisible(value);
      if (value && isExpanded) {
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    });

    const unsubscribeExpanded = sky?.onExpandedChange?.((expanded) => {
      setIsExpanded(expanded);
      if (expanded) {
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    });

    const unsubscribeBlur = sky?.onBlur?.(() => {
      // Don't hide the window on blur - keep it visible
      // Only hide via explicit toggle (Cmd+K) or Escape key
    });

    return () => {
      unsubscribeVisibility?.();
      unsubscribeExpanded?.();
      unsubscribeBlur?.();
    };
  }, [sky, isExpanded]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isExpanded) {
          handleCollapse();
        } else {
          sky?.toggleOverlay(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sky, isExpanded]);

  useEffect(() => {
    if (isVisible) {
      if (isExpanded) {
        textareaRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    }
  }, [isVisible, isExpanded]);

  // Collapse window when all prompt windows are closed
  useEffect(() => {
    if (promptWindows.length === 0 && isExpanded) {
      sky?.collapse();
      setIsExpanded(false);
    }
  }, [promptWindows.length, isExpanded, sky]);

  // Focused-result persistence no longer needed in the stacked flow; keep stub state only.

  const handleSelectResult = (id: string) => {
    console.log("[App] handleSelectResult", { id });
    setSelectedResultId(id);
  };

  const handleClearSelection = () => {
    console.log("[App] handleClearSelection");
    setSelectedResultId(null);
  };

  const submitPrompt = () => {
    if (!inputValue.trim()) return;

    const prompt = inputValue.trim();
    const promptEntry: ChatEntry = {
      id: `prompt-${Date.now()}`,
      kind: "prompt",
      heading: prompt,
      subheading: searchEnabled ? "Searching the web with context…" : "Using on-screen context…",
      highlight: true,
      sourceLabel: searchEnabled ? "Search Web" : "Sky",
    };

    // If not expanded, expand first
    if (!isExpanded) {
      setIsExpanding(true);
      sky?.expand();
      setIsExpanded(true);
      // Clear initial entries when starting a new conversation
      setEntries([]);
      // Reset expanding state after animation (matches our 400ms animation duration)
      setTimeout(() => setIsExpanding(false), 450);
    }

    setEntries((prev) => [...prev, promptEntry]);
    setInputValue("");
    setIsProcessing(true);

    // Create a new floating prompt window that will stream the response
    const windowId = `win-${Date.now()}`;
    const createdAt = Date.now();

    // Get the mock response
    const responses = generateMockResponse(prompt).map((entry) => ({
      ...entry,
      sourceLabel: searchEnabled ? entry.sourceLabel ?? "Search Web" : "Sky",
    }));

    // For window, we only show the first response in the card; others still appear in chat below
    const firstResponse = responses[0];
    const responseEntryForWindow: ChatEntry | undefined = firstResponse
      ? { ...firstResponse, id: `${windowId}-resp`, body: firstResponse.body ? "" : undefined }
      : undefined;

    // Create response entries with empty body initially for the chat timeline
    const responseEntries: ChatEntry[] = responses.map((entry) => ({
      ...entry,
      body: entry.body ? "" : undefined,
    }));

    // Initialize window with prompt + empty response
    setPromptWindows((prev) => [
      {
        id: windowId,
        prompt,
        entries: [
          { ...promptEntry, id: `${windowId}-prompt` },
          ...(responseEntryForWindow ? [responseEntryForWindow] : []),
        ],
        status: "streaming",
        createdAt,
      },
      ...prev,
    ]);

    // Add empty response entries immediately
    setEntries((prev) => [...prev, ...responseEntries]);

    // Start streaming after a short delay
    window.setTimeout(() => {
      responses.forEach((fullResponse, responseIndex) => {
        // Stream the body text if it exists
        if (fullResponse.body) {
          streamText(
            fullResponse.id,
            fullResponse.body,
            responseIndex * 100, // Stagger multiple responses
            (streamedText) => {
              setEntries((prev) =>
                prev.map((entry) =>
                  entry.id === fullResponse.id
                    ? { ...entry, body: streamedText }
                    : entry
                )
              );
              // Update matching window response if this is the first response
              if (responseIndex === 0) {
                setPromptWindows((prev) =>
                  prev.map((w) =>
                    w.id !== windowId
                      ? w
                      : {
                          ...w,
                          entries: w.entries.map((e) =>
                            e.id === `${windowId}-resp` ? { ...e, body: streamedText } : e,
                          ),
                        },
                  ),
                );
              }
            },
            () => {
              // After body is streamed, add bullets if they exist
              if (fullResponse.bullets && fullResponse.bullets.length > 0) {
                setTimeout(() => {
                  setEntries((prev) =>
                    prev.map((entry) =>
                      entry.id === fullResponse.id
                        ? { ...entry, bullets: fullResponse.bullets }
                        : entry
                    )
                  );
                }, 200);
              }
              // Mark processing as complete after the last response finishes
              if (responseIndex === responses.length - 1) {
                setTimeout(() => {
                  setIsProcessing(false);
                  requestAnimationFrame(() => textareaRef.current?.focus());
                }, 300);
              }
              // When first response finishes, mark the window as done
              if (responseIndex === 0) {
                setPromptWindows((prev) =>
                  prev.map((w) => (w.id === windowId ? { ...w, status: "done" } : w)),
                );
              }
            }
          );
        } else {
          // If no body, just add the entry as-is
          setEntries((prev) =>
            prev.map((entry) =>
              entry.id === fullResponse.id ? fullResponse : entry
            )
          );
          if (responseIndex === responses.length - 1) {
            setIsProcessing(false);
            requestAnimationFrame(() => textareaRef.current?.focus());
          }
        }
      });
    }, 520);
  };

  // Helper function to stream text word by word
  const streamText = (
    entryId: string,
    fullText: string,
    initialDelay: number,
    onUpdate: (text: string) => void,
    onComplete: () => void
  ) => {
    const words = fullText.split(/(\s+)/);
    let currentText = "";
    let wordIndex = 0;

    const streamNextWord = () => {
      if (wordIndex < words.length) {
        currentText += words[wordIndex];
        onUpdate(currentText);
        wordIndex++;
        // Random delay between 20-60ms per word to simulate streaming
        const delay = Math.random() * 40 + 20;
        setTimeout(streamNextWord, delay);
      } else {
        onComplete();
      }
    };

    setTimeout(streamNextWord, initialDelay);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitPrompt();
  };

  const handleNewChat = () => {
    setPromptWindows([]);
    setInputValue("");
    setRevealedCardId(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleExpand = () => {
    sky?.expand();
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    sky?.collapse();
    setIsExpanded(false);
    setRevealedCardId(null);
  };

  if (!isExpanded) {
    return (
      <div
        className={cn(
          "relative flex h-full w-full transition-opacity duration-300 ease-in-out overflow-hidden",
          isVisible ? "opacity-100" : "opacity-0",
        )}
        style={{ 
          WebkitAppRegion: "drag", 
          background: "transparent",
          borderRadius: 0,
        } as React.CSSProperties}
      >
        <div className="relative flex h-full w-full items-center gap-1 pl-2 pr-2 py-1 z-10 overflow-hidden" style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
          <Logo isExpanded={false} />
          <ChatInputBar
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            onExpand={handleExpand}
            isExpanded={false}
            inputRef={inputRef}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative flex h-full w-full flex-col text-white overflow-hidden" 
      style={{ 
        background: "transparent",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        transition: "all 400ms cubic-bezier(0.25, 0.1, 0.25, 1.0)",
      }}
    >
      <ExpandedBackground />
      {/* Floating prompt windows stack - always render on top when expanded */}
      <PromptWindowsStack
        windows={promptWindows}
        onClose={(id) => {
          setPromptWindows((prev) => prev.filter((w) => w.id !== id));
          if (revealedCardId === id) {
            setRevealedCardId(null);
          }
        }}
        onRevealCard={(id) => {
          setRevealedCardId(id);
        }}
        revealedCardId={revealedCardId}
        onBringToFront={(id) => {
          setPromptWindows((prev) =>
            prev.map((w) =>
              w.id === id ? { ...w, createdAt: Date.now() } : w
            )
          );
          // Clear revealed state when bringing to front
          setRevealedCardId(null);
        }}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSubmit={handleSubmit}
        isProcessing={isProcessing}
        onCollapse={handleCollapse}
        onNewChat={handleNewChat}
        inputRef={inputRef}
      />
      {/* Underlying expanded content removed per new flow to keep focus on stacked windows */}
    </div>
  );
}

