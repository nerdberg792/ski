import type { Action } from "@/types/actions";

// Action registry - stores all available actions
const actionsRegistry: Map<string, Action> = new Map();

const systemActions: Action[] = [
  {
    id: "open-app",
    name: "Open Application",
    description: "Opens a specified application on macOS",
    scriptPath: "scripts/open-app.applescript",
    parameters: [
      {
        name: "appName",
        type: "string",
        description: "Name of the application to open",
        required: true,
      },
    ],
    category: "system",
  },
  {
    id: "set-volume",
    name: "Set Volume",
    description: "Sets the system volume to a specified level",
    scriptPath: "scripts/set-volume.applescript",
    parameters: [
      {
        name: "level",
        type: "number",
        description: "Volume level (0-100)",
        required: true,
      },
    ],
    category: "system",
  },
  {
    id: "toggle-do-not-disturb",
    name: "Toggle Do Not Disturb",
    description: "Toggles macOS Do Not Disturb mode",
    scriptPath: "scripts/toggle-dnd.applescript",
    category: "system",
  },
];

const chromeActions: Action[] = [
  {
    id: "chrome-get-open-tabs",
    name: "List Chrome Tabs",
    description: "Returns a JSON list of all open Google Chrome tabs",
    scriptPath: "scripts/chrome/get-open-tabs.applescript",
    parameters: [
      {
        name: "useOriginalFavicon",
        type: "boolean",
        description: "Attempt to capture each tab's favicon (slower)",
        default: false,
      },
    ],
    category: "browser",
  },
  {
    id: "chrome-open-tab",
    name: "Open Chrome Tab",
    description: "Opens a new Chrome tab with a URL or search query",
    scriptPath: "scripts/chrome/open-new-tab.applescript",
    parameters: [
      {
        name: "url",
        type: "string",
        description: "URL to open (takes precedence over search query)",
      },
      {
        name: "query",
        type: "string",
        description: "Google search query when URL is not provided",
      },
      {
        name: "profileMode",
        type: "string",
        description: "Where to open the tab: Default, ProfileCurrent, ProfileOriginal",
        default: "Default",
      },
      {
        name: "profileCurrent",
        type: "string",
        description: "Chrome profile directory for the current profile option",
      },
      {
        name: "profileOriginal",
        type: "string",
        description: "Chrome profile directory for the original profile option",
      },
    ],
    category: "browser",
  },
  {
    id: "chrome-focus-tab",
    name: "Focus Chrome Tab",
    description: "Brings a specific Chrome tab to the foreground",
    scriptPath: "scripts/chrome/focus-tab.applescript",
    parameters: [
      {
        name: "windowId",
        type: "string",
        description: "Chrome window identifier",
        required: true,
      },
      {
        name: "tabIndex",
        type: "number",
        description: "Tab index within the window (1-based)",
        required: true,
      },
    ],
    category: "browser",
  },
  {
    id: "chrome-close-tab",
    name: "Close Chrome Tab",
    description: "Closes a specific Chrome tab",
    scriptPath: "scripts/chrome/close-tab.applescript",
    parameters: [
      {
        name: "windowId",
        type: "string",
        description: "Chrome window identifier",
        required: true,
      },
      {
        name: "tabIndex",
        type: "number",
        description: "Tab index within the window (1-based)",
        required: true,
      },
    ],
    category: "browser",
  },
  {
    id: "chrome-reload-tab",
    name: "Reload Chrome Tab",
    description: "Reloads a specific Chrome tab",
    scriptPath: "scripts/chrome/reload-tab.applescript",
    parameters: [
      {
        name: "windowId",
        type: "string",
        description: "Chrome window identifier",
        required: true,
      },
      {
        name: "tabIndex",
        type: "number",
        description: "Tab index within the window (1-based)",
        required: true,
      },
    ],
    category: "browser",
  },
  {
    id: "chrome-create-window",
    name: "New Chrome Window",
    description: "Creates a new blank Chrome window",
    scriptPath: "scripts/chrome/create-new-window.applescript",
    category: "browser",
  },
  {
    id: "chrome-create-window-to-website",
    name: "Chrome Window to Website",
    description: "Opens a new Chrome window and navigates to a URL",
    scriptPath: "scripts/chrome/create-new-window-website.applescript",
    parameters: [
      {
        name: "website",
        type: "string",
        description: "URL to open in the new window",
        required: true,
      },
    ],
    category: "browser",
  },
  {
    id: "chrome-create-tab",
    name: "New Chrome Tab",
    description: "Creates a blank tab in the first Chrome window",
    scriptPath: "scripts/chrome/create-new-tab.applescript",
    category: "browser",
  },
  {
    id: "chrome-create-tab-to-website",
    name: "Chrome Tab to Website",
    description: "Opens a website in the first Chrome window",
    scriptPath: "scripts/chrome/create-new-tab-website.applescript",
    parameters: [
      {
        name: "website",
        type: "string",
        description: "URL to open",
        required: true,
      },
    ],
    category: "browser",
  },
  {
    id: "chrome-create-incognito-window",
    name: "New Incognito Window",
    description: "Creates a new incognito Chrome window",
    scriptPath: "scripts/chrome/create-incognito-window.applescript",
    category: "browser",
  },
];

