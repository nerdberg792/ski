import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Action } from "@/types/actions";
import { getAllActions } from "./actions";

let geminiClient: GoogleGenerativeAI | null = null;
let apiKey: string | null = null;

export function initializeGemini(key: string): void {
  apiKey = key;
  // Initialize with API key
  // Using gemini-2.5-flash - latest stable model with enhanced reasoning capabilities
  geminiClient = new GoogleGenerativeAI(key);
}

export function isGeminiInitialized(): boolean {
  return geminiClient !== null && apiKey !== null;
}

export interface GeminiStreamChunk {
  text: string;
  isComplete: boolean;
  proposedAction?: {
    actionId: string;
    parameters?: Record<string, string | number | boolean>;
  };
}

export interface GeminiStreamOptions {
  onChunk: (chunk: GeminiStreamChunk) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

function buildSystemPrompt(basePrompt: string): string {
  const spotifyCapabilities = `
## Spotify Integration Capabilities

You have comprehensive access to Spotify control functions. When users ask about music, Spotify, or want to control playback, you can use these function tools:

**Basic Playback Controls:**
- spotify-play: Resume or start playback
- spotify-pause: Pause playback
- spotify-toggle-play: Toggle between play and pause
- spotify-next: Skip to the next track
- spotify-previous: Go back to the previous track
- spotify-current-track: Get information about the currently playing track

**Volume Controls:**
- spotify-set-volume: Set volume level (0-100) - requires "level" parameter (number)
- spotify-increase-volume: Increase volume by step (default 10) - optional "step" parameter (number)
- spotify-decrease-volume: Decrease volume by step (default 10) - optional "step" parameter (number)
- spotify-volume-0: Mute volume (set to 0%)
- spotify-volume-25: Set volume to 25%
- spotify-volume-50: Set volume to 50%
- spotify-volume-75: Set volume to 75%
- spotify-volume-100: Set volume to 100%

**Playback Controls:**
- spotify-toggle-shuffle: Toggle shuffle mode on/off
- spotify-toggle-repeat: Toggle repeat mode on/off
- spotify-forward-seconds: Skip forward by specified seconds - requires "seconds" parameter (number)
- spotify-backward-seconds: Skip backward by specified seconds - requires "seconds" parameter (number)
- spotify-skip-15: Skip forward 15 seconds
- spotify-back-15: Skip backward 15 seconds
- spotify-backward-to-beginning: Go back to the beginning of the current track

**Utility Actions:**
- spotify-copy-url: Copy the Spotify URL of the current track to clipboard
- spotify-copy-artist-title: Copy the artist and title of the current track to clipboard

**Web API Actions:**
- spotify-search: Search for tracks, albums, artists, playlists, shows, or episodes - requires "query" parameter (string), optional "category" parameter (tracks, albums, artists, playlists, shows, episodes, or all)
- spotify-play-track: Play a specific track, album, or playlist by URI - requires "uri" parameter (string, e.g., "spotify:track:4iV5W9uYEdYUVa79Axb7Rh")
- spotify-queue-track: Add a track to the queue - requires "uri" parameter (string)
- spotify-get-library: Get user's saved tracks, albums, playlists, shows, and episodes
- spotify-get-playlists: Get all user's playlists - optional "limit" parameter (number, default 50)
- spotify-get-queue: Get the current playback queue
- spotify-get-devices: Get available Spotify devices
- spotify-get-currently-playing: Get the currently playing track via Web API
- spotify-like-track: Like a track - requires "trackId" parameter (string)
- spotify-unlike-track: Unlike a track - requires "trackId" parameter (string)
- spotify-play-song: Search for a song by name and automatically play the first result - requires "query" parameter (string)

**Important Notes:**
- Users must connect their Spotify account through OAuth first (they can do this via the Spotify control card)
- Playback requires an active Spotify device (desktop app, mobile app, or web player)
- AppleScript-based controls (play, pause, volume, etc.) work directly with the Spotify macOS app
- Web API actions require OAuth authentication
- Search results are formatted and sent back to the user automatically
- When getting library/playlists/queue, results are formatted and displayed automatically

**Example Usage:**
- User: "Play Spotify" → Call spotify-play
- User: "Pause music" → Call spotify-pause
- User: "Next song" → Call spotify-next
- User: "Set volume to 50" → Call spotify-set-volume with level: 50
- User: "Increase volume" → Call spotify-increase-volume
- User: "Mute Spotify" → Call spotify-volume-0
- User: "Toggle shuffle" → Call spotify-toggle-shuffle
- User: "Skip 15 seconds" → Call spotify-skip-15
- User: "What's playing?" → Call spotify-current-track or spotify-get-currently-playing
- User: "Search for [song name]" → Call spotify-search with query: "[song name]"
- User: "Play [song name]" → Call spotify-play-song with query: "[song name]" (this will search and play automatically)
- User: "Show my playlists" → Call spotify-get-playlists
- User: "What's in my queue?" → Call spotify-get-queue
- User: "Show my devices" → Call spotify-get-devices
`;

  const appleNotesCapabilities = `
## Apple Notes Integration Capabilities

You have access to Apple Notes functions that you can call directly. When users ask about notes, want to create notes, search notes, or manage their Apple Notes, you can use these function tools:

**Available Apple Notes Functions:**
- apple-notes-search: Search for notes in Apple Notes by title, content, folder, or tags - requires "query" parameter (string)
- apple-notes-create: Create a new note in Apple Notes - optional "content" (HTML format) or "text" (plain text) parameter
- apple-notes-get-content: Get the content of a specific note by ID - requires "noteId" parameter (string)
- apple-notes-update: Update the content of a specific note - requires "noteId" (string) and "content" (HTML format, string) parameters

**Important Notes:**
- These functions interact with the Apple Notes app on macOS
- The search function searches through notes and returns matching results with their IDs, titles, folders, and snippets
- To create a note, you can provide either HTML content (for formatted notes) or plain text
- Note IDs are returned from search results - use these IDs to get or update specific notes
- The search is limited to about 100 notes for performance reasons

**Example Usage:**
- User: "Search my notes for grocery list" → Call apple-notes-search with query: "grocery list"
- User: "Create a note with my shopping list" → Call apple-notes-create with text or content parameter
- User: "Find notes about meetings" → Call apple-notes-search with query: "meetings"
- User: "What's in my note with ID xyz?" → Call apple-notes-get-content with noteId: "xyz"
- User: "Update my shopping list note" → First search for the note, then call apple-notes-update with the noteId and new content
- User: "Create a note about [topic]" → Call apple-notes-create with appropriate content about the topic
`;

  const appleMapsCapabilities = `
## Apple Maps Integration Capabilities

You have access to Apple Maps functions that you can call directly. When users ask about maps, locations, directions, or navigation, you can use these function tools:

**Available Apple Maps Functions:**
- apple-maps-search: Search for a location in Apple Maps - requires "query" parameter (string)
- apple-maps-directions: Get directions between two locations - requires "destination" (string), optional "origin" (string, empty for current location), optional "mode" (d=driving, w=walking, r=transit, c=cycling)
- apple-maps-directions-home: Get directions to home - requires "homeAddress" (string), optional "mode" (d=driving, w=walking, r=transit, c=cycling)

**Important Notes:**
- These functions open Apple Maps app on macOS
- Transport modes: d (driving), w (walking), r (transit), c (cycling)
- If origin is not provided or is empty string, directions will use current location
- Search accepts addresses, building names, landmarks, etc.

**Example Usage:**
- User: "Search for Starbucks in New York" → Call apple-maps-search with query: "Starbucks New York"
- User: "Get directions to Central Park" → Call apple-maps-directions with destination: "Central Park"
- User: "How do I get from Times Square to Brooklyn Bridge?" → Call apple-maps-directions with origin: "Times Square", destination: "Brooklyn Bridge"
- User: "Directions home" → Call apple-maps-directions-home with homeAddress (user needs to provide their address)
- User: "Walk to [location]" → Call apple-maps-directions with destination and mode: "w"
`;

  const appleRemindersCapabilities = `
## Apple Reminders Integration Capabilities

You have access to Apple Reminders functions that you can call directly. When users ask about reminders, tasks, todos, or want to create/complete reminders, you can use these function tools:

**Available Apple Reminders Functions:**
- apple-reminders-create: Create a new reminder - requires "title" (string), optional "listName" (string), optional "dueDate" (ISO format string), optional "priority" (low/medium/high), optional "notes" (string)
- apple-reminders-list: List reminders - optional "listName" (string) to filter by list, optional "completed" (boolean, default false) to include completed reminders
- apple-reminders-complete: Mark a reminder as completed - requires "reminderId" (string)

**Important Notes:**
- These functions interact with the Apple Reminders app on macOS
- To complete a reminder, you need its ID from the list function
- Due dates should be in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
- Priority values: "low", "medium", or "high"
- Reminder IDs are returned from the list function

**Example Usage:**
- User: "Create a reminder to buy milk tomorrow" → Call apple-reminders-create with title: "Buy milk", dueDate: [tomorrow's date in ISO format]
- User: "Remind me to call Mom at 3pm" → Call apple-reminders-create with title: "Call Mom", dueDate: [today's date with 3pm time]
- User: "Show me my reminders" → Call apple-reminders-list
- User: "What reminders do I have in my Work list?" → Call apple-reminders-list with listName: "Work"
- User: "Complete reminder [id]" → Call apple-reminders-complete with reminderId from list results
- User: "Create a high priority reminder for [task]" → Call apple-reminders-create with title and priority: "high"
`;

  const appleStocksCapabilities = `
## Apple Stocks Integration Capabilities

You have access to Apple Stocks functions that you can call directly. When users ask about stocks, stock prices, tickers, or want to view stock information, you can use this function tool:

**Available Apple Stocks Functions:**
- apple-stocks-search: Search for a stock ticker and open it in Apple Stocks - requires "ticker" parameter (string, e.g., "AAPL", "GOOGL", "MSFT")

**Important Notes:**
- This function opens the Apple Stocks app on macOS or web browser
- Ticker symbols are typically uppercase (AAPL, GOOGL, MSFT, etc.)
- The function opens the stock in Apple Stocks but does not return price data
- Works for all stocks supported by Apple Stocks app

**Example Usage:**
- User: "Show me Apple stock" → Call apple-stocks-search with ticker: "AAPL"
- User: "Open Google stock" → Call apple-stocks-search with ticker: "GOOGL"
- User: "What's the price of Tesla?" → Call apple-stocks-search with ticker: "TSLA" (opens in app, price will be visible there)
- User: "Search for Microsoft stock" → Call apple-stocks-search with ticker: "MSFT"
`;

  const finderCapabilities = `
## Finder Integration Capabilities

You have access to Finder functions that you can call directly. When users ask about files, folders, creating files, opening files, or moving/copying files in Finder, you can use these function tools:

**Available Finder Functions:**
- finder-create-file: Create a file in the active Finder window - requires "filename" (string, e.g., "test.txt"), optional "autoOpen" (boolean) to automatically open the file
- finder-open-file: Open a file or folder in the default or specified application - requires "path" (string), optional "application" (string) to open with specific app
- finder-move-to-folder: Move selected Finder files to a destination folder - requires "destination" (string, folder path), optional "filePaths" (comma-separated string) or will use selected files in Finder
- finder-copy-to-folder: Copy selected Finder files to a destination folder - requires "destination" (string, folder path), optional "filePaths" (comma-separated string) or will use selected files in Finder

**Important Notes:**
- These functions interact with the Finder app on macOS
- For move/copy operations, if filePaths is not provided, the function will attempt to use files currently selected in Finder
- Paths can use ~ for home directory (e.g., "~/Documents/test.txt")
- The create-file function requires an active Finder window
- For open-file, if no application is specified, the system default will be used

**Example Usage:**
- User: "Create a file called test.txt in Finder" → Call finder-create-file with filename: "test.txt"
- User: "Open ~/Documents/myfile.txt" → Call finder-open-file with path: "~/Documents/myfile.txt"
- User: "Open myfile.txt with TextEdit" → Call finder-open-file with path: "myfile.txt", application: "TextEdit"
- User: "Move selected files to ~/Desktop" → Call finder-move-to-folder with destination: "~/Desktop" (will use selected files)
- User: "Copy file.txt to /Users/name/Documents" → Call finder-copy-to-folder with destination: "/Users/name/Documents", filePaths: "file.txt"
- User: "Create a new file called notes.md and open it" → Call finder-create-file with filename: "notes.md", autoOpen: true
`;

  const browserBookmarksCapabilities = `
## Browser Bookmarks Integration Capabilities

You have access to Browser Bookmarks functions that you can call directly. When users ask about bookmarks, want to search bookmarks, or open bookmarks, you can use these function tools:

**Available Browser Bookmarks Functions:**
- browser-bookmarks-search: Search for bookmarks in browsers - requires "query" (string), optional "browser" (safari, chrome, firefox, edge, brave, arc, vivaldi, or all)
- browser-bookmarks-open: Open a bookmark by URL - requires "url" (string), optional "browser" (string) to open in specific browser

**Important Notes:**
- These functions search bookmarks from Safari (via AppleScript) and Chrome-based browsers (via bookmarks file)
- Supported browsers: Safari, Chrome, Edge, Brave, Arc, Vivaldi
- If browser is not specified, searches all available browsers
- Bookmarks are searched by title and URL

**Example Usage:**
- User: "Search my bookmarks for github" → Call browser-bookmarks-search with query: "github"
- User: "Find bookmarks about React" → Call browser-bookmarks-search with query: "React"
- User: "Open bookmark https://example.com" → Call browser-bookmarks-open with url: "https://example.com"
- User: "Search Chrome bookmarks for work" → Call browser-bookmarks-search with query: "work", browser: "chrome"
`;

  const browserHistoryCapabilities = `
## Browser History Integration Capabilities

You have access to Browser History functions that you can call directly. When users ask about browser history, want to search history, or find previously visited pages, you can use these function tools:

**Available Browser History Functions:**
- browser-history-search: Search browser history - requires "query" (string), optional "browser" (safari, chrome, firefox, edge, brave, arc, vivaldi, or all), optional "limit" (number, default 20)

**Important Notes:**
- These functions search browser history from multiple browsers
- Supported browsers: Safari, Chrome, Edge, Brave, Arc, Vivaldi
- History search requires database access which may be limited
- If browser is not specified, searches all available browsers
- Results are limited by the limit parameter

**Example Usage:**
- User: "Search my browser history for github" → Call browser-history-search with query: "github"
- User: "What did I visit yesterday about React?" → Call browser-history-search with query: "React"
- User: "Show me my Chrome history for work" → Call browser-history-search with query: "work", browser: "chrome", limit: 10
`;

  const browserTabsCapabilities = `
## Browser Tabs Integration Capabilities

You have access to Browser Tabs functions that you can call directly. When users ask about open tabs, want to search tabs, or close tabs, you can use these function tools:

**Available Browser Tabs Functions:**
- browser-tabs-search: Search for open tabs in browsers - requires "query" (string), optional "browser" (safari, chrome, firefox, edge, brave, arc, vivaldi, or all)
- browser-tabs-close: Close a specific browser tab - requires "browser" (string), "windowId" (string), "tabIndex" (number)

**Important Notes:**
- These functions search and manage open tabs in browsers
- Safari tabs are accessible via AppleScript
- Chrome tabs can be managed via existing Chrome actions
- Tab search finds tabs by title and URL
- To close a tab, you need the window ID and tab index from search results

**Example Usage:**
- User: "Search my open tabs for github" → Call browser-tabs-search with query: "github"
- User: "What tabs do I have open about React?" → Call browser-tabs-search with query: "React"
- User: "Close tab in Safari window 1 tab 2" → Call browser-tabs-close with browser: "safari", windowId: "1", tabIndex: 2
`;

  const browserProfilesCapabilities = `
## Browser Profiles Integration Capabilities

You have access to Browser Profiles functions that you can call directly. When users ask about browser profiles, want to list profiles, or open a browser with a specific profile, you can use these function tools:

**Available Browser Profiles Functions:**
- browser-profiles-list: List available profiles for a browser - requires "browser" (chrome, firefox, edge, brave, etc.)
- browser-profiles-open: Open a browser with a specific profile - requires "browser" (string), "profile" (string, profile name or path)

**Important Notes:**
- These functions work with Chrome-based browsers (Chrome, Edge, Brave, Arc, Vivaldi) and Firefox
- Profiles are detected by scanning browser application support directories
- Profile names are extracted from browser profile directories
- Opening a profile launches the browser with that specific profile

**Example Usage:**
- User: "List Chrome profiles" → Call browser-profiles-list with browser: "chrome"
- User: "Show me Firefox profiles" → Call browser-profiles-list with browser: "firefox"
- User: "Open Chrome with profile Work" → Call browser-profiles-open with browser: "chrome", profile: "Work"
- User: "Launch Firefox profile Personal" → Call browser-profiles-open with browser: "firefox", profile: "Personal"
`;

  const exaSearchCapabilities = `
## Exa Web Search Capabilities

You have access to Exa web search, a neural search engine built for AI. When users ask about current events, latest information, recent developments, or need to search the web, you can use this function tool:

**Available Exa Search Functions:**
- exa-websearch: Search the web using Exa's neural search technology - requires "query" (string)

**Important Notes:**
- Exa uses neural search to understand the meaning of queries, not just keywords
- Returns up to 5 high-quality results with URLs, titles, and text content
- Best for finding current information, recent developments, and research
- Always cite sources by mentioning the URLs and titles from search results
- Use this when users ask about: latest news, recent events, current information, research topics, or "search for..."

**Example Usage:**
- User: "What's the latest news about AI?" → Call exa-websearch with query: "latest AI news"
- User: "Search for recent developments in quantum computing" → Call exa-websearch with query: "recent quantum computing developments"
- User: "What are the latest features in React 19?" → Call exa-websearch with query: "React 19 latest features"
- User: "Find information about James Webb Space Telescope" → Call exa-websearch with query: "James Webb Space Telescope discoveries"
- User: "What's happening with climate change?" → Call exa-websearch with query: "climate change latest news"

**Response Format:**
- Always list the sources with their titles and URLs
- Summarize the key information from the search results
- Cite specific sources when mentioning facts
`;

  return `${spotifyCapabilities}\n\n${appleNotesCapabilities}\n\n${appleMapsCapabilities}\n\n${appleRemindersCapabilities}\n\n${appleStocksCapabilities}\n\n${finderCapabilities}\n\n${browserBookmarksCapabilities}\n\n${browserHistoryCapabilities}\n\n${browserTabsCapabilities}\n\n${browserProfilesCapabilities}\n\n${exaSearchCapabilities}\n\nUser query: ${basePrompt}`;
}

export interface ConversationHistory {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export async function streamGeminiResponse(
  prompt: string,
  options: GeminiStreamOptions,
  conversationHistory?: ConversationHistory[],
): Promise<void> {
  if (!geminiClient) {
    throw new Error("Gemini client not initialized. Call initializeGemini first.");
  }

  // Build enhanced prompt with Spotify capabilities
  const enhancedPrompt = buildSystemPrompt(prompt);

  // Get available actions for function calling (needed for fallback)
  const actions = getAllActions();
  console.log("🛠️ [Gemini] Available actions/tools:", actions.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    parameters: a.parameters?.map(p => ({ name: p.name, type: p.type, required: p.required })),
  })));

  const functionDeclarations = actions.map((action) => {
    const properties: Record<string, { type: SchemaType; description?: string }> = {};

    if (action.parameters) {
      for (const param of action.parameters) {
        let paramType: SchemaType = SchemaType.STRING;
        if (param.type === "number") {
          paramType = SchemaType.NUMBER;
        } else if (param.type === "boolean") {
          paramType = SchemaType.BOOLEAN;
        }

        properties[param.name] = {
          type: paramType,
          description: param.description,
        } as any; // Type assertion needed due to complex Schema union types
      }
    }

    return {
      name: action.id,
      description: action.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties,
        required: action.parameters?.filter((p) => p.required).map((p) => p.name) || [],
      },
    };
  });

  try {
    // Use gemini-2.5-flash - latest stable model with enhanced capabilities
    // Supports: function calling, streaming, batch API, caching, code execution
    // Token limits: 1,048,576 input, 65,536 output
    // Model identifier: gemini-2.5-flash (stable release)
    const model = geminiClient.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Configure chat with function calling tools
    // According to latest API docs, tools should be an array of FunctionDeclarationsTool objects
    const tools = functionDeclarations.length > 0 ? [{ functionDeclarations }] as any : undefined;
    console.log("🔌 [Gemini] Configuring chat with tools:", {
      toolCount: functionDeclarations.length,
      functionNames: functionDeclarations.map(f => f.name),
    });

    const chat = model.startChat({
      tools,
      history: conversationHistory || [],
    });

    // Use sendMessageStream which maps to streamGenerateContent endpoint
    // This uses Server-Sent Events (SSE) for streaming responses
    console.log("📨 [Gemini] Sending prompt to Gemini:", {
      promptLength: enhancedPrompt.length,
      promptPreview: enhancedPrompt.substring(0, 100) + (enhancedPrompt.length > 100 ? "..." : ""),
      model: "gemini-2.5-flash",
    });

    const result = await chat.sendMessageStream(enhancedPrompt);

    let fullText = "";
    let proposedAction: { actionId: string; parameters?: Record<string, string | number | boolean> } | undefined;

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        options.onChunk({
          text: chunkText,
          isComplete: false,
        });
      }

      // Check for function calls (action proposals)
      const functionCalls = chunk.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        const functionCall = functionCalls[0];
        proposedAction = {
          actionId: functionCall.name,
          parameters: functionCall.args as Record<string, string | number | boolean>,
        };

        // Log the function call request from Gemini
        console.log("🔧 [Gemini] Function call detected:", {
          actionId: functionCall.name,
          parameters: functionCall.args,
          fullFunctionCall: functionCall,
        });

        // Send the action proposal
        options.onChunk({
          text: "",
          isComplete: false,
          proposedAction,
        });
      }
    }

    // Signal completion
    options.onChunk({
      text: "",
      isComplete: true,
      proposedAction,
    });

    options.onComplete?.();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Log error details for debugging
    console.error("Gemini API Error:", {
      message: err.message,
      name: err.name,
    });

    options.onError?.(err);
    throw err;
  }
}

export async function getGeminiResponse(prompt: string): Promise<string> {
  if (!geminiClient) {
    throw new Error("Gemini client not initialized. Call initializeGemini first.");
  }

  // Use gemini-2.5-flash for non-streaming requests (latest stable model)
  const model = geminiClient.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

