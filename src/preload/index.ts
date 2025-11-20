import { contextBridge, ipcRenderer } from "electron";
import type {
  SpotifyAuthStatus,
  SpotifyLibraryState,
  SpotifyPlaybackCommand,
  SpotifyPlaybackRequest,
  SpotifyPlaybackState,
  SpotifySearchCategory,
  SpotifySearchResults,
  SpotifyStartAuthResult,
} from "../types/spotify";
import type {
  AppleNote,
  AppleNotesSearchResult,
  AppleNotesCreateResult,
  AppleNotesGetContentResult,
  AppleNotesUpdateResult,
} from "../types/apple-notes";
import type {
  AppleMapsSearchResult,
  AppleMapsDirectionsResult,
} from "../types/apple-maps";
import type {
  AppleReminder,
  AppleRemindersCreateResult,
  AppleRemindersListResult,
  AppleRemindersCompleteResult,
} from "../types/apple-reminders";
import type {
  AppleStocksSearchResult,
} from "../types/apple-stocks";
import type {
  FinderCreateFileResult,
  FinderOpenFileResult,
  FinderMoveFilesResult,
  FinderCopyFilesResult,
  FinderGetSelectedFilesResult,
} from "../types/finder";
import type {
  BrowserBookmark,
  BrowserBookmarksSearchResult,
  BrowserBookmarksOpenResult,
} from "../types/browser-bookmarks";
import type {
  BrowserHistoryEntry,
  BrowserHistorySearchResult,
  BrowserHistoryOpenResult,
} from "../types/browser-history";
import type {
  BrowserTab,
  BrowserTabsSearchResult,
  BrowserTabsCloseResult,
} from "../types/browser-tabs";
import type {
  BrowserProfile,
  BrowserProfilesListResult,
  BrowserProfilesOpenResult,
} from "../types/browser-profiles";

