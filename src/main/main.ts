import { app, BrowserWindow, globalShortcut, ipcMain, nativeTheme, screen, shell } from "electron";
import path from "node:path";
import { exec } from "child_process";
import { promisify } from "util";
import { executeAction } from "./actions";
import type { ActionExecution } from "../renderer/types/actions";
import { SpotifyAuthManager } from "./spotify-auth";
import { SpotifyApiClient } from "./spotify-api";
import { buildScriptEnsuringSpotifyIsRunning } from "./spotify-helpers";
import * as spotify from "./spotify";
import * as appleNotes from "./apple-notes";
import * as appleMaps from "./apple-maps";
import * as appleReminders from "./apple-reminders";
import * as appleStocks from "./apple-stocks";
import * as finder from "./finder";
import * as browserBookmarks from "./browser-bookmarks";
import * as browserHistory from "./browser-history";
import * as browserTabs from "./browser-tabs";
import * as browserProfiles from "./browser-profiles";
import type {
  SpotifyAuthStatus,
  SpotifyPlaybackCommand,
  SpotifyPlaybackState,
  SpotifyPlaybackRequest,
  SpotifySearchCategory,
} from "../types/spotify";

const execAsync = promisify(exec);

const isMac = process.platform === "darwin";

let overlayWindow: BrowserWindow | null = null;
let isWindowReady = false;
let isQuitting = false;
let spotifyManager: SpotifyAuthManager | null = null;
let spotifyApi: SpotifyApiClient | null = null;

const COMPACT_SIZE = { width: 600, height: 50 };
const EXPANDED_SIZE = { width: 720, height: 520 };

function getDefaultPosition() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  return {
    x: width - EXPANDED_SIZE.width - 20,
    y: 100,
  };
}

function safeSend(channel: string, ...args: unknown[]) {
  if (!overlayWindow || overlayWindow.isDestroyed() || !isWindowReady) return;
  try {
    const webContents = overlayWindow.webContents;
    if (webContents && !webContents.isDestroyed()) {
      webContents.send(channel, ...args);
    }
  } catch (error) {
    // Silently ignore errors when frame is disposed
  }
}

function createOverlayWindow(): Promise<BrowserWindow> {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    return Promise.resolve(overlayWindow);
  }

  isWindowReady = false;
  const defaultPos = getDefaultPosition();

  overlayWindow = new BrowserWindow({
    width: COMPACT_SIZE.width,
    height: COMPACT_SIZE.height,
    x: defaultPos.x,
    y: defaultPos.y,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    roundedCorners: true,
    hasShadow: false,
    fullscreenable: false,
    focusable: true,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setAlwaysOnTop(true, "floating");

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  return new Promise((resolve) => {
    overlayWindow!.on("blur", () => {
      safeSend("sky:blur");
    });

    overlayWindow!.on("closed", () => {
      overlayWindow = null;
      isWindowReady = false;
    });

    overlayWindow!.on("moved", () => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        const [x, y] = overlayWindow.getPosition();
        safeSend("sky:position", { x, y });
      }
    });

    overlayWindow!.webContents.once("did-finish-load", () => {
      isWindowReady = true;
      safeSend("sky:expanded", false);
      safeSend("sky:visibility", true);
      resolve(overlayWindow!);
    });

    if (devServerUrl) {
      overlayWindow!.loadURL(devServerUrl);
    } else {
      overlayWindow!.loadFile(path.join(__dirname, "../dist/renderer/index.html"));
    }
  });
}

async function toggleOverlay(force?: boolean) {
  if (isQuitting) return;

  if (!overlayWindow || overlayWindow.isDestroyed()) {
    await createOverlayWindow();
  }
  if (!overlayWindow || isQuitting) return;

  // Wait for window to be ready if it was just created
  if (!isWindowReady) {
    await new Promise<void>((resolve) => {
      const checkReady = () => {
        if (isWindowReady || isQuitting) {
          resolve();
        } else {
          setTimeout(checkReady, 50);
        }
      };
      checkReady();
    });
  }

  if (isQuitting || !overlayWindow) return;

  const shouldShow = force ?? !overlayWindow.isVisible();
  if (shouldShow) {
    overlayWindow.showInactive();
    overlayWindow.focus();
    safeSend("sky:visibility", true);
  } else {
    overlayWindow.hide();
    safeSend("sky:visibility", false);
  }
}

