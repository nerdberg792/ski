import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { ChatInputBar } from "@/components/chat-input-bar";
import type { ChatEntry } from "@/types/chat";
import { initialEntries } from "@/data/presets";
import { cn } from "@/lib/utils";
import { ExpandedBackground } from "@/components/expanded-background";
import { PromptWindowsStack } from "@/components/prompt-windows-stack";
import type { PromptWindow } from "@/types/chat";
import { useGemini } from "@/hooks/useGemini";
import { getAction } from "@/lib/actions";
import type { PendingAction } from "@/types/actions";
import { TaskApprovalWindow } from "@/components/task-approval-window";

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
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [currentWindowId, setCurrentWindowId] = useState<string | null>(null);
  const currentWindowIdRef = useRef<string | null>(null); // Ref to track current window ID for callbacks
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const accumulatedTextRef = useRef<string>("");

  // Initialize Gemini
  const gemini = useGemini({
    onActionProposed: (action, parameters) => {
      // Use ref to get the latest currentWindowId value (avoids stale closure)
      const latestWindowId = currentWindowIdRef.current;
      console.log("✅ [App] Action proposal received:", {
        actionId: action.id,
        actionName: action.name,
        parameters,
        currentWindowId: latestWindowId,
        stateWindowId: currentWindowId,
      });
      
      if (action && latestWindowId) {
        const pendingAction = {
          id: `action-${Date.now()}`,
          action,
          parameters,
          promptWindowId: latestWindowId,
        };
        console.log("📝 [App] Creating pending action:", pendingAction);
        setPendingAction(pendingAction);
      } else {
        console.warn("⚠️ [App] Action proposal ignored - missing action or windowId:", {
          hasAction: !!action,
          currentWindowId: latestWindowId,
        });
        // If no windowId, create a standalone action (without prompt window)
        if (action) {
          const standaloneAction = {
            id: `action-${Date.now()}`,
            action,
            parameters,
            // No promptWindowId - this is a standalone action
          };
          console.log("📝 [App] Creating standalone pending action:", standaloneAction);
          setPendingAction(standaloneAction);
        }
      }
    },
  });

  // Initialize Gemini on mount
  useEffect(() => {
    const initGemini = async () => {
      try {
        const apiKey = await sky?.getApiKey?.();
        if (apiKey) {
          gemini.initialize(apiKey);
          console.log("Gemini initialized successfully");
        } else {
          console.warn("GEMINI_API_KEY not found in environment variables. Please create a .env file with GEMINI_API_KEY=your_key");
        }
      } catch (error) {
        console.error("Error initializing Gemini:", error);
      }
    };
    if (sky && !gemini.initialized) {
      initGemini();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sky]);

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

  const submitPrompt = async () => {
    if (!inputValue.trim()) return;
    
    // Check if Gemini is initialized, if not try to initialize it
    if (!gemini.initialized) {
      try {
        const apiKey = await sky?.getApiKey?.();
        if (apiKey) {
          gemini.initialize(apiKey);
        } else {
          console.error("Gemini not initialized. Please set GEMINI_API_KEY in your .env file");
          // Show error to user
          const errorEntry: ChatEntry = {
            id: `error-${Date.now()}`,
            kind: "response",
            heading: "Configuration Error",
            body: "Gemini API key not found. Please create a .env file in the project root with: GEMINI_API_KEY=your_api_key_here",
            sourceLabel: "Sky",
          };
          setEntries((prev) => [...prev, errorEntry]);
          return;
        }
      } catch (error) {
        console.error("Error initializing Gemini:", error);
        return;
      }
    }

    const prompt = inputValue.trim();
    const promptEntry: ChatEntry = {
      id: `prompt-${Date.now()}`,
      kind: "prompt",
      heading: prompt,
      subheading: "Processing with Gemini…",
      highlight: true,
      sourceLabel: "Sky",
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
    accumulatedTextRef.current = "";

    // Create a new floating prompt window that will stream the response
    const windowId = `win-${Date.now()}`;
    const createdAt = Date.now();
    setCurrentWindowId(windowId);
    currentWindowIdRef.current = windowId; // Update ref immediately for callbacks

    // Create empty response entry
    const responseEntry: ChatEntry = {
      id: `${windowId}-resp`,
      kind: "response",
      heading: "",
      body: "",
      sourceLabel: "Sky",
    };

    // Initialize window with prompt + empty response
    setPromptWindows((prev) => [
      {
        id: windowId,
        prompt,
        entries: [
          { ...promptEntry, id: `${windowId}-prompt` },
          responseEntry,
        ],
        status: "streaming",
        createdAt,
      },
      ...prev,
    ]);

    // Add empty response entry
    setEntries((prev) => [...prev, responseEntry]);

    // Stream Gemini response
    try {
      await gemini.streamResponse(prompt, {
        onChunk: (chunk: import("@/lib/gemini").GeminiStreamChunk) => {
          if (chunk.proposedAction) {
            // Action proposed - will be handled by onActionProposed callback
            return;
          }
          
          if (chunk.text) {
            accumulatedTextRef.current += chunk.text;
            
            // Update entries
            setEntries((prev) =>
              prev.map((entry) =>
                entry.id === `${windowId}-resp`
                  ? { ...entry, body: accumulatedTextRef.current }
                  : entry
              )
            );
            
            // Update window
            setPromptWindows((prev) =>
              prev.map((w) =>
                w.id !== windowId
                  ? w
                  : {
                      ...w,
                      entries: w.entries.map((e) =>
                        e.id === `${windowId}-resp`
                          ? { ...e, body: accumulatedTextRef.current }
                          : e
                      ),
                    },
              ),
            );
          }
          
          if (chunk.isComplete) {
            setIsProcessing(false);
            setPromptWindows((prev) =>
              prev.map((w) => (w.id === windowId ? { ...w, status: "done" } : w)),
            );
            setCurrentWindowId(null);
            currentWindowIdRef.current = null; // Clear ref
            requestAnimationFrame(() => textareaRef.current?.focus());
          }
        },
        onComplete: () => {
          setIsProcessing(false);
          setCurrentWindowId(null);
          currentWindowIdRef.current = null; // Clear ref
          requestAnimationFrame(() => textareaRef.current?.focus());
        },
        onError: (error: Error) => {
          console.error("Gemini error:", error);
          setIsProcessing(false);
          setCurrentWindowId(null);
          currentWindowIdRef.current = null; // Clear ref
          
          // Add error entry
          const errorEntry: ChatEntry = {
            id: `${windowId}-error`,
            kind: "response",
            heading: "Error",
            body: `Failed to get response: ${error.message}`,
            sourceLabel: "Sky",
          };
          
          setEntries((prev) => [...prev, errorEntry]);
          setPromptWindows((prev) =>
            prev.map((w) => (w.id === windowId ? { ...w, status: "done" } : w)),
          );
        },
      });
    } catch (error) {
      console.error("Error streaming response:", error);
      setIsProcessing(false);
      setCurrentWindowId(null);
      currentWindowIdRef.current = null; // Clear ref
    }
  };

  // Handle action approval
  const handleActionApprove = async () => {
    if (!pendingAction) {
      console.warn("⚠️ [App] handleActionApprove called but no pending action");
      return;
    }

    console.log("🚀 [App] User approved action:", {
      actionId: pendingAction.action.id,
      actionName: pendingAction.action.name,
      parameters: pendingAction.parameters,
    });

    const action = getAction(pendingAction.action.id);
    if (!action) {
      console.error("❌ [App] Action not found in registry:", pendingAction.action.id);
      setPendingAction(null);
      return;
    }

    try {
      console.log("📤 [App] Executing AppleScript:", {
        scriptPath: action.scriptPath,
        parameters: pendingAction.parameters,
      });

      const result = await sky?.executeAction?.(
        {
          actionId: pendingAction.action.id,
          parameters: pendingAction.parameters,
        },
        action.scriptPath,
      );

      if (result?.success) {
        console.log("✅ [App] Action executed successfully:", {
          output: result.output,
          actionId: pendingAction.action.id,
        });
      } else {
        console.error("❌ [App] Action execution failed:", {
          error: result?.error,
          actionId: pendingAction.action.id,
        });
      }
    } catch (error) {
      console.error("❌ [App] Error executing action:", {
        error,
        actionId: pendingAction.action.id,
      });
    }

    setPendingAction(null);
  };

  const handleActionCancel = () => {
    setPendingAction(null);
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
          <div 
            onClick={() => {
              // Toggle input: if visible, blur it; if hidden, focus it
              if (isInputVisible) {
                inputRef.current?.blur();
              } else {
                requestAnimationFrame(() => inputRef.current?.focus());
              }
            }}
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            className="cursor-pointer"
          >
            <Logo isExpanded={false} />
          </div>
          <ChatInputBar
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            onExpand={handleExpand}
            isExpanded={false}
            inputRef={inputRef}
            onInputVisibilityChange={setIsInputVisible}
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
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
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
        pendingAction={pendingAction}
        onActionApprove={handleActionApprove}
        onActionCancel={handleActionCancel}
      />
      {/* Underlying expanded content removed per new flow to keep focus on stacked windows */}
    </div>
  );
}

