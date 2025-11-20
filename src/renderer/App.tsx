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
import { useSpotify } from "@/hooks/useSpotify";
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


// Helper functions for formatting Spotify results
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatSpotifySearchResults(results: any): string {
  const parts: string[] = [];

  if (results.tracks && results.tracks.length > 0) {
    parts.push(`Tracks (${results.tracks.length}):`);
    results.tracks.slice(0, 5).forEach((track: any, i: number) => {
      parts.push(`${i + 1}. ${track.artists?.join(", ")} - ${track.name}${track.uri ? ` (${track.uri})` : ""}`);
    });
    if (results.tracks.length > 5) parts.push(`... and ${results.tracks.length - 5} more`);
    parts.push("");
  }

  if (results.albums && results.albums.length > 0) {
    parts.push(`Albums (${results.albums.length}):`);
    results.albums.slice(0, 5).forEach((album: any, i: number) => {
      parts.push(`${i + 1}. ${album.artists?.join(", ")} - ${album.name}${album.uri ? ` (${album.uri})` : ""}`);
    });
    if (results.albums.length > 5) parts.push(`... and ${results.albums.length - 5} more`);
    parts.push("");
  }

  if (results.artists && results.artists.length > 0) {
    parts.push(`Artists (${results.artists.length}):`);
    results.artists.slice(0, 5).forEach((artist: any, i: number) => {
      parts.push(`${i + 1}. ${artist.name}${artist.uri ? ` (${artist.uri})` : ""}`);
    });
    if (results.artists.length > 5) parts.push(`... and ${results.artists.length - 5} more`);
    parts.push("");
  }

  if (results.playlists && results.playlists.length > 0) {
    parts.push(`Playlists (${results.playlists.length}):`);
    results.playlists.slice(0, 5).forEach((playlist: any, i: number) => {
      parts.push(`${i + 1}. ${playlist.name}${playlist.uri ? ` (${playlist.uri})` : ""}`);
    });
    if (results.playlists.length > 5) parts.push(`... and ${results.playlists.length - 5} more`);
    parts.push("");
  }

  return parts.join("\n") || "No results found";
}

function formatSpotifyLibrary(library: any): string {
  const parts: string[] = [];

  if (library.savedTracks && library.savedTracks.length > 0) {
    parts.push(`Saved Tracks (${library.savedTracks.length}):`);
    library.savedTracks.slice(0, 10).forEach((track: any, i: number) => {
      parts.push(`${i + 1}. ${track.artists?.join(", ")} - ${track.name}`);
    });
    if (library.savedTracks.length > 10) parts.push(`... and ${library.savedTracks.length - 10} more`);
    parts.push("");
  }

  if (library.playlists && library.playlists.length > 0) {
    parts.push(`Playlists (${library.playlists.length}):`);
    library.playlists.slice(0, 10).forEach((playlist: any, i: number) => {
      parts.push(`${i + 1}. ${playlist.name} (${playlist.trackCount || 0} tracks)`);
    });
    if (library.playlists.length > 10) parts.push(`... and ${library.playlists.length - 10} more`);
    parts.push("");
  }

  if (library.savedAlbums && library.savedAlbums.length > 0) {
    parts.push(`Saved Albums (${library.savedAlbums.length}):`);
    library.savedAlbums.slice(0, 10).forEach((album: any, i: number) => {
      parts.push(`${i + 1}. ${album.artists?.join(", ")} - ${album.name}`);
    });
    if (library.savedAlbums.length > 10) parts.push(`... and ${library.savedAlbums.length - 10} more`);
    parts.push("");
  }

  return parts.join("\n") || "Library is empty";
}

function formatSpotifyPlaylists(playlists: any[]): string {
  if (playlists.length === 0) return "No playlists found";

  const parts: string[] = [`Your Playlists (${playlists.length}):`];
  playlists.slice(0, 20).forEach((playlist, i) => {
    parts.push(`${i + 1}. ${playlist.name}${playlist.trackCount ? ` (${playlist.trackCount} tracks)` : ""}${playlist.owner ? ` by ${playlist.owner}` : ""}`);
  });
  if (playlists.length > 20) parts.push(`... and ${playlists.length - 20} more`);

  return parts.join("\n");
}