function setWindowSize(size: { width: number; height: number }, animated = true) {
  if (!overlayWindow) return;

  const [x, y] = overlayWindow.getPosition();
  const currentSize = overlayWindow.getSize();

  // When expanding, position below the compact widget
  // When collapsing, keep the same top position
  let newX = x;
  let newY = y;

  if (size.width === EXPANDED_SIZE.width && size.height === EXPANDED_SIZE.height) {
    // Expanding: position below, centered horizontally
    newX = Math.max(0, x - (EXPANDED_SIZE.width - COMPACT_SIZE.width) / 2);
    newY = y + COMPACT_SIZE.height + 10; // 10px gap below compact widget
  } else {
    // Collapsing: adjust horizontally to center, keep top position
    newX = x + (currentSize[0] - COMPACT_SIZE.width) / 2;
    newY = y;
  }

  // Ensure window stays within screen bounds
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  newX = Math.max(0, Math.min(newX, screenWidth - size.width));
  newY = Math.max(0, Math.min(newY, screenHeight - size.height));

  overlayWindow.setBounds({
    x: newX,
    y: newY,
    width: size.width,
    height: size.height,
  }, animated);
}

function registerShortcuts() {
  globalShortcut.register(isMac ? "Command+K" : "Control+K", () => toggleOverlay());
}