const spotifyActions: Action[] = [
  {
    id: "spotify-play",
    name: "Play Spotify",
    description: "Resume or start playback on the active Spotify device",
    category: "spotify",
    // No scriptPath - handled via Spotify API
  },
  {
    id: "spotify-pause",
    name: "Pause Spotify",
    description: "Pause playback on the active Spotify device",
    category: "spotify",
  },
  {
    id: "spotify-toggle-play",
    name: "Toggle Spotify Play/Pause",
    description: "Toggle between play and pause on the active Spotify device",
    category: "spotify",
  },
  {
    id: "spotify-next",
    name: "Next Track",
    description: "Skip to the next track in Spotify",
    category: "spotify",
  },
  {
    id: "spotify-previous",
    name: "Previous Track",
    description: "Go back to the previous track in Spotify",
    category: "spotify",
  },
  {
    id: "spotify-set-volume",
    name: "Set Spotify Volume",
    description: "Set the volume level for Spotify playback (0-100)",
    parameters: [
      {
        name: "level",
        type: "number",
        description: "Volume level (0-100)",
        required: true,
      },
    ],
    category: "spotify",
  },
  {
    id: "spotify-search",
    name: "Search Spotify",
    description: "Search for tracks, albums, artists, playlists, shows, or episodes on Spotify",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query",
        required: true,
      },
      {
        name: "category",
        type: "string",
        description: "Category to search: tracks, albums, artists, playlists, shows, episodes, or all",
        required: false,
      },
    ],
    category: "spotify",
  },
  {
    id: "spotify-play-track",
    name: "Play Spotify Track",
    description: "Play a specific track, album, or playlist by URI",
    parameters: [
      {
        name: "uri",
        type: "string",
        description: "Spotify URI (e.g., spotify:track:4iV5W9uYEdYUVa79Axb7Rh)",
        required: true,
      },
    ],
    category: "spotify",
  },
];

const appleNotesActions: Action[] = [
  {
    id: "apple-notes-search",
    name: "Search Apple Notes",
    description: "Search for notes in Apple Notes by title, content, folder, or tags",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query",
        required: true,
      },
    ],
    category: "apple-notes",
    // No scriptPath - handled via Apple Notes API
  },
  {
    id: "apple-notes-create",
    name: "Create Apple Note",
    description: "Create a new note in Apple Notes",
    parameters: [
      {
        name: "content",
        type: "string",
        description: "Content of the note (HTML format)",
        required: false,
      },
      {
        name: "text",
        type: "string",
        description: "Plain text content (alternative to content)",
        required: false,
      },
    ],
    category: "apple-notes",
  },
  {
    id: "apple-notes-get-content",
    name: "Get Apple Note Content",
    description: "Get the content of a specific note by ID",
    parameters: [
      {
        name: "noteId",
        type: "string",
        description: "The ID of the note to retrieve",
        required: true,
      },
    ],
    category: "apple-notes",
  },
  {
    id: "apple-notes-update",
    name: "Update Apple Note",
    description: "Update the content of a specific note",
    parameters: [
      {
        name: "noteId",
        type: "string",
        description: "The ID of the note to update",
        required: true,
      },
      {
        name: "content",
        type: "string",
        description: "New content of the note (HTML format)",
        required: true,
      },
    ],
    category: "apple-notes",
  },
];