function formatSpotifyQueue(queue: any[]): string {
  if (queue.length === 0) return "Queue is empty";

  const parts: string[] = [`Queue (${queue.length} items):`];
  queue.slice(0, 10).forEach((item, i) => {
    if (item.name) {
      const artists = item.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist";
      parts.push(`${i + 1}. ${artists} - ${item.name}`);
    }
  });
  if (queue.length > 10) parts.push(`... and ${queue.length - 10} more`);

  return parts.join("\n");
}

function formatSpotifyDevices(devices: any[]): string {
  if (devices.length === 0) return "No devices found";

  const parts: string[] = [`Available Devices (${devices.length}):`];
  devices.forEach((device, i) => {
    parts.push(`${i + 1}. ${device.name} (${device.type})${device.isActive ? " [Active]" : ""}${device.volumePercent != null ? ` - Volume: ${device.volumePercent}%` : ""}`);
  });

  return parts.join("\n");
}

// Helper function to build conversation history from all windows
function buildConversationHistory(promptWindows: PromptWindow[]): import("@/lib/gemini").ConversationHistory[] {
  const history: import("@/lib/gemini").ConversationHistory[] = [];

  // Process all windows in reverse order (oldest first) to maintain chronological order
  const sortedWindows = [...promptWindows].reverse();

  for (const window of sortedWindows) {
    // Add the user prompt
    if (window.prompt) {
      history.push({
        role: "user",
        parts: [{ text: window.prompt }],
      });
    }

    // Add all entries (responses, action results, etc.)
    for (const entry of window.entries) {
      if (entry.kind === "prompt") {
        // Skip prompt entries as we already added the prompt above
        continue;
      }

      if (entry.kind === "response" && entry.body) {
        // Add response from model
        history.push({
          role: "model",
          parts: [{ text: entry.body }],
        });
      } else if (entry.kind === "action" && entry.body) {
        // Add action result as a model response (since it's information from the system)
        history.push({
          role: "model",
          parts: [{ text: entry.body }],
        });
      }
    }
  }

  return history;
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
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdingCardId, setHoldingCardId] = useState<string | null>(null);

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

    // Get current state to build history before updating
    let currentWindows: PromptWindow[] = [];
    setPromptWindows((prev) => {
      currentWindows = prev;
      return prev.map((w) =>
        w.id === windowId
          ? {
            ...w,
            entries: [...w.entries, responseEntry],
          }
          : w
      );
    });

    // Build conversation history from all existing windows (including the one we just updated)
    const conversationHistory = buildConversationHistory(currentWindows);
    console.log("📚 [App] Building conversation history for action follow-up:", {
      windowCount: currentWindows.length,
      historyLength: conversationHistory.length,
    });

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
      }, conversationHistory);
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
      // Spotify actions are now handled inline in the prompt window
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

    // Spotify controls are now shown inline in the prompt window

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

    // Build conversation history from all existing windows
    const conversationHistory = buildConversationHistory(promptWindows);
    console.log("📚 [App] Building conversation history:", {
      windowCount: promptWindows.length,
      historyLength: conversationHistory.length,
      historyPreview: conversationHistory.slice(-3).map(h => ({ role: h.role, textLength: h.parts[0]?.text?.length || 0 })),
    });

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
      }, conversationHistory);
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

    // Close the action approval window immediately after approval
    // Don't wait for async operations to complete
    setPendingAction(null);

    try {
      const params = applyActionDefaults(action, parameters);
      let result: { success: boolean; error?: string } = { success: true };

      // Handle Spotify actions
      if (action.category === "spotify") {
        // Spotify controls are now shown inline in the prompt window

        try {
          switch (action.id) {
            // Basic Playback Controls
            case "spotify-play":
              await sky?.spotify?.play?.();
              addActionResultWithWindowId(windowId, "Playing Spotify", false);
              break;
            case "spotify-pause":
              await sky?.spotify?.pause?.();
              addActionResultWithWindowId(windowId, "Paused Spotify", false);
              break;
            case "spotify-toggle-play":
              await sky?.spotify?.togglePlayPause?.();
              addActionResultWithWindowId(windowId, "Toggled play/pause", false);
              break;
            case "spotify-next":
              await sky?.spotify?.nextTrack?.();
              addActionResultWithWindowId(windowId, "Skipped to next track", false);
              break;
            case "spotify-previous":
              await sky?.spotify?.previousTrack?.();
              addActionResultWithWindowId(windowId, "Went to previous track", false);
              break;
            case "spotify-current-track": {
              const trackResult = await sky?.spotify?.getCurrentTrack?.();
              if (trackResult?.success && trackResult?.output) {
                const parts = trackResult.output.split("|");
                if (parts.length >= 10) {
                  const trackInfo = `Now Playing:\n${parts[1]} - ${parts[0]}\nAlbum: ${parts[2]}\nURL: ${parts[3]}\nState: ${parts[4]}\nVolume: ${parts[7]}%\nShuffle: ${parts[8]}\nRepeat: ${parts[9]}`;
                  await sendActionResultToGemini(action.name, trackInfo, windowId);
                } else {
                  addActionResultWithWindowId(windowId, trackResult.output || "No track information available", false);
                }
              } else {
                addActionResultWithWindowId(windowId, trackResult?.error || "Failed to get current track", true);
              }
              break;
            }
            // Volume Controls
            case "spotify-set-volume":
              if (typeof params.level === "number") {
                await sky?.spotify?.setVolume?.({ level: params.level });
                addActionResultWithWindowId(windowId, `Volume set to ${params.level}%`, false);
              } else {
                result = { success: false, error: "Volume level must be a number" };
              }
              break;
            case "spotify-increase-volume": {
              const step = typeof params.step === "number" ? params.step : 10;
              await sky?.spotify?.increaseVolume?.({ step });
              addActionResultWithWindowId(windowId, `Volume increased by ${step}%`, false);
              break;
            }
            case "spotify-decrease-volume": {
              const step = typeof params.step === "number" ? params.step : 10;
              await sky?.spotify?.decreaseVolume?.({ step });
              addActionResultWithWindowId(windowId, `Volume decreased by ${step}%`, false);
              break;
            }
            case "spotify-volume-0":
              await sky?.spotify?.muteVolume?.();
              addActionResultWithWindowId(windowId, "Volume muted", false);
              break;
            case "spotify-volume-25":
              await sky?.spotify?.setVolumePercent?.({ percent: 25 });
              addActionResultWithWindowId(windowId, "Volume set to 25%", false);
              break;
            case "spotify-volume-50":
              await sky?.spotify?.setVolumePercent?.({ percent: 50 });
              addActionResultWithWindowId(windowId, "Volume set to 50%", false);
              break;
            case "spotify-volume-75":
              await sky?.spotify?.setVolumePercent?.({ percent: 75 });
              addActionResultWithWindowId(windowId, "Volume set to 75%", false);
              break;
            case "spotify-volume-100":
              await sky?.spotify?.setVolumePercent?.({ percent: 100 });
              addActionResultWithWindowId(windowId, "Volume set to 100%", false);
              break;
            // Playback Controls
            case "spotify-toggle-shuffle": {
              const shuffleResult = await sky?.spotify?.toggleShuffle?.();
              const shuffleState = shuffleResult?.output === "true" ? "on" : "off";
              addActionResultWithWindowId(windowId, `Shuffle ${shuffleState}`, false);
              break;
            }
            case "spotify-toggle-repeat": {
              const repeatResult = await sky?.spotify?.toggleRepeat?.();
              const repeatState = repeatResult?.output === "true" ? "on" : "off";
              addActionResultWithWindowId(windowId, `Repeat ${repeatState}`, false);
              break;
            }
            case "spotify-forward-seconds":
              if (typeof params.seconds === "number") {
                await sky?.spotify?.forwardSeconds?.({ seconds: params.seconds });
                addActionResultWithWindowId(windowId, `Skipped forward ${params.seconds} seconds`, false);
              } else {
                result = { success: false, error: "Seconds must be a number" };
              }
              break;
            case "spotify-backward-seconds":
              if (typeof params.seconds === "number") {
                await sky?.spotify?.backwardSeconds?.({ seconds: params.seconds });
                addActionResultWithWindowId(windowId, `Skipped backward ${params.seconds} seconds`, false);
              } else {
                result = { success: false, error: "Seconds must be a number" };
              }
              break;
            case "spotify-skip-15":
              await sky?.spotify?.forwardSeconds?.({ seconds: 15 });
              addActionResultWithWindowId(windowId, "Skipped forward 15 seconds", false);
              break;
            case "spotify-back-15":
              await sky?.spotify?.backwardSeconds?.({ seconds: 15 });
              addActionResultWithWindowId(windowId, "Skipped backward 15 seconds", false);
              break;
            case "spotify-backward-to-beginning":
              await sky?.spotify?.backwardToBeginning?.();
              addActionResultWithWindowId(windowId, "Went to beginning of track", false);
              break;
            // Utility Actions
            case "spotify-copy-url": {
              const urlResult = await sky?.spotify?.copyTrackUrl?.();
              if (urlResult?.success && urlResult?.output) {
                addActionResultWithWindowId(windowId, `Copied track URL to clipboard: ${urlResult.output}`, false);
              } else {
                addActionResultWithWindowId(windowId, urlResult?.error || "Failed to copy URL", true);
              }
              break;
            }
            case "spotify-copy-artist-title": {
              const copyResult = await sky?.spotify?.copyArtistAndTitle?.();
              if (copyResult?.success && copyResult?.output) {
                addActionResultWithWindowId(windowId, `Copied to clipboard: ${copyResult.output}`, false);
              } else {
                addActionResultWithWindowId(windowId, copyResult?.error || "Failed to copy", true);
              }
              break;
            }
            // Web API Actions
            case "spotify-search": {
              if (typeof params.query === "string") {
                const categories = params.category ? [params.category as any] : undefined;
                const searchResults = await sky?.spotify?.search?.({ query: params.query, categories });
                if (searchResults) {
                  const resultText = formatSpotifySearchResults(searchResults);
                  await sendActionResultToGemini(action.name, resultText, windowId);
                } else {
                  addActionResultWithWindowId(windowId, "No search results found", false);
                }
              } else {
                result = { success: false, error: "Query must be a string" };
              }
              break;
            }
            case "spotify-play-track":
              if (typeof params.uri === "string") {
                const uriType = params.uri.split(":")[1];
                await sky?.spotify?.playUri?.({
                  type: uriType === "track" ? "track" : "context",
                  uri: params.uri,
                });
                addActionResultWithWindowId(windowId, `Playing ${params.uri}`, false);
              } else {
                result = { success: false, error: "URI must be a string" };
              }
              break;
            case "spotify-queue-track":
              if (typeof params.uri === "string") {
                await sky?.spotify?.queueUri?.(params.uri);
                addActionResultWithWindowId(windowId, `Added ${params.uri} to queue`, false);
              } else {
                result = { success: false, error: "URI must be a string" };
              }
              break;
            case "spotify-get-library": {
              const library = await sky?.spotify?.getLibrary?.();
              if (library) {
                const resultText = formatSpotifyLibrary(library);
                await sendActionResultToGemini(action.name, resultText, windowId);
              } else {
                addActionResultWithWindowId(windowId, "Failed to get library", true);
              }
              break;
            }
            case "spotify-get-playlists": {
              const limit = typeof params.limit === "number" ? params.limit : 50;
              const playlists = await sky?.spotify?.getMyPlaylists?.({ limit });
              if (playlists && Array.isArray(playlists)) {
                const resultText = formatSpotifyPlaylists(playlists);
                await sendActionResultToGemini(action.name, resultText, windowId);
              } else {
                addActionResultWithWindowId(windowId, "Failed to get playlists", true);
              }
              break;
            }
            case "spotify-get-queue": {
              const queue = await sky?.spotify?.getQueue?.();
              if (queue && Array.isArray(queue)) {
                const resultText = formatSpotifyQueue(queue);
                await sendActionResultToGemini(action.name, resultText, windowId);
              } else {
                addActionResultWithWindowId(windowId, "No items in queue", false);
              }
              break;
            }
            case "spotify-get-devices": {
              const devices = await sky?.spotify?.getDevices?.();
              if (devices && Array.isArray(devices)) {
                const resultText = formatSpotifyDevices(devices);
                await sendActionResultToGemini(action.name, resultText, windowId);
              } else {
                addActionResultWithWindowId(windowId, "No devices found", false);
              }
              break;
            }
            case "spotify-get-currently-playing": {
              const track = await sky?.spotify?.getCurrentlyPlaying?.();
              if (track) {
                const resultText = `Currently Playing:\n${track.artists?.join(", ")} - ${track.name}\nAlbum: ${track.album}\nDuration: ${formatDuration(track.durationMs || 0)}`;
                await sendActionResultToGemini(action.name, resultText, windowId);
              } else {
                addActionResultWithWindowId(windowId, "No track currently playing", false);
              }
              break;
            }
            case "spotify-like-track":
              if (typeof params.trackId === "string") {
                await sky?.spotify?.setTrackSaved?.({ trackId: params.trackId, saved: true });
                addActionResultWithWindowId(windowId, `Liked track ${params.trackId}`, false);
              } else {
                result = { success: false, error: "Track ID must be a string" };
              }
              break;
            case "spotify-unlike-track":
              if (typeof params.trackId === "string") {
                await sky?.spotify?.setTrackSaved?.({ trackId: params.trackId, saved: false });
                addActionResultWithWindowId(windowId, `Unliked track ${params.trackId}`, false);
              } else {
                result = { success: false, error: "Track ID must be a string" };
              }
              break;
            case "spotify-play-song": {
              // Search and play the first track result
              if (typeof params.query === "string") {
                const searchResults = await sky?.spotify?.search?.({ query: params.query, categories: ["tracks"] });
                if (searchResults && searchResults.tracks && searchResults.tracks.length > 0) {
                  const firstTrack = searchResults.tracks[0];
                  if (firstTrack.uri) {
                    await sky?.spotify?.playUri?.({
                      type: "track",
                      uri: firstTrack.uri,
                    });
                    const trackInfo = `${firstTrack.artists?.join(", ")} - ${firstTrack.name}`;
                    addActionResultWithWindowId(windowId, `Playing: ${trackInfo}`, false);
                  } else {
                    addActionResultWithWindowId(windowId, "Found track but no URI available", true);
                  }
                } else {
                  addActionResultWithWindowId(windowId, `No tracks found for "${params.query}"`, false);
                }
              } else {
                result = { success: false, error: "Query must be a string" };
              }
              break;
            }
            default:
              result = { success: false, error: `Unknown Spotify action: ${action.id}` };
          }
        } catch (error) {
          console.error("❌ [App] Spotify action error:", error);
          result = { success: false, error: error instanceof Error ? error.message : String(error) };
          addActionResultWithWindowId(windowId, `Error: ${result.error}`, true);
        }

        if (!result.success && result.error) {
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
      } else if (action.category === "web-search") {
        // Handle Exa Web Search actions
        console.log("🔍 [App] Handling Exa Web Search action:", action.id, params);

        switch (action.id) {
          case "exa-websearch":
            if (typeof params.query === "string") {
              try {
                const searchResult = await sky?.exa?.search?.(params.query);
                if (searchResult && !searchResult.error) {
                  const resultCount = searchResult.results?.length || 0;
                  console.log(`✅ [App] Exa search completed: ${resultCount} results found`);

                  if (resultCount > 0) {
                    // Format search results for Gemini
                    const formattedResults = searchResult.results!
                      .map((r: any, i: number) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.text ? r.text.substring(0, 200) + (r.text.length > 200 ? "..." : "") : "No preview available"}`)
                      .join("\n\n");

                    const resultText = `Found ${resultCount} result${resultCount > 1 ? "s" : ""} for "${params.query}":\n\n${formattedResults}\n\nSources:\n${searchResult.results!.map((r: any, i: number) => `[${i + 1}] ${r.url}`).join("\n")}`;
                    await sendActionResultToGemini(action.name, resultText, windowId);
                  } else {
                    const resultText = `No results found for "${params.query}".`;
                    await sendActionResultToGemini(action.name, resultText, windowId);
                  }
                } else {
                  result = { success: false, error: searchResult?.error || "Search failed" };
                  console.error("❌ [App] Exa search failed:", searchResult?.error);
                  addActionResult(`Failed to search: ${searchResult?.error}`, true);
                }
              } catch (error) {
                result = { success: false, error: error instanceof Error ? error.message : String(error) };
                console.error("❌ [App] Exa search error:", error);
                addActionResult(`Search error: ${result.error}`, true);
              }
            } else {
              result = { success: false, error: "Query must be a string" };
              addActionResult("Error: Query must be a string", true);
            }
            break;
          default:
            result = { success: false, error: `Unknown web search action: ${action.id}` };
        }

        if (!result.success) {
          console.error("❌ [App] Exa Web Search action failed:", {
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
        actionId: pendingActionData.id,
      });
    } finally {
      // Always close the action approval window after execution completes
      console.log("🔄 [App] Closing action approval window");
      setPendingAction(null);
    }
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
              // Always focus input when clicking logo
              requestAnimationFrame(() => inputRef.current?.focus());
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
        onHoldProgressChange={(progress, cardId) => {
          setHoldProgress(progress);
          setHoldingCardId(cardId);
        }}
      />
      {/* Underlying expanded content removed per new flow to keep focus on stacked windows */}
    </div>
  );
}