const api = {
  toggleOverlay(visible?: boolean) {
    return ipcRenderer.invoke("sky:toggle", { visible });
  },
  expand() {
    return ipcRenderer.invoke("sky:expand");
  },
  collapse() {
    return ipcRenderer.invoke("sky:collapse");
  },
  setPosition(x: number, y: number) {
    return ipcRenderer.invoke("sky:setPosition", { x, y });
  },
  onVisibilityChange(callback: (visible: boolean) => void) {
    const listener = (_: Electron.IpcRendererEvent, visible: boolean) => {
      callback(visible);
    };
    ipcRenderer.on("sky:visibility", listener);
    return () => ipcRenderer.removeListener("sky:visibility", listener);
  },
  onExpandedChange(callback: (expanded: boolean) => void) {
    const listener = (_: Electron.IpcRendererEvent, expanded: boolean) => {
      callback(expanded);
    };
    ipcRenderer.on("sky:expanded", listener);
    return () => ipcRenderer.removeListener("sky:expanded", listener);
  },
  onPositionChange(callback: (position: { x: number; y: number }) => void) {
    const listener = (_: Electron.IpcRendererEvent, position: { x: number; y: number }) => {
      callback(position);
    };
    ipcRenderer.on("sky:position", listener);
    return () => ipcRenderer.removeListener("sky:position", listener);
  },
  onBlur(callback: () => void) {
    const listener = () => callback();
    ipcRenderer.on("sky:blur", listener);
    return () => ipcRenderer.removeListener("sky:blur", listener);
  },
  async executeAction(execution: { actionId: string; parameters?: Record<string, string | number | boolean> }, scriptPath: string) {
    return ipcRenderer.invoke("sky:executeAction", { execution, scriptPath });
  },
  async getApiKey() {
    return ipcRenderer.invoke("sky:getApiKey");
  },
  spotify: {
    startAuth(): Promise<SpotifyStartAuthResult> {
      return ipcRenderer.invoke("spotify:startAuth");
    },
    disconnect(): Promise<SpotifyAuthStatus> {
      return ipcRenderer.invoke("spotify:disconnect");
    },
    getStatus(): Promise<SpotifyAuthStatus> {
      return ipcRenderer.invoke("spotify:getStatus");
    },
    refreshPlayback(): Promise<SpotifyPlaybackState | null> {
      return ipcRenderer.invoke("spotify:refreshPlayback");
    },
    sendCommand(command: SpotifyPlaybackCommand): Promise<SpotifyPlaybackState | null> {
      return ipcRenderer.invoke("spotify:playbackCommand", command);
    },
    search(payload: { query: string; categories?: SpotifySearchCategory[] }): Promise<SpotifySearchResults> {
      return ipcRenderer.invoke("spotify:search", payload);
    },
    getLibrary(): Promise<SpotifyLibraryState> {
      return ipcRenderer.invoke("spotify:getLibrary");
    },
    playUri(payload: SpotifyPlaybackRequest): Promise<void> {
      return ipcRenderer.invoke("spotify:playUri", payload);
    },
    queueUri(uri: string): Promise<void> {
      return ipcRenderer.invoke("spotify:queueUri", { uri });
    },
    setTrackSaved(payload: { trackId: string; saved: boolean }): Promise<void> {
      return ipcRenderer.invoke("spotify:setTrackSaved", payload);
    },
    setAlbumSaved(payload: { albumId: string; saved: boolean }): Promise<void> {
      return ipcRenderer.invoke("spotify:setAlbumSaved", payload);
    },
    anonymizeTrack(): Promise<{ success: boolean; url?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:anonymizeTrack");
    },
    openUrlInSpotify(): Promise<{ success: boolean; url?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:openUrlInSpotify");
    },
    onAuthChange(callback: (status: SpotifyAuthStatus) => void) {
      const listener = (_: Electron.IpcRendererEvent, status: SpotifyAuthStatus) => callback(status);
      ipcRenderer.on("spotify:auth", listener);
      return () => ipcRenderer.removeListener("spotify:auth", listener);
    },
    onPlaybackChange(callback: (state: SpotifyPlaybackState | null) => void) {
      const listener = (_: Electron.IpcRendererEvent, state: SpotifyPlaybackState | null) => callback(state);
      ipcRenderer.on("spotify:playback", listener);
      return () => ipcRenderer.removeListener("spotify:playback", listener);
    },
    onError(callback: (message: string) => void) {
      const listener = (_: Electron.IpcRendererEvent, message: string) => callback(message);
      ipcRenderer.on("spotify:error", listener);
      return () => ipcRenderer.removeListener("spotify:error", listener);
    },
    // New comprehensive Spotify methods
    getCurrentTrack(): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:getCurrentTrack");
    },
    togglePlayPause(): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:togglePlayPause");
    },
    play(): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:play");
    },
    pause(): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:pause");
    },
    nextTrack(): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:nextTrack");
    },
    previousTrack(): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:previousTrack");
    },
    setVolume(payload: { level: number }): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:setVolume", payload);
    },
    increaseVolume(payload: { step?: number }): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:increaseVolume", payload);
    },
    decreaseVolume(payload: { step?: number }): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:decreaseVolume", payload);
    },
    muteVolume(): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:muteVolume");
    },
    setVolumePercent(payload: { percent: number }): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:setVolumePercent", payload);
    },
    toggleShuffle(): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:toggleShuffle");
    },
    toggleRepeat(): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:toggleRepeat");
    },
    forwardSeconds(payload: { seconds: number }): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:forwardSeconds", payload);
    },
    backwardSeconds(payload: { seconds: number }): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:backwardSeconds", payload);
    },
    backwardToBeginning(): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:backwardToBeginning");
    },
    copyTrackUrl(): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:copyTrackUrl");
    },
    copyArtistAndTitle(): Promise<{ success: boolean; output?: string; error?: string }> {
      return ipcRenderer.invoke("spotify:copyArtistAndTitle");
    },
    getMyPlaylists(payload: { limit?: number }): Promise<any[]> {
      return ipcRenderer.invoke("spotify:getMyPlaylists", payload);
    },
    getQueue(): Promise<any[]> {
      return ipcRenderer.invoke("spotify:getQueue");
    },
    getDevices(): Promise<any[]> {
      return ipcRenderer.invoke("spotify:getDevices");
    },
    getCurrentlyPlaying(): Promise<any> {
      return ipcRenderer.invoke("spotify:getCurrentlyPlaying");
    },
  },
  appleNotes: {
    search(query: string): Promise<AppleNotesSearchResult> {
      return ipcRenderer.invoke("apple-notes:search", { query });
    },
    create(payload: { content?: string; text?: string }): Promise<AppleNotesCreateResult> {
      return ipcRenderer.invoke("apple-notes:create", payload);
    },
    getContent(noteId: string): Promise<AppleNotesGetContentResult> {
      return ipcRenderer.invoke("apple-notes:getContent", { noteId });
    },
    update(payload: { noteId: string; content: string }): Promise<AppleNotesUpdateResult> {
      return ipcRenderer.invoke("apple-notes:update", payload);
    },
  },
  appleMaps: {
    search(query: string): Promise<AppleMapsSearchResult> {
      return ipcRenderer.invoke("apple-maps:search", { query });
    },
    directions(payload: { destination: string; origin?: string; mode?: string }): Promise<AppleMapsDirectionsResult> {
      return ipcRenderer.invoke("apple-maps:directions", payload);
    },
    directionsHome(payload: { homeAddress: string; mode?: string }): Promise<AppleMapsDirectionsResult> {
      return ipcRenderer.invoke("apple-maps:directions-home", payload);
    },
  },
  appleReminders: {
    create(payload: { title: string; listName?: string; dueDate?: string; priority?: string; notes?: string }): Promise<AppleRemindersCreateResult> {
      return ipcRenderer.invoke("apple-reminders:create", payload);
    },
    list(payload: { listName?: string; completed?: boolean }): Promise<AppleRemindersListResult> {
      return ipcRenderer.invoke("apple-reminders:list", payload);
    },
    complete(reminderId: string): Promise<AppleRemindersCompleteResult> {
      return ipcRenderer.invoke("apple-reminders:complete", { reminderId });
    },
  },
  appleStocks: {
    search(ticker: string): Promise<AppleStocksSearchResult> {
      return ipcRenderer.invoke("apple-stocks:search", { ticker });
    },
  },
  finder: {
    createFile(payload: { filename: string; autoOpen?: boolean }): Promise<FinderCreateFileResult> {
      return ipcRenderer.invoke("finder:createFile", payload);
    },
    openFile(payload: { path: string; application?: string }): Promise<FinderOpenFileResult> {
      return ipcRenderer.invoke("finder:openFile", payload);
    },
    moveToFolder(payload: { destination: string; filePaths: string[] }): Promise<FinderMoveFilesResult> {
      return ipcRenderer.invoke("finder:moveToFolder", payload);
    },
    copyToFolder(payload: { destination: string; filePaths: string[] }): Promise<FinderCopyFilesResult> {
      return ipcRenderer.invoke("finder:copyToFolder", payload);
    },
    getSelectedFiles(): Promise<FinderGetSelectedFilesResult> {
      return ipcRenderer.invoke("finder:getSelectedFiles");
    },
  },
  browserBookmarks: {
    search(query: string, browser?: string): Promise<BrowserBookmarksSearchResult> {
      return ipcRenderer.invoke("browser-bookmarks:search", { query, browser });
    },
    open(payload: { url: string; browser?: string }): Promise<BrowserBookmarksOpenResult> {
      return ipcRenderer.invoke("browser-bookmarks:open", payload);
    },
  },
  browserHistory: {
    search(payload: { query: string; browser?: string; limit?: number }): Promise<BrowserHistorySearchResult> {
      return ipcRenderer.invoke("browser-history:search", payload);
    },
    open(payload: { url: string; browser?: string }): Promise<BrowserHistoryOpenResult> {
      return ipcRenderer.invoke("browser-history:open", payload);
    },
  },
  browserTabs: {
    search(query: string, browser?: string): Promise<BrowserTabsSearchResult> {
      return ipcRenderer.invoke("browser-tabs:search", { query, browser });
    },
    close(payload: { browser: string; windowId: string; tabIndex: number }): Promise<BrowserTabsCloseResult> {
      return ipcRenderer.invoke("browser-tabs:close", payload);
    },
  },
  browserProfiles: {
    list(browser: string): Promise<BrowserProfilesListResult> {
      return ipcRenderer.invoke("browser-profiles:list", { browser });
    },
    open(payload: { browser: string; profile: string }): Promise<BrowserProfilesOpenResult> {
      return ipcRenderer.invoke("browser-profiles:open", payload);
    },
  },
  exa: {
    search(query: string): Promise<{ success?: boolean; error?: string; results?: Array<{ url: string; title: string; text?: string; publishedDate?: string }>; query: string }> {
      return ipcRenderer.invoke("exa:search", { query });
    },
  },
};

contextBridge.exposeInMainWorld("sky", api);

export type SkyBridge = typeof api;