const appleMapsActions: Action[] = [
  {
    id: "apple-maps-search",
    name: "Search Apple Maps",
    description: "Search for a location in Apple Maps",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Location to search for (address, building name, etc.)",
        required: true,
      },
    ],
    category: "apple-maps",
  },
  {
    id: "apple-maps-directions",
    name: "Get Apple Maps Directions",
    description: "Get directions between two locations in Apple Maps",
    parameters: [
      {
        name: "destination",
        type: "string",
        description: "Destination address or location",
        required: true,
      },
      {
        name: "origin",
        type: "string",
        description: "Origin address or location (empty string for current location)",
        required: false,
      },
      {
        name: "mode",
        type: "string",
        description: "Transport mode: d (driving), w (walking), r (transit), c (cycling)",
        required: false,
        default: "d",
      },
    ],
    category: "apple-maps",
  },
  {
    id: "apple-maps-directions-home",
    name: "Get Directions Home",
    description: "Get directions to home in Apple Maps",
    parameters: [
      {
        name: "homeAddress",
        type: "string",
        description: "Home address",
        required: true,
      },
      {
        name: "mode",
        type: "string",
        description: "Transport mode: d (driving), w (walking), r (transit), c (cycling)",
        required: false,
        default: "d",
      },
    ],
    category: "apple-maps",
  },
];

const appleRemindersActions: Action[] = [
  {
    id: "apple-reminders-create",
    name: "Create Apple Reminder",
    description: "Create a new reminder in Apple Reminders",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "Reminder title/text",
        required: true,
      },
      {
        name: "listName",
        type: "string",
        description: "Name of the reminder list",
        required: false,
      },
      {
        name: "dueDate",
        type: "string",
        description: "Due date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)",
        required: false,
      },
      {
        name: "priority",
        type: "string",
        description: "Priority: low, medium, high",
        required: false,
      },
      {
        name: "notes",
        type: "string",
        description: "Additional notes for the reminder",
        required: false,
      },
    ],
    category: "apple-reminders",
  },
  {
    id: "apple-reminders-list",
    name: "List Apple Reminders",
    description: "List reminders from Apple Reminders",
    parameters: [
      {
        name: "listName",
        type: "string",
        description: "Filter by list name",
        required: false,
      },
      {
        name: "completed",
        type: "boolean",
        description: "Include completed reminders",
        required: false,
        default: false,
      },
    ],
    category: "apple-reminders",
  },
  {
    id: "apple-reminders-complete",
    name: "Complete Apple Reminder",
    description: "Mark a reminder as completed",
    parameters: [
      {
        name: "reminderId",
        type: "string",
        description: "The ID of the reminder to complete",
        required: true,
      },
    ],
    category: "apple-reminders",
  },
];

const appleStocksActions: Action[] = [
  {
    id: "apple-stocks-search",
    name: "Search Apple Stocks",
    description: "Search for a stock ticker and open it in Apple Stocks",
    parameters: [
      {
        name: "ticker",
        type: "string",
        description: "Stock ticker symbol (e.g., AAPL, GOOGL, MSFT)",
        required: true,
      },
    ],
    category: "apple-stocks",
  },
];

const finderUtilsActions: Action[] = [
  {
    id: "finder-create-file",
    name: "Create File in Finder",
    description: "Create a file in the active Finder window",
    parameters: [
      {
        name: "filename",
        type: "string",
        description: "Name of the file to create (e.g., 'test.txt')",
        required: true,
      },
      {
        name: "autoOpen",
        type: "boolean",
        description: "Automatically open the file after creation",
        required: false,
        default: false,
      },
    ],
    category: "finder",
  },
  {
    id: "finder-open-file",
    name: "Open File/Folder",
    description: "Open a file or folder in the default or specified application",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "Path to the file or folder to open",
        required: true,
      },
      {
        name: "application",
        type: "string",
        description: "Application name to open with (optional, uses default if not specified)",
        required: false,
      },
    ],
    category: "finder",
  },
];

const finderFileActionsActions: Action[] = [
  {
    id: "finder-move-to-folder",
    name: "Move Files to Folder",
    description: "Move selected Finder files to a destination folder",
    parameters: [
      {
        name: "destination",
        type: "string",
        description: "Destination folder path",
        required: true,
      },
      {
        name: "filePaths",
        type: "string",
        description: "Comma-separated list of file paths to move (optional, uses selected files if not provided)",
        required: false,
      },
    ],
    category: "finder",
  },
  {
    id: "finder-copy-to-folder",
    name: "Copy Files to Folder",
    description: "Copy selected Finder files to a destination folder",
    parameters: [
      {
        name: "destination",
        type: "string",
        description: "Destination folder path",
        required: true,
      },
      {
        name: "filePaths",
        type: "string",
        description: "Comma-separated list of file paths to copy (optional, uses selected files if not provided)",
        required: false,
      },
    ],
    category: "finder",
  },
];

