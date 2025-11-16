import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { ChatInputBar } from "@/components/chat-input-bar";
import type { ChatEntry } from "@/types/chat";
import { cn } from "@/lib/utils";
import { ExpandedBackground } from "@/components/expanded-background";
import { PromptWindowsStack } from "@/components/prompt-windows-stack";
import type { PromptWindow } from "@/types/chat";
import { useGemini } from "@/hooks/useGemini";
import { applyActionDefaults, getAction } from "@/lib/actions";
import type { PendingAction } from "@/types/actions";
import { SpotifyControlCard } from "@/components/spotify-control-card";
import { useSpotify } from "@/hooks/useSpotify";
import { IntegrationCardWrapper } from "@/components/integration-card-wrapper";
import { useAppleNotes } from "@/hooks/useAppleNotes";
import { useAppleMaps } from "@/hooks/useAppleMaps";
import { useAppleReminders } from "@/hooks/useAppleReminders";
import { useAppleStocks } from "@/hooks/useAppleStocks";
import { useFinder } from "@/hooks/useFinder";
import { useBrowserBookmarks } from "@/hooks/useBrowserBookmarks";
import { useBrowserHistory } from "@/hooks/useBrowserHistory";
import { useBrowserTabs } from "@/hooks/useBrowserTabs";
import { useBrowserProfiles } from "@/hooks/useBrowserProfiles";

function useSkyBridge() {
  return useMemo(() => window.sky, []);
}

// Wrapper component for Spotify card that only shows when user asks about Spotify
interface SpotifyCardWrapperProps {
  show: boolean;
}

function SpotifyCardWrapper({ show }: SpotifyCardWrapperProps) {
  const { status, isConfigured } = useSpotify();
  // Only show if: user asked about Spotify AND Spotify is configured
  const shouldShow = show && isConfigured && (status.connected || !!status.account);
  
  return (
    <IntegrationCardWrapper 
      position="bottom-right" 
      zIndex={30}
      show={shouldShow}
    >
      <SpotifyControlCard />
    </IntegrationCardWrapper>
  );
}