app.whenReady().then(async () => {
  nativeTheme.themeSource = "dark";

  // Load environment variables BEFORE creating window
  const dotenv = require("dotenv");
  const result = dotenv.config();

  if (result.error) {
    console.error("Error loading .env file:", result.error);
  } else {
    console.log("Environment variables loaded");
  }

  // Debug: log if API key is found
  if (process.env.GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY found:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");
  } else {
    console.warn("GEMINI_API_KEY not found in environment variables");
  }

  const spotifyConfig = {
    clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
    redirectUri: process.env.SPOTIFY_REDIRECT_URI ?? "",
  };

  if (spotifyConfig.clientId && spotifyConfig.redirectUri) {
    spotifyManager = new SpotifyAuthManager({
      clientId: spotifyConfig.clientId,
      clientSecret: spotifyConfig.clientSecret,
      redirectUri: spotifyConfig.redirectUri,
    });
    spotifyManager.on("auth-updated", (payload: SpotifyAuthStatus) => {
      safeSend("spotify:auth", payload);
    });
    spotifyManager.on("playback-updated", (state: SpotifyPlaybackState | null) => {
      safeSend("spotify:playback", state);
    });
    spotifyManager.on("auth-error", (message: string) => {
      safeSend("spotify:error", message);
    });
    await spotifyManager.initialize();
    spotifyApi = new SpotifyApiClient(spotifyManager);
  }

  await createOverlayWindow();
  if (overlayWindow) {
    overlayWindow.showInactive();
  }
  registerShortcuts();

  ipcMain.handle("sky:toggle", (_, payload: { visible?: boolean }) => {
    toggleOverlay(payload.visible);
  });

  ipcMain.handle("sky:getApiKey", () => {
    const key = process.env.GEMINI_API_KEY || null;
    console.log("getApiKey called, returning:", key ? key.substring(0, 10) + "..." : "null");
    return key;
  });

  ipcMain.handle("sky:expand", () => {
    setWindowSize(EXPANDED_SIZE);
    // Keep transparent but visible when expanded
    if (overlayWindow) {
      overlayWindow.setBackgroundColor("#00000000"); // Fully transparent
      overlayWindow.setOpacity(1.0); // Full opacity - blur handled by CSS
    }
    safeSend("sky:expanded", true);
  });

  ipcMain.handle("sky:collapse", () => {
    setWindowSize(COMPACT_SIZE);
    // Restore transparency when collapsed
    if (overlayWindow) {
      overlayWindow.setBackgroundColor("#00000000");
      overlayWindow.setOpacity(1.0);
    }
    safeSend("sky:expanded", false);
  });

  ipcMain.handle("sky:setPosition", (_, payload: { x: number; y: number }) => {
    if (overlayWindow) {
      overlayWindow.setPosition(payload.x, payload.y);
    }
  });

  ipcMain.handle("sky:executeAction", async (_, payload: { execution: ActionExecution; scriptPath: string }) => {
    return executeAction(payload.execution, { scriptPath: payload.scriptPath });
  });

  ipcMain.handle("spotify:getStatus", () => {
    return spotifyManager?.getAuthState() ?? { connected: false };
  });

  ipcMain.handle("spotify:startAuth", async () => {
    if (!spotifyManager) {
      throw new Error("Spotify is not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI.");
    }
    return spotifyManager.beginAuth();
  });

  ipcMain.handle("spotify:disconnect", async () => {
    await spotifyManager?.disconnect();
    return spotifyManager?.getAuthState() ?? { connected: false };
  });

  ipcMain.handle("spotify:refreshPlayback", async () => {
    return spotifyManager?.fetchPlaybackState() ?? null;
  });

  ipcMain.handle("spotify:playbackCommand", async (_, command: SpotifyPlaybackCommand) => {
    if (!spotifyManager) {
      throw new Error("Spotify is not configured.");
    }
    return spotifyManager.controlPlayback(command);
  });

  ipcMain.handle(
    "spotify:search",
    async (_, payload: { query: string; categories?: SpotifySearchCategory[] }) => {
      if (!spotifyApi) {
        throw new Error("Spotify is not configured.");
      }
      return spotifyApi.search(payload.query, payload.categories);
    },
  );

  ipcMain.handle("spotify:getLibrary", async () => {
    if (!spotifyApi) {
      throw new Error("Spotify is not configured.");
    }
    return spotifyApi.getLibrary();
  });

  ipcMain.handle("spotify:playUri", async (_, payload: SpotifyPlaybackRequest) => {
    if (!spotifyApi) {
      throw new Error("Spotify is not configured.");
    }
    return spotifyApi.play(payload);
  });

  ipcMain.handle("spotify:queueUri", async (_, payload: { uri: string }) => {
    if (!spotifyApi) {
      throw new Error("Spotify is not configured.");
    }
    return spotifyApi.queue(payload.uri);
  });

  ipcMain.handle("spotify:setTrackSaved", async (_, payload: { trackId: string; saved: boolean }) => {
    if (!spotifyApi) {
      throw new Error("Spotify is not configured.");
    }
    return spotifyApi.setTrackSaved(payload.trackId, payload.saved);
  });

  ipcMain.handle("spotify:setAlbumSaved", async (_, payload: { albumId: string; saved: boolean }) => {
    if (!spotifyApi) {
      throw new Error("Spotify is not configured.");
    }
    return spotifyApi.setAlbumSaved(payload.albumId, payload.saved);
  });

  ipcMain.handle("spotify:anonymizeTrack", async () => {
    try {
      const script = buildScriptEnsuringSpotifyIsRunning(`
        set spotifyURL to spotify url of the current track
        set AppleScript's text item delimiters to ":"
        set idPart to third text item of spotifyURL
        return ("https://open.spoqify.com/track/" & idPart)
      `);

      const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
      const anonymizedUrl = stdout.trim();

      if (anonymizedUrl) {
        await shell.openExternal(anonymizedUrl);
        return { success: true, url: anonymizedUrl };
      }

      throw new Error("Failed to get track URL");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("spotify:openUrlInSpotify", async () => {
    try {
      // Get URL from active Chrome tab
      const getUrlScript = `
        tell application "Google Chrome"
          activate
          set theURL to URL of active tab of first window
          return theURL
        end tell
      `;

      const { stdout } = await execAsync(`osascript -e '${getUrlScript.replace(/'/g, "'\\''")}'`);
      const theURL = stdout.trim();

      if (!theURL) {
        throw new Error("No URL found in active Chrome tab");
      }

      // Open URL in Spotify
      const openScript = buildScriptEnsuringSpotifyIsRunning(`
        activate
        open location "${theURL}"
      `);

      await execAsync(`osascript -e '${openScript.replace(/'/g, "'\\''")}'`);
      return { success: true, url: theURL };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Comprehensive Spotify Actions IPC handlers
  ipcMain.handle("spotify:getCurrentTrack", async () => {
    return await spotify.getCurrentTrack();
  });

  ipcMain.handle("spotify:togglePlayPause", async () => {
    return await spotify.togglePlayPause();
  });

  ipcMain.handle("spotify:play", async () => {
    return await spotify.play();
  });

  ipcMain.handle("spotify:pause", async () => {
    return await spotify.pause();
  });

  ipcMain.handle("spotify:nextTrack", async () => {
    return await spotify.nextTrack();
  });

  ipcMain.handle("spotify:previousTrack", async () => {
    return await spotify.previousTrack();
  });

  ipcMain.handle("spotify:setVolume", async (_, payload: { level: number }) => {
    return await spotify.setVolume(payload.level);
  });

  ipcMain.handle("spotify:increaseVolume", async (_, payload: { step?: number }) => {
    return await spotify.increaseVolume(payload.step);
  });

  ipcMain.handle("spotify:decreaseVolume", async (_, payload: { step?: number }) => {
    return await spotify.decreaseVolume(payload.step);
  });

  ipcMain.handle("spotify:muteVolume", async () => {
    return await spotify.muteVolume();
  });

  ipcMain.handle("spotify:setVolumePercent", async (_, payload: { percent: number }) => {
    return await spotify.setVolumePercent(payload.percent);
  });

  ipcMain.handle("spotify:toggleShuffle", async () => {
    return await spotify.toggleShuffle();
  });

  ipcMain.handle("spotify:toggleRepeat", async () => {
    return await spotify.toggleRepeat();
  });

  ipcMain.handle("spotify:forwardSeconds", async (_, payload: { seconds: number }) => {
    return await spotify.forwardSeconds(payload.seconds);
  });

  ipcMain.handle("spotify:backwardSeconds", async (_, payload: { seconds: number }) => {
    return await spotify.backwardSeconds(payload.seconds);
  });

  ipcMain.handle("spotify:backwardToBeginning", async () => {
    return await spotify.backwardToBeginning();
  });

  ipcMain.handle("spotify:copyTrackUrl", async () => {
    return await spotify.copyTrackUrl();
  });

  ipcMain.handle("spotify:copyArtistAndTitle", async () => {
    return await spotify.copyArtistAndTitle();
  });

  ipcMain.handle("spotify:getMyPlaylists", async (_, payload: { limit?: number }) => {
    if (!spotifyApi) {
      throw new Error("Spotify is not configured.");
    }
    return await spotify.getMyPlaylists(spotifyApi, payload.limit);
  });

  ipcMain.handle("spotify:getQueue", async () => {
    if (!spotifyApi) {
      throw new Error("Spotify is not configured.");
    }
    return await spotify.getQueue(spotifyApi);
  });

  ipcMain.handle("spotify:getDevices", async () => {
    if (!spotifyApi) {
      throw new Error("Spotify is not configured.");
    }
    return await spotify.getDevices(spotifyApi);
  });

  ipcMain.handle("spotify:getCurrentlyPlaying", async () => {
    if (!spotifyApi) {
      throw new Error("Spotify is not configured.");
    }
    return await spotify.getCurrentlyPlaying(spotifyApi);
  });

  // Apple Notes IPC handlers
  ipcMain.handle("apple-notes:search", async (_, payload: { query: string }) => {
    try {
      return await appleNotes.searchNotes(payload.query);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { notes: [], success: false, error: message };
    }
  });

  ipcMain.handle("apple-notes:create", async (_, payload: { content?: string; text?: string }) => {
    try {
      return await appleNotes.createNote(payload.content, payload.text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("apple-notes:getContent", async (_, payload: { noteId: string }) => {
    try {
      return await appleNotes.getNoteContent(payload.noteId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("apple-notes:update", async (_, payload: { noteId: string; content: string }) => {
    try {
      return await appleNotes.updateNote(payload.noteId, payload.content);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Apple Maps IPC handlers
  ipcMain.handle("apple-maps:search", async (_, payload: { query: string }) => {
    try {
      return await appleMaps.searchMaps(payload.query);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("apple-maps:directions", async (_, payload: { destination: string; origin?: string; mode?: string }) => {
    try {
      return await appleMaps.getDirections(payload.destination, payload.origin, payload.mode);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("apple-maps:directions-home", async (_, payload: { homeAddress: string; mode?: string }) => {
    try {
      return await appleMaps.getDirectionsHome(payload.homeAddress, payload.mode);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Apple Reminders IPC handlers
  ipcMain.handle("apple-reminders:create", async (_, payload: {
    title: string;
    listName?: string;
    dueDate?: string;
    priority?: string;
    notes?: string;
  }) => {
    try {
      return await appleReminders.createReminder(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("apple-reminders:list", async (_, payload: { listName?: string; completed?: boolean }) => {
    try {
      return await appleReminders.listReminders(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, reminders: [], error: message };
    }
  });

  ipcMain.handle("apple-reminders:complete", async (_, payload: { reminderId: string }) => {
    try {
      return await appleReminders.completeReminder(payload.reminderId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Apple Stocks IPC handlers
  ipcMain.handle("apple-stocks:search", async (_, payload: { ticker: string }) => {
    try {
      return await appleStocks.searchStocks(payload.ticker);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Finder IPC handlers
  ipcMain.handle("finder:createFile", async (_, payload: { filename: string; autoOpen?: boolean }) => {
    try {
      return await finder.createFileInFinder(payload.filename, payload.autoOpen);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("finder:openFile", async (_, payload: { path: string; application?: string }) => {
    try {
      return await finder.openFile(payload.path, payload.application);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("finder:moveToFolder", async (_, payload: { destination: string; filePaths: string[] }) => {
    try {
      return await finder.moveFilesToFolder(payload.destination, payload.filePaths);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("finder:copyToFolder", async (_, payload: { destination: string; filePaths: string[] }) => {
    try {
      return await finder.copyFilesToFolder(payload.destination, payload.filePaths);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("finder:getSelectedFiles", async () => {
    try {
      return await finder.getSelectedFinderFiles();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Browser Bookmarks IPC handlers
  ipcMain.handle("browser-bookmarks:search", async (_, payload: { query: string; browser?: string }) => {
    try {
      return await browserBookmarks.searchBookmarks(payload.query, payload.browser);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("browser-bookmarks:open", async (_, payload: { url: string; browser?: string }) => {
    try {
      return await browserBookmarks.openBookmark(payload.url, payload.browser);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Browser History IPC handlers
  ipcMain.handle("browser-history:search", async (_, payload: { query: string; browser?: string; limit?: number }) => {
    try {
      return await browserHistory.searchHistory(payload.query, payload.browser, payload.limit);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("browser-history:open", async (_, payload: { url: string; browser?: string }) => {
    try {
      return await browserHistory.openHistoryUrl(payload.url, payload.browser);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Browser Tabs IPC handlers
  ipcMain.handle("browser-tabs:search", async (_, payload: { query: string; browser?: string }) => {
    try {
      return await browserTabs.searchTabs(payload.query, payload.browser);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("browser-tabs:close", async (_, payload: { browser: string; windowId: string; tabIndex: number }) => {
    try {
      return await browserTabs.closeTab(payload.browser, payload.windowId, payload.tabIndex);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  // Browser Profiles IPC handlers
  ipcMain.handle("browser-profiles:list", async (_, payload: { browser: string }) => {
    try {
      return await browserProfiles.listProfiles(payload.browser);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle("browser-profiles:open", async (_, payload: { browser: string; profile: string }) => {
    try {
      return await browserProfiles.openBrowserProfile(payload.browser, payload.profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  app.on("activate", () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      createOverlayWindow();
      if (overlayWindow) {
        overlayWindow.showInactive();
      }
    } else {
      overlayWindow.showInactive();
    }
  });
});

app.on("will-quit", (event) => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});

app.on("before-quit", () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  // Don't quit on macOS - keep the app running in the background
  // Shortcuts remain registered so Cmd+K can reopen the window
  if (!isMac) {
    globalShortcut.unregisterAll();
    app.quit();
  }
});

// Handle app termination (SIGTERM, SIGINT)
process.on("SIGTERM", () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
  app.quit();
});

process.on("SIGINT", () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
  app.quit();
});

// Ensure shortcuts are unregistered on any exit
process.on("exit", () => {
  globalShortcut.unregisterAll();
});