const browserBookmarksActions: Action[] = [
  {
    id: "browser-bookmarks-search",
    name: "Search Browser Bookmarks",
    description: "Search for bookmarks in browsers",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query for bookmarks",
        required: true,
      },
      {
        name: "browser",
        type: "string",
        description: "Browser to search (safari, chrome, firefox, edge, brave, arc, vivaldi, or all)",
        required: false,
        default: "all",
      },
    ],
    category: "browser-bookmarks",
  },
  {
    id: "browser-bookmarks-open",
    name: "Open Browser Bookmark",
    description: "Open a bookmark by URL",
    parameters: [
      {
        name: "url",
        type: "string",
        description: "URL of the bookmark to open",
        required: true,
      },
      {
        name: "browser",
        type: "string",
        description: "Browser to open in (optional, uses default if not specified)",
        required: false,
      },
    ],
    category: "browser-bookmarks",
  },
];

const browserHistoryActions: Action[] = [
  {
    id: "browser-history-search",
    name: "Search Browser History",
    description: "Search browser history",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query for history",
        required: true,
      },
      {
        name: "browser",
        type: "string",
        description: "Browser to search (safari, chrome, firefox, edge, brave, arc, vivaldi, or all)",
        required: false,
        default: "all",
      },
      {
        name: "limit",
        type: "number",
        description: "Maximum number of results to return",
        required: false,
        default: 20,
      },
    ],
    category: "browser-history",
  },
];

const browserTabsActions: Action[] = [
  {
    id: "browser-tabs-search",
    name: "Search Browser Tabs",
    description: "Search for open tabs in browsers",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query for tabs",
        required: true,
      },
      {
        name: "browser",
        type: "string",
        description: "Browser to search (safari, chrome, firefox, edge, brave, arc, vivaldi, or all)",
        required: false,
        default: "all",
      },
    ],
    category: "browser-tabs",
  },
  {
    id: "browser-tabs-close",
    name: "Close Browser Tab",
    description: "Close a specific browser tab",
    parameters: [
      {
        name: "browser",
        type: "string",
        description: "Browser (chrome, safari, edge, etc.)",
        required: true,
      },
      {
        name: "windowId",
        type: "string",
        description: "Window identifier",
        required: true,
      },
      {
        name: "tabIndex",
        type: "number",
        description: "Tab index (1-based)",
        required: true,
      },
    ],
    category: "browser-tabs",
  },
];

const browserProfilesActions: Action[] = [
  {
    id: "browser-profiles-list",
    name: "List Browser Profiles",
    description: "List available profiles for a browser",
    parameters: [
      {
        name: "browser",
        type: "string",
        description: "Browser to list profiles for (chrome, firefox, edge, brave, etc.)",
        required: true,
      },
    ],
    category: "browser-profiles",
  },
  {
    id: "browser-profiles-open",
    name: "Open Browser Profile",
    description: "Open a browser with a specific profile",
    parameters: [
      {
        name: "browser",
        type: "string",
        description: "Browser to open (chrome, firefox, edge, brave, etc.)",
        required: true,
      },
      {
        name: "profile",
        type: "string",
        description: "Profile name or path",
        required: true,
      },
    ],
    category: "browser-profiles",
  },
];

const registeredActions: Action[] = [
  ...systemActions,
  ...chromeActions,
  ...spotifyActions,
  ...appleNotesActions,
  ...appleMapsActions,
  ...appleRemindersActions,
  ...appleStocksActions,
  ...finderUtilsActions,
  ...finderFileActionsActions,
  ...browserBookmarksActions,
  ...browserHistoryActions,
  ...browserTabsActions,
  ...browserProfilesActions,
];

// Initialize with available actions
export function initializeActions(): void {
  registeredActions.forEach((action) => {
    actionsRegistry.set(action.id, action);
  });
}

export function getAction(id: string): Action | undefined {
  return actionsRegistry.get(id);
}

export function getAllActions(): Action[] {
  return Array.from(actionsRegistry.values());
}

export function getActionsByCategory(category: string): Action[] {
  return Array.from(actionsRegistry.values()).filter(
    (action) => action.category === category,
  );
}

// Search actions by name or description
export function searchActions(query: string): Action[] {
  const lowerQuery = query.toLowerCase();
  return Array.from(actionsRegistry.values()).filter(
    (action) =>
      action.name.toLowerCase().includes(lowerQuery) ||
      action.description.toLowerCase().includes(lowerQuery),
  );
}

// Initialize actions on module load
initializeActions();

export function applyActionDefaults(
  action: Action,
  provided?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  const normalized: Record<string, string | number | boolean> = { ...(provided ?? {}) };

  if (!action.parameters) {
    return normalized;
  }

  for (const param of action.parameters) {
    if (normalized[param.name] === undefined && param.default !== undefined) {
      normalized[param.name] = param.default;
    }
  }

  return normalized;
}