export default function App() {
  const sky = useSkyBridge();
  const appleNotes = useAppleNotes();
  const appleMaps = useAppleMaps();
  const appleReminders = useAppleReminders();
  const appleStocks = useAppleStocks();
  const finder = useFinder();
  const browserBookmarks = useBrowserBookmarks();
  const browserHistory = useBrowserHistory();
  const browserTabs = useBrowserTabs();
  const browserProfiles = useBrowserProfiles();
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [promptWindows, setPromptWindows] = useState<PromptWindow[]>([]);
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [currentWindowId, setCurrentWindowId] = useState<string | null>(null);
  const currentWindowIdRef = useRef<string | null>(null); // Ref to track current window ID for callbacks
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const accumulatedTextRef = useRef<string>("");
  const [showSpotifyCard, setShowSpotifyCard] = useState(false);
  const spotifyCardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-hide Spotify card after 2 minutes of inactivity
  useEffect(() => {
    if (showSpotifyCard) {
      // Clear existing timeout
      if (spotifyCardTimeoutRef.current) {
        clearTimeout(spotifyCardTimeoutRef.current);
      }
      // Set new timeout to hide after 2 minutes
      spotifyCardTimeoutRef.current = setTimeout(() => {
        setShowSpotifyCard(false);
      }, 2 * 60 * 1000); // 2 minutes
    }
    
    return () => {
      if (spotifyCardTimeoutRef.current) {
        clearTimeout(spotifyCardTimeoutRef.current);
      }
    };
  }, [showSpotifyCard]);
  
  const pushSystemEntry = (entry: ChatEntry) => {
    setPromptWindows((prev) => [
      {
        id: entry.id,
        prompt: entry.heading || "Sky",
        entries: [entry],
        status: "done",
        createdAt: Date.now(),
      },
      ...prev,
    ]);
  };

  // Helper function to add action result to a specific window
  const addActionResultWithWindowId = (targetWindowId: string | null, resultText: string, isError: boolean = false) => {
    const windowId = targetWindowId || currentWindowIdRef.current;
    console.log("🔄 [App] addActionResultWithWindowId called:", { 
      windowId, 
      targetWindowId,
      resultTextLength: resultText.length, 
      isError,
      hasWindowId: !!windowId 
    });
    
    if (!windowId) {
      console.error("❌ [App] No windowId in addActionResultWithWindowId, trying to find most recent window");
      // Try to use the most recent window
      setPromptWindows((prev) => {
        if (prev.length > 0) {
          const mostRecentWindow = prev[0];
          console.log("🔄 [App] Using most recent window:", mostRecentWindow.id);
          const resultEntry: ChatEntry = {
            id: `${mostRecentWindow.id}-action-result-${Date.now()}`,
            kind: "response",
            heading: "",
            body: resultText,
            sourceLabel: isError ? "Error" : "Sky",
          };
          return prev.map((w) =>
            w.id === mostRecentWindow.id
              ? {
                  ...w,
                  entries: [...w.entries, resultEntry],
                }
              : w
          );
        }
        return prev;
      });
      return;
    }

    const resultEntry: ChatEntry = {
      id: `${windowId}-action-result-${Date.now()}`,
      kind: "response",
      heading: "",
      body: resultText,
      sourceLabel: isError ? "Error" : "Sky",
    };

    console.log("🔄 [App] Adding result entry to window:", windowId);
    setPromptWindows((prev) => {
      const windowExists = prev.some(w => w.id === windowId);
      console.log("🔄 [App] Window exists in promptWindows:", windowExists, "Total windows:", prev.length);
      const updated = prev.map((w) =>
        w.id === windowId
          ? {
              ...w,
              entries: [...w.entries, resultEntry],
            }
          : w
      );
      console.log("🔄 [App] Updated prompt windows, checking if window exists:", updated.some(w => w.id === windowId));
      return updated;
    });
  };

  // Helper function to add action result to current prompt window (uses ref)
  const addActionResult = (resultText: string, isError: boolean = false) => {
    addActionResultWithWindowId(null, resultText, isError);
  };

  // Helper function to send action result back to Gemini for response
  const sendActionResultToGemini = async (actionName: string, resultText: string, windowId: string | null, isError: boolean = false) => {
    console.log("🔄 [App] sendActionResultToGemini called:", { actionName, resultText: resultText.substring(0, 100), windowId, isError });
    if (!windowId) {
      console.error("❌ [App] No windowId provided, cannot send result to Gemini");
      // Try to find the most recent window as fallback
      const mostRecentWindow = promptWindows[0];
      if (mostRecentWindow) {
        console.log("🔄 [App] Using most recent window as fallback:", mostRecentWindow.id);
        return await sendActionResultToGemini(actionName, resultText, mostRecentWindow.id, isError);
      }
      return;
    }

    // Get the original prompt from the window for context
    // We'll read it from state - the window should exist since action was just executed
    const currentWindow = promptWindows.find((w) => w.id === windowId);
    const originalPrompt = currentWindow?.prompt || "";
    console.log("🔄 [App] Original prompt:", originalPrompt);
    console.log("🔄 [App] Current window found:", !!currentWindow);

    // Add action result to chat
    console.log("🔄 [App] Adding action result to chat");
    addActionResult(resultText, isError);

    // Create a prompt for Gemini with the action result and original context
    const followUpPrompt = `The user asked: "${originalPrompt}". I executed the action "${actionName}" and got the following result: ${resultText}. Please provide a helpful, natural response to the user about this result in a conversational way.`;
    console.log("🔄 [App] Follow-up prompt created:", followUpPrompt.substring(0, 200));

    // Set up streaming response for Gemini
    console.log("🔄 [App] Setting isProcessing to true");
    setIsProcessing(true);
    accumulatedTextRef.current = "";

    // Create response entry
    const responseEntry: ChatEntry = {
      id: `${windowId}-action-response-${Date.now()}`,
      kind: "response",
      heading: "",
      body: "",
      sourceLabel: "Sky",
    };

    // Add empty response entry
    setPromptWindows((prev) =>
      prev.map((w) =>
        w.id === windowId
          ? {
              ...w,
              entries: [...w.entries, responseEntry],
            }
          : w
      )
    );

    try {
      console.log("🔄 [App] Calling gemini.streamResponse");
      await gemini.streamResponse(followUpPrompt, {
        onChunk: (chunk: import("@/lib/gemini").GeminiStreamChunk) => {
          console.log("🔄 [App] Gemini chunk received:", { 
            hasText: !!chunk.text, 
            textLength: chunk.text?.length || 0,
            hasProposedAction: !!chunk.proposedAction,
            isComplete: chunk.isComplete 
          });
          
          if (chunk.proposedAction) {
            // Action proposed - ignore for follow-up responses
            console.log("🔄 [App] Ignoring proposed action in follow-up");
            return;
          }

          if (chunk.text) {
            accumulatedTextRef.current += chunk.text;
            console.log("🔄 [App] Accumulated text length:", accumulatedTextRef.current.length);

            // Update window with streaming text
            setPromptWindows((prev) =>
              prev.map((w) =>
                w.id !== windowId
                  ? w
                  : {
                      ...w,
                      entries: w.entries.map((e) =>
                        e.id === responseEntry.id
                          ? { ...e, body: accumulatedTextRef.current }
                          : e
                      ),
                    },
              ),
            );
          }

          if (chunk.isComplete) {
            console.log("🔄 [App] Chunk is complete, finalizing");
            setIsProcessing(false);
            setPromptWindows((prev) =>
              prev.map((w) => (w.id === windowId ? { ...w, status: "done" } : w)),
            );
            requestAnimationFrame(() => textareaRef.current?.focus());
          }
        },
        onComplete: () => {
          console.log("🔄 [App] Gemini stream complete");
          setIsProcessing(false);
          requestAnimationFrame(() => textareaRef.current?.focus());
        },
        onError: (error: Error) => {
          console.error("❌ [App] Gemini error in action follow-up:", error);
          setIsProcessing(false);
          setPromptWindows((prev) =>
            prev.map((w) =>
              w.id === windowId
                ? {
                    ...w,
                    entries: [
                      ...w.entries,
                      {
                        id: `${windowId}-error-${Date.now()}`,
                        kind: "response",
                        heading: "",
                        body: `Error getting response: ${error.message}`,
                        sourceLabel: "Error",
                      },
                    ],
                  }
                : w
            ),
          );
        },
      });
      console.log("🔄 [App] gemini.streamResponse completed");
    } catch (error) {
      console.error("❌ [App] Error sending action result to Gemini:", error);
      setIsProcessing(false);
    }
  };

  // Initialize Gemini
  const gemini = useGemini({
    onActionProposed: (action, parameters) => {
      if (!action) {
        return;
      }
      // Show Spotify card only if a Spotify action is proposed
      if (action.category === "spotify") {
        setShowSpotifyCard(true);
      } else {
        // Hide card for non-Spotify actions
        setShowSpotifyCard(false);
        if (spotifyCardTimeoutRef.current) {
          clearTimeout(spotifyCardTimeoutRef.current);
          spotifyCardTimeoutRef.current = null;
        }
      }
      const latestWindowId = currentWindowIdRef.current;
      const normalizedParameters = applyActionDefaults(action, parameters);
      if (latestWindowId) {
        setPendingAction({
          id: `action-${Date.now()}`,
          action,
          parameters: normalizedParameters,
          promptWindowId: latestWindowId,
        });
      } else {
        setPendingAction({
          id: `action-${Date.now()}`,
          action,
          parameters: normalizedParameters,
        });
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
        } else {
          const errorEntry: ChatEntry = {
            id: `error-${Date.now()}`,
            kind: "response",
            heading: "Configuration Error",
            body: "Gemini API key not found. Please create a .env file in the project root with: GEMINI_API_KEY=your_api_key_here",
            sourceLabel: "Sky",
          };
          pushSystemEntry(errorEntry);
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

  const submitPrompt = async () => {
    if (!inputValue.trim()) return;
    
    // Check if Gemini is initialized, if not try to initialize it
    if (!gemini.initialized) {
      try {
        const apiKey = await sky?.getApiKey?.();
        if (apiKey) {
          gemini.initialize(apiKey);
        } else {
          const errorEntry: ChatEntry = {
            id: `error-${Date.now()}`,
            kind: "response",
            heading: "Configuration Error",
            body: "Gemini API key not found. Please create a .env file in the project root with: GEMINI_API_KEY=your_api_key_here",
            sourceLabel: "Sky",
          };
          pushSystemEntry(errorEntry);
          return;
        }
      } catch (error) {
        console.error("Error initializing Gemini:", error);
        return;
      }
    }

    const prompt = inputValue.trim();
    
    // Check if the prompt explicitly mentions Spotify or music control
    // Use more specific patterns to avoid false positives
    const promptLower = prompt.toLowerCase();
    const spotifyPatterns = [
      /\bspotify\b/i,
      /play (song|music|track|album|playlist)/i,
      /pause (song|music|track)/i,
      /(next|previous|skip) (song|track)/i,
      /(set|change|adjust) (spotify|music) volume/i,
      /(shuffle|repeat) (on|off|toggle)/i,
      /(search|find) (song|music|track|album|artist|playlist) (on|in) spotify/i,
      /spotify (play|pause|next|previous|volume|shuffle|search)/i,
    ];
    
    const isSpotifyRelated = spotifyPatterns.some(pattern => pattern.test(prompt));
    
    // Only show card if explicitly asking about Spotify
    // Hide it for all other queries
    if (isSpotifyRelated) {
      setShowSpotifyCard(true);
    } else {
      // Immediately hide card for non-Spotify queries
      setShowSpotifyCard(false);
      // Clear any pending timeout
      if (spotifyCardTimeoutRef.current) {
        clearTimeout(spotifyCardTimeoutRef.current);
        spotifyCardTimeoutRef.current = null;
      }
    }
    
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
      sky?.expand();
      setIsExpanded(true);
    }
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
          
          setPromptWindows((prev) =>
            prev.map((w) =>
              w.id === windowId
                ? {
                    ...w,
                    status: "done",
                    entries: [...w.entries, errorEntry],
                  }
                : w,
            ),
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
      return;
    }

    const { action: pendingActionData, parameters, promptWindowId } = pendingAction;
    const windowId = promptWindowId || currentWindowIdRef.current;
    console.log("🔄 [App] handleActionApprove - windowId:", windowId, "promptWindowId:", promptWindowId);

    const action = getAction(pendingActionData.id);
    if (!action) {
      console.error("❌ [App] Action not found in registry:", pendingActionData.id);
      setPendingAction(null);
      return;
    }

    try {
      const params = applyActionDefaults(action, parameters);
      let result: { success: boolean; error?: string } = { success: true };

      // Handle Spotify actions differently - they call the Spotify API
      if (action.category === "spotify") {
        // Show Spotify card when executing Spotify actions
        setShowSpotifyCard(true);

        switch (action.id) {
          case "spotify-play":
            await sky?.spotify?.sendCommand?.({ type: "play" });
            break;
          case "spotify-pause":
            await sky?.spotify?.sendCommand?.({ type: "pause" });
            break;
          case "spotify-toggle-play":
            await sky?.spotify?.sendCommand?.({ type: "toggle-play" });
            break;
          case "spotify-next":
            await sky?.spotify?.sendCommand?.({ type: "next" });
            break;
          case "spotify-previous":
            await sky?.spotify?.sendCommand?.({ type: "previous" });
            break;
          case "spotify-set-volume":
            if (typeof params.level === "number") {
              await sky?.spotify?.sendCommand?.({ type: "set-volume", value: params.level });
            } else {
              result = { success: false, error: "Volume level must be a number" };
            }
            break;
          case "spotify-search":
            // Spotify search requires UI integration to display results
            // The search can be performed via the Spotify API, but results need to be displayed in the UI
            console.log("Spotify search requested:", params.query, params.category);
            result = { success: false, error: "Spotify search requires UI integration. Use the Spotify control card." };
            break;
          case "spotify-play-track":
            if (typeof params.uri === "string") {
              // Determine if it's a track or context (album/playlist)
              const uriType = params.uri.split(":")[1];
              await sky?.spotify?.playUri?.({
                type: uriType === "track" ? "track" : "context",
                uri: params.uri,
              });
            } else {
              result = { success: false, error: "URI must be a string" };
            }
            break;
          default:
            result = { success: false, error: `Unknown Spotify action: ${action.id}` };
        }

        if (!result.success) {
          console.error("❌ [App] Spotify action failed:", {
            error: result.error,
            actionId: pendingAction.action.id,
          });
        }
      } else if (action.category === "apple-notes") {
        // Handle Apple Notes actions
        if (!appleNotes.isAvailable) {
          result = { success: false, error: "Apple Notes integration is not available" };
        } else {
          switch (action.id) {
            case "apple-notes-search":
              if (typeof params.query === "string") {
                const searchResult = await appleNotes.search(params.query);
                if (!searchResult.success) {
                  result = { success: false, error: searchResult.error };
                  addActionResult(`Failed to search notes: ${searchResult.error}`, true);
                } else {
                  const noteCount = searchResult.notes.length;
                  console.log("✅ [App] Apple Notes search completed:", noteCount, "notes found");
                  if (noteCount > 0) {
                    const noteList = searchResult.notes.slice(0, 10).map((n, i) => `${i + 1}. ${n.title}`).join("\n");
                    const moreText = noteCount > 10 ? `\n\n... and ${noteCount - 10} more note${noteCount - 10 > 1 ? "s" : ""}` : "";
                    const resultText = `Found ${noteCount} note${noteCount > 1 ? "s" : ""} matching "${params.query}":\n\n${noteList}${moreText}`;
                    await sendActionResultToGemini(action.name, resultText, windowId);
                  } else {
                    const resultText = `No notes found matching "${params.query}".`;
                    await sendActionResultToGemini(action.name, resultText, windowId);
                  }
                }
              } else {
                result = { success: false, error: "Query must be a string" };
                addActionResult("Error: Query must be a string", true);
              }
              break;
            case "apple-notes-create":
              const createResult = await appleNotes.create({
                content: typeof params.content === "string" ? params.content : undefined,
                text: typeof params.text === "string" ? params.text : undefined,
              });
              if (!createResult.success) {
                result = { success: false, error: createResult.error };
                addActionResult(`Failed to create note: ${createResult.error}`, true);
              } else {
                console.log("✅ [App] Apple Note created:", createResult.noteId);
                const resultText = `Note created successfully${createResult.noteId ? ` (ID: ${createResult.noteId})` : ""}.`;
                await sendActionResultToGemini(action.name, resultText, windowId);
              }
              break;
            case "apple-notes-get-content":
              if (typeof params.noteId === "string") {
                const contentResult = await appleNotes.getContent(params.noteId);
                if (!contentResult.success) {
                  result = { success: false, error: contentResult.error };
                  addActionResult(`Failed to get note content: ${contentResult.error}`, true);
                } else {
                  console.log("✅ [App] Apple Note content retrieved");
                  const contentPreview = contentResult.content ? contentResult.content.substring(0, 200) + (contentResult.content.length > 200 ? "..." : "") : "No content";
                  const resultText = `Note content:\n\n${contentPreview}`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                result = { success: false, error: "Note ID must be a string" };
                addActionResult("Error: Note ID must be a string", true);
              }
              break;
            case "apple-notes-update":
              if (typeof params.noteId === "string" && typeof params.content === "string") {
                const updateResult = await appleNotes.update({
                  noteId: params.noteId,
                  content: params.content,
                });
                if (!updateResult.success) {
                  result = { success: false, error: updateResult.error };
                  addActionResult(`Failed to update note: ${updateResult.error}`, true);
                } else {
                  console.log("✅ [App] Apple Note updated");
                  const resultText = `Note updated successfully.`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                result = { success: false, error: "Note ID and content must be strings" };
                addActionResult("Error: Note ID and content must be strings", true);
              }
              break;
            default:
              result = { success: false, error: `Unknown Apple Notes action: ${action.id}` };
          }
        }

        if (!result.success) {
          console.error("❌ [App] Apple Notes action failed:", {
            error: result.error,
            actionId: pendingAction.action.id,
          });
        }
      } else if (action.category === "apple-maps") {
        // Handle Apple Maps actions
        if (!appleMaps.isAvailable) {
          result = { success: false, error: "Apple Maps integration is not available" };
        } else {
          switch (action.id) {
            case "apple-maps-search":
              if (typeof params.query === "string") {
                const searchResult = await appleMaps.search(params.query);
                if (!searchResult.success) {
                  result = { success: false, error: searchResult.error };
                  addActionResult(`Failed to search maps: ${searchResult.error}`, true);
                } else {
                  console.log("✅ [App] Apple Maps search completed");
                  const resultText = `Opened Apple Maps search for "${params.query}".`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                result = { success: false, error: "Query must be a string" };
                addActionResult("Error: Query must be a string", true);
              }
              break;
            case "apple-maps-directions":
              if (typeof params.destination === "string") {
                const directionsResult = await appleMaps.directions({
                  destination: params.destination,
                  origin: typeof params.origin === "string" ? params.origin : undefined,
                  mode: typeof params.mode === "string" ? params.mode : undefined,
                });
                if (!directionsResult.success) {
                  result = { success: false, error: directionsResult.error };
                  addActionResult(`Failed to get directions: ${directionsResult.error}`, true);
                } else {
                  console.log("✅ [App] Apple Maps directions opened");
                  const originText = params.origin ? ` from ${params.origin}` : "";
                  const resultText = `Opened directions${originText} to ${params.destination} in Apple Maps.`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                result = { success: false, error: "Destination must be a string" };
                addActionResult("Error: Destination must be a string", true);
              }
              break;
            case "apple-maps-directions-home":
              if (typeof params.homeAddress === "string") {
                const homeResult = await appleMaps.directionsHome({
                  homeAddress: params.homeAddress,
                  mode: typeof params.mode === "string" ? params.mode : undefined,
                });
                if (!homeResult.success) {
                  result = { success: false, error: homeResult.error };
                  addActionResult(`Failed to get directions home: ${homeResult.error}`, true);
                } else {
                  console.log("✅ [App] Apple Maps directions home opened");
                  const resultText = `Opened directions to home (${params.homeAddress}) in Apple Maps.`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                result = { success: false, error: "Home address must be a string" };
                addActionResult("Error: Home address must be a string", true);
              }
              break;
            default:
              result = { success: false, error: `Unknown Apple Maps action: ${action.id}` };
          }
        }

        if (!result.success) {
          console.error("❌ [App] Apple Maps action failed:", {
            error: result.error,
            actionId: pendingAction.action.id,
          });
        }
      } else if (action.category === "apple-reminders") {
        // Handle Apple Reminders actions
        console.log("📋 [App] Handling Apple Reminders action:", action.id, params);
        
        if (!appleReminders.isAvailable) {
          console.error("❌ [App] Apple Reminders integration is not available");
          result = { success: false, error: "Apple Reminders integration is not available" };
        } else {
          switch (action.id) {
            case "apple-reminders-create":
              console.log("📝 [App] Creating reminder with params:", params);
              if (typeof params.title === "string") {
                const createPayload = {
                  title: params.title,
                  listName: typeof params.listName === "string" ? params.listName : undefined,
                  dueDate: typeof params.dueDate === "string" ? params.dueDate : undefined,
                  priority: typeof params.priority === "string" ? params.priority : undefined,
                  notes: typeof params.notes === "string" ? params.notes : undefined,
                };
                console.log("📝 [App] Calling appleReminders.create with payload:", createPayload);
                
                const createResult = await appleReminders.create(createPayload);
                
                console.log("📝 [App] Create result:", createResult);
                
                if (!createResult.success) {
                  result = { success: false, error: createResult.error };
                  console.error("❌ [App] Failed to create reminder:", createResult.error);
                  addActionResult(`Failed to create reminder: ${createResult.error}`, true);
                } else {
                  console.log("✅ [App] Apple Reminder created:", createResult.reminderId);
                  const resultText = `Reminder "${params.title}" created successfully${createResult.reminderId ? ` (ID: ${createResult.reminderId})` : ""}.`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                console.error("❌ [App] Title is not a string:", typeof params.title, params.title);
                result = { success: false, error: "Title must be a string" };
              }
              break;
            case "apple-reminders-list":
              const listResult = await appleReminders.list({
                listName: typeof params.listName === "string" ? params.listName : undefined,
                completed: typeof params.completed === "boolean" ? params.completed : undefined,
              });
              if (!listResult.success) {
                result = { success: false, error: listResult.error };
                addActionResult(`Failed to list reminders: ${listResult.error}`, true);
              } else {
                const reminderCount = listResult.reminders?.length || 0;
                console.log("✅ [App] Apple Reminders listed:", reminderCount, "reminders");
                if (reminderCount > 0) {
                  const reminderList = listResult.reminders!.slice(0, 10).map((r, i) => `${i + 1}. ${r.name || "Untitled"}${r.dueDate ? ` (due: ${r.dueDate})` : ""}`).join("\n");
                  const moreText = reminderCount > 10 ? `\n\n... and ${reminderCount - 10} more reminder${reminderCount - 10 > 1 ? "s" : ""}` : "";
                  const resultText = `Found ${reminderCount} reminder${reminderCount > 1 ? "s" : ""}:\n\n${reminderList}${moreText}`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                } else {
                  const resultText = `No reminders found.`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              }
              break;
            case "apple-reminders-complete":
              if (typeof params.reminderId === "string") {
                const completeResult = await appleReminders.complete(params.reminderId);
                if (!completeResult.success) {
                  result = { success: false, error: completeResult.error };
                  addActionResult(`Failed to complete reminder: ${completeResult.error}`, true);
                } else {
                  console.log("✅ [App] Apple Reminder completed");
                  const resultText = `Reminder marked as completed.`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                result = { success: false, error: "Reminder ID must be a string" };
                addActionResult("Error: Reminder ID must be a string", true);
              }
              break;
            default:
              result = { success: false, error: `Unknown Apple Reminders action: ${action.id}` };
          }
        }

        if (!result.success) {
          console.error("❌ [App] Apple Reminders action failed:", {
            error: result.error,
            actionId: pendingAction.action.id,
          });
        }
      } else if (action.category === "apple-stocks") {
        // Handle Apple Stocks actions
        if (!appleStocks.isAvailable) {
          result = { success: false, error: "Apple Stocks integration is not available" };
        } else {
          switch (action.id) {
            case "apple-stocks-search":
              if (typeof params.ticker === "string") {
                const searchResult = await appleStocks.search(params.ticker);
                if (!searchResult.success) {
                  result = { success: false, error: searchResult.error };
                  addActionResult(`Failed to search stocks: ${searchResult.error}`, true);
                } else {
                  console.log("✅ [App] Apple Stocks opened for ticker:", params.ticker);
                  const resultText = `Opened Apple Stocks for ticker ${params.ticker.toUpperCase()}.`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                result = { success: false, error: "Ticker must be a string" };
                addActionResult("Error: Ticker must be a string", true);
              }
              break;
            default:
              result = { success: false, error: `Unknown Apple Stocks action: ${action.id}` };
          }
        }

        if (!result.success) {
          console.error("❌ [App] Apple Stocks action failed:", {
            error: result.error,
            actionId: pendingAction.action.id,
          });
        }
      } else if (action.category === "finder") {
        // Handle Finder actions
        console.log("📁 [App] Handling Finder action:", action.id, params);
        
        if (!finder.isAvailable) {
          console.error("❌ [App] Finder integration is not available");
          result = { success: false, error: "Finder integration is not available" };
        } else {
          switch (action.id) {
            case "finder-create-file":
              if (typeof params.filename === "string") {
                const createResult = await finder.createFile({
                  filename: params.filename,
                  autoOpen: typeof params.autoOpen === "boolean" ? params.autoOpen : undefined,
                });
                if (!createResult.success) {
                  result = { success: false, error: createResult.error };
                  console.error("❌ [App] Failed to create file:", createResult.error);
                  addActionResult(`Failed to create file: ${createResult.error}`, true);
                } else {
                  console.log("✅ [App] File created:", createResult.filePath);
                  const resultText = `File created successfully: ${createResult.filePath}`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                result = { success: false, error: "Filename must be a string" };
              }
              break;
            case "finder-open-file":
              if (typeof params.path === "string") {
                const openResult = await finder.openFile({
                  path: params.path,
                  application: typeof params.application === "string" ? params.application : undefined,
                });
                if (!openResult.success) {
                  result = { success: false, error: openResult.error };
                  console.error("❌ [App] Failed to open file:", openResult.error);
                  addActionResult(`Failed to open file: ${openResult.error}`, true);
                } else {
                  console.log("✅ [App] File opened successfully");
                  const appText = params.application ? ` with ${params.application}` : "";
                  const resultText = `File opened successfully${appText}: ${params.path}`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                result = { success: false, error: "Path must be a string" };
              }
              break;
            case "finder-move-to-folder":
              if (typeof params.destination === "string") {
                let filePaths: string[] = [];
                
                // Get file paths from parameter or selected files
                if (typeof params.filePaths === "string") {
                  filePaths = params.filePaths.split(",").map(p => p.trim()).filter(p => p.length > 0);
                } else {
                  // Try to get selected files from Finder
                  const selectedResult = await finder.getSelectedFiles();
                  if (selectedResult.success && selectedResult.files) {
                    filePaths = selectedResult.files;
                  } else {
                    result = { success: false, error: selectedResult.error || "No files selected in Finder" };
                    break;
                  }
                }

                if (filePaths.length === 0) {
                  result = { success: false, error: "No files to move" };
                } else {
                  const moveResult = await finder.moveToFolder({
                    destination: params.destination,
                    filePaths,
                  });
                  if (!moveResult.success) {
                    result = { success: false, error: moveResult.error };
                    console.error("❌ [App] Failed to move files:", moveResult.error);
                    addActionResult(`Failed to move files: ${moveResult.error}`, true);
                  } else {
                    const movedCount = moveResult.movedCount || 0;
                    console.log(`✅ [App] Moved ${movedCount} file(s) to folder`);
                    const resultText = `Moved ${movedCount} file${movedCount > 1 ? "s" : ""} to ${params.destination}.`;
                    await sendActionResultToGemini(action.name, resultText, windowId);
                  }
                }
              } else {
                result = { success: false, error: "Destination must be a string" };
              }
              break;
            case "finder-copy-to-folder":
              if (typeof params.destination === "string") {
                let filePaths: string[] = [];
                
                // Get file paths from parameter or selected files
                if (typeof params.filePaths === "string") {
                  filePaths = params.filePaths.split(",").map(p => p.trim()).filter(p => p.length > 0);
                } else {
                  // Try to get selected files from Finder
                  const selectedResult = await finder.getSelectedFiles();
                  if (selectedResult.success && selectedResult.files) {
                    filePaths = selectedResult.files;
                  } else {
                    result = { success: false, error: selectedResult.error || "No files selected in Finder" };
                    break;
                  }
                }

                if (filePaths.length === 0) {
                  result = { success: false, error: "No files to copy" };
                } else {
                  const copyResult = await finder.copyToFolder({
                    destination: params.destination,
                    filePaths,
                  });
                  if (!copyResult.success) {
                    result = { success: false, error: copyResult.error };
                    console.error("❌ [App] Failed to copy files:", copyResult.error);
                    addActionResult(`Failed to copy files: ${copyResult.error}`, true);
                  } else {
                    const copiedCount = copyResult.copiedCount || 0;
                    console.log(`✅ [App] Copied ${copiedCount} file(s) to folder`);
                    const resultText = `Copied ${copiedCount} file${copiedCount > 1 ? "s" : ""} to ${params.destination}.`;
                    await sendActionResultToGemini(action.name, resultText, windowId);
                  }
                }
              } else {
                result = { success: false, error: "Destination must be a string" };
              }
              break;
            default:
              result = { success: false, error: `Unknown Finder action: ${action.id}` };
          }
        }

        if (!result.success) {
          console.error("❌ [App] Finder action failed:", {
            error: result.error,
            actionId: pendingAction.action.id,
          });
        }
      } else if (action.category === "browser-bookmarks") {
        // Handle Browser Bookmarks actions
        console.log("🔖 [App] Handling Browser Bookmarks action:", action.id, params);
        
        if (!browserBookmarks.isAvailable) {
          console.error("❌ [App] Browser Bookmarks integration is not available");
          result = { success: false, error: "Browser Bookmarks integration is not available" };
        } else {
          switch (action.id) {
            case "browser-bookmarks-search":
              if (typeof params.query === "string") {
                const searchResult = await browserBookmarks.search(
                  params.query,
                  typeof params.browser === "string" ? params.browser : undefined,
                );
                if (!searchResult.success) {
                  result = { success: false, error: searchResult.error };
                  console.error("❌ [App] Failed to search bookmarks:", searchResult.error);
                  addActionResult(`Failed to search bookmarks: ${searchResult.error}`, true);
                } else {
                  const bookmarkCount = searchResult.bookmarks?.length || 0;
                  console.log(`✅ [App] Found ${bookmarkCount} bookmarks`);
                  
                  if (bookmarkCount > 0) {
                    const bookmarkList = searchResult.bookmarks!
                      .slice(0, 10)
                      .map((b, i) => `${i + 1}. ${b.title}\n   ${b.url} (${b.browser})`)
                      .join("\n\n");
                    const moreText = bookmarkCount > 10 ? `\n\n... and ${bookmarkCount - 10} more bookmark${bookmarkCount - 10 > 1 ? "s" : ""}` : "";
                    const resultText = `Found ${bookmarkCount} bookmark${bookmarkCount > 1 ? "s" : ""} matching "${params.query}":\n\n${bookmarkList}${moreText}`;
                    await sendActionResultToGemini(action.name, resultText, windowId);
                  } else {
                    const resultText = `No bookmarks found matching "${params.query}".`;
                    await sendActionResultToGemini(action.name, resultText, windowId);
                  }
                }
              } else {
                result = { success: false, error: "Query must be a string" };
                addActionResult("Error: Query must be a string", true);
              }
              break;
            case "browser-bookmarks-open":
              if (typeof params.url === "string") {
                const openResult = await browserBookmarks.open({
                  url: params.url,
                  browser: typeof params.browser === "string" ? params.browser : undefined,
                });
                if (!openResult.success) {
                  result = { success: false, error: openResult.error };
                  console.error("❌ [App] Failed to open bookmark:", openResult.error);
                  addActionResult(`Failed to open bookmark: ${openResult.error}`, true);
                } else {
                  console.log("✅ [App] Bookmark opened successfully");
                  const browserText = params.browser ? ` in ${params.browser}` : "";
                  const resultText = `Opened bookmark${browserText}: ${params.url}`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                result = { success: false, error: "URL must be a string" };
                addActionResult("Error: URL must be a string", true);
              }
              break;
            default:
              result = { success: false, error: `Unknown Browser Bookmarks action: ${action.id}` };
          }
        }

        if (!result.success) {
          console.error("❌ [App] Browser Bookmarks action failed:", {
            error: result.error,
            actionId: pendingAction.action.id,
          });
        }
      } else if (action.category === "browser-history") {
        // Handle Browser History actions
        console.log("📜 [App] Handling Browser History action:", action.id, params);
        
        if (!browserHistory.isAvailable) {
          console.error("❌ [App] Browser History integration is not available");
          result = { success: false, error: "Browser History integration is not available" };
        } else {
          switch (action.id) {
            case "browser-history-search":
              if (typeof params.query === "string") {
                const searchResult = await browserHistory.search({
                  query: params.query,
                  browser: typeof params.browser === "string" ? params.browser : undefined,
                  limit: typeof params.limit === "number" ? params.limit : undefined,
                });
                if (!searchResult.success) {
                  result = { success: false, error: searchResult.error };
                  console.error("❌ [App] Failed to search history:", searchResult.error);
                  addActionResult(`Failed to search history: ${searchResult.error}`, true);
                } else {
                  const entryCount = searchResult.entries?.length || 0;
                  console.log(`✅ [App] Found ${entryCount} history entries`);
                  
                  if (entryCount > 0) {
                    const historyList = searchResult.entries!
                      .slice(0, 10)
                      .map((e, i) => `${i + 1}. ${e.title}\n   ${e.url} (${e.browser})`)
                      .join("\n\n");
                    const moreText = entryCount > 10 ? `\n\n... and ${entryCount - 10} more entr${entryCount - 10 > 1 ? "ies" : "y"}` : "";
                    const resultText = `Found ${entryCount} histor${entryCount > 1 ? "y entries" : "y entry"} matching "${params.query}":\n\n${historyList}${moreText}`;
                    await sendActionResultToGemini(action.name, resultText, windowId);
                  } else {
                    const resultText = `No history entries found matching "${params.query}".`;
                    await sendActionResultToGemini(action.name, resultText, windowId);
                  }
                }
              } else {
                result = { success: false, error: "Query must be a string" };
                addActionResult("Error: Query must be a string", true);
              }
              break;
            default:
              result = { success: false, error: `Unknown Browser History action: ${action.id}` };
          }
        }

        if (!result.success) {
          console.error("❌ [App] Browser History action failed:", {
            error: result.error,
            actionId: pendingAction.action.id,
          });
        }
      } else if (action.category === "browser-tabs") {
        // Handle Browser Tabs actions
        console.log("📑 [App] Handling Browser Tabs action:", action.id, params);
        
        if (!browserTabs.isAvailable) {
          console.error("❌ [App] Browser Tabs integration is not available");
          result = { success: false, error: "Browser Tabs integration is not available" };
        } else {
          switch (action.id) {
            case "browser-tabs-search":
              if (typeof params.query === "string") {
                const searchResult = await browserTabs.search(
                  params.query,
                  typeof params.browser === "string" ? params.browser : undefined,
                );
                if (!searchResult.success) {
                  result = { success: false, error: searchResult.error };
                  console.error("❌ [App] Failed to search tabs:", searchResult.error);
                  addActionResult(`Failed to search tabs: ${searchResult.error}`, true);
                } else {
                  const tabCount = searchResult.tabs?.length || 0;
                  console.log(`✅ [App] Found ${tabCount} tabs`);
                  
                  if (tabCount > 0) {
                    const tabList = searchResult.tabs!
                      .map((t, i) => `${i + 1}. ${t.title}\n   ${t.url} (${t.browser}, Window ${t.windowId}, Tab ${t.tabIndex})`)
                      .join("\n\n");
                    const resultText = `Found ${tabCount} open tab${tabCount > 1 ? "s" : ""}${params.query && params.query.toLowerCase() !== "all" ? ` matching "${params.query}"` : ""}:\n\n${tabList}`;
                    // Just show results, don't send to Gemini
                    addActionResult(resultText, false);
                  } else {
                    const resultText = `No open tabs found${params.query && params.query.toLowerCase() !== "all" ? ` matching "${params.query}"` : ""}.`;
                    addActionResult(resultText, false);
                  }
                }
              } else {
                result = { success: false, error: "Query must be a string" };
                addActionResult("Error: Query must be a string", true);
              }
              break;
            case "browser-tabs-close":
              if (
                typeof params.browser === "string" &&
                typeof params.windowId === "string" &&
                typeof params.tabIndex === "number"
              ) {
                const closeResult = await browserTabs.close({
                  browser: params.browser,
                  windowId: params.windowId,
                  tabIndex: params.tabIndex,
                });
                if (!closeResult.success) {
                  result = { success: false, error: closeResult.error };
                  console.error("❌ [App] Failed to close tab:", closeResult.error);
                  addActionResult(`Failed to close tab: ${closeResult.error}`, true);
                } else {
                  console.log("✅ [App] Tab closed successfully");
                  const resultText = `Closed tab ${params.tabIndex} in ${params.browser} window ${params.windowId} successfully.`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                result = { success: false, error: "Browser, windowId, and tabIndex are required" };
                addActionResult("Error: Browser, windowId, and tabIndex are required", true);
              }
              break;
            default:
              result = { success: false, error: `Unknown Browser Tabs action: ${action.id}` };
          }
        }

        if (!result.success) {
          console.error("❌ [App] Browser Tabs action failed:", {
            error: result.error,
            actionId: pendingAction.action.id,
          });
        }
      } else if (action.category === "browser-profiles") {
        // Handle Browser Profiles actions
        console.log("👤 [App] Handling Browser Profiles action:", action.id, params);
        
        if (!browserProfiles.isAvailable) {
          console.error("❌ [App] Browser Profiles integration is not available");
          result = { success: false, error: "Browser Profiles integration is not available" };
        } else {
          switch (action.id) {
            case "browser-profiles-list":
              if (typeof params.browser === "string") {
                const listResult = await browserProfiles.list(params.browser);
                if (!listResult.success) {
                  result = { success: false, error: listResult.error };
                  console.error("❌ [App] Failed to list profiles:", listResult.error);
                  addActionResult(`Failed to list profiles: ${listResult.error}`, true);
                } else {
                  const profileCount = listResult.profiles?.length || 0;
                  console.log(`✅ [App] Found ${profileCount} profiles`);
                  
                  if (profileCount > 0) {
                    const profileList = listResult.profiles!
                      .map((p, i) => `${i + 1}. ${p.name} (${p.browser})`)
                      .join("\n");
                    const resultText = `Found ${profileCount} ${params.browser} profile${profileCount > 1 ? "s" : ""}:\n\n${profileList}`;
                    await sendActionResultToGemini(action.name, resultText, windowId);
                  } else {
                    const resultText = `No profiles found for ${params.browser}.`;
                    await sendActionResultToGemini(action.name, resultText, windowId);
                  }
                }
              } else {
                result = { success: false, error: "Browser must be a string" };
                addActionResult("Error: Browser must be a string", true);
              }
              break;
            case "browser-profiles-open":
              if (typeof params.browser === "string" && typeof params.profile === "string") {
                const openResult = await browserProfiles.open({
                  browser: params.browser,
                  profile: params.profile,
                });
                if (!openResult.success) {
                  result = { success: false, error: openResult.error };
                  console.error("❌ [App] Failed to open profile:", openResult.error);
                  addActionResult(`Failed to open ${params.browser} with profile "${params.profile}": ${openResult.error}`, true);
                } else {
                  console.log("✅ [App] Browser opened with profile successfully");
                  const resultText = `Opened ${params.browser} with profile "${params.profile}" successfully.`;
                  await sendActionResultToGemini(action.name, resultText, windowId);
                }
              } else {
                result = { success: false, error: "Browser and profile must be strings" };
                addActionResult("Error: Browser and profile must be strings", true);
              }
              break;
            default:
              result = { success: false, error: `Unknown Browser Profiles action: ${action.id}` };
          }
        }

        if (!result.success) {
          console.error("❌ [App] Browser Profiles action failed:", {
            error: result.error,
            actionId: pendingAction.action.id,
          });
        }
      } else {
        // Regular actions that use scripts
        if (!action.scriptPath) {
          console.error("❌ [App] Action has no scriptPath:", action.id);
          setPendingAction(null);
          return;
        }

        const result = await sky?.executeAction?.(
          {
            actionId: pendingActionData.id,
            parameters: applyActionDefaults(action, parameters),
          },
          action.scriptPath,
        );

        console.log("🔄 [App] Script action result:", { 
          success: result?.success, 
          hasOutput: !!result?.output, 
          outputLength: result?.output?.length,
          actionId: action.id,
          windowId 
        });

        if (!result?.success) {
          console.error("❌ [App] Action execution failed:", {
            error: result?.error,
            actionId: pendingActionData.id,
          });
          addActionResultWithWindowId(windowId, `Action failed: ${result?.error || "Unknown error"}`, true);
        } else {
          // Handle specific actions that return JSON data
          if (action.id === "chrome-get-open-tabs" && result?.output) {
            console.log("🔄 [App] Processing chrome-get-open-tabs output, length:", result.output.length);
            try {
              // Parse the JSON output from Chrome tabs script
              const tabs = JSON.parse(result.output);
              console.log("🔄 [App] Parsed tabs, count:", tabs.length);
              if (Array.isArray(tabs) && tabs.length > 0) {
                // Send to Gemini to format nicely with links and titles only
                const tabsData = tabs.map((t: any) => ({
                  title: t.title || "Untitled",
                  url: t.url || "",
                }));
                const resultText = JSON.stringify(tabsData, null, 2);
                const promptForGemini = `The user asked to list Chrome tabs. Here are ${tabs.length} open tabs in JSON format. Please format this as a clean, readable list with clickable markdown links showing only the titles. Use markdown link format: [Title](URL). Format it nicely with each tab on a new line. Here's the data:\n\n${resultText}`;
                
                console.log("🔄 [App] Sending Chrome tabs to Gemini for formatting");
                await sendActionResultToGemini("List Chrome Tabs", promptForGemini, windowId, false);
                console.log("✅ [App] Sent Chrome tabs to Gemini for formatting");
              } else {
                console.log("🔄 [App] No tabs found");
                addActionResultWithWindowId(windowId, "No Chrome tabs found.", false);
              }
            } catch (parseError) {
              console.error("❌ [App] Failed to parse Chrome tabs JSON:", parseError);
              // Fallback: show raw output
              addActionResultWithWindowId(windowId, `Chrome tabs:\n${result.output}`, false);
            }
          } else if (result?.output) {
            // For other actions with output, show it
            console.log("🔄 [App] Showing output for other action:", action.id);
            addActionResultWithWindowId(windowId, result.output, false);
          } else {
            console.log("🔄 [App] No output to display for action:", action.id);
          }
        }
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
      {/* Integration cards (Spotify, etc.) positioned in corners to avoid overlap with centered prompt windows */}
      <SpotifyCardWrapper show={showSpotifyCard} />
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

