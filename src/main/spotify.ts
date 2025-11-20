import { exec } from "child_process";
import { promisify } from "util";
import { SpotifyAuthManager } from "./spotify-auth";
import { SpotifyApiClient } from "./spotify-api";
import { buildScriptEnsuringSpotifyIsRunning } from "./spotify-helpers";
import type {
  SpotifySearchResults,
  SpotifySearchCategory,
  SpotifyPlaybackRequest,
  SpotifyLibraryState,
  SpotifyTrackInfo,
  SpotifyPlaylistInfo,
  SpotifyDeviceInfo,
} from "../types/spotify";

const execAsync = promisify(exec);

export interface SpotifyControlResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Execute AppleScript for Spotify controls
 */
async function runSpotifyScript(script: string): Promise<SpotifyControlResult> {
  try {
    const fullScript = buildScriptEnsuringSpotifyIsRunning(script);
    const { stdout, stderr } = await execAsync(
      `osascript -e '${fullScript.replace(/'/g, "'\\''")}'`
    );
    return {
      success: true,
      output: stdout?.trim() || undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}

/**
 * Get currently playing track info via AppleScript
 */
export async function getCurrentTrack(): Promise<SpotifyControlResult> {
  const script = `
    try
      set trackName to name of current track
      set artistName to artist of current track
      set albumName to album of current track
      set trackUrl to spotify url of current track
      set playerState to player state as string
      set playerPosition to player position
      set trackDuration to duration of current track
      set soundVolume to sound volume
      set shuffling to shuffling
      set repeating to repeating
      
      return trackName & "|" & artistName & "|" & albumName & "|" & trackUrl & "|" & playerState & "|" & playerPosition & "|" & trackDuration & "|" & soundVolume & "|" & shuffling & "|" & repeating
    on error
      return "ERROR|No track playing"
    end try
  `;
  return runSpotifyScript(script);
}

/**
 * Play/Pause toggle
 */
export async function togglePlayPause(): Promise<SpotifyControlResult> {
  return runSpotifyScript("playpause");
}

/**
 * Play
 */
export async function play(): Promise<SpotifyControlResult> {
  return runSpotifyScript("play");
}

/**
 * Pause
 */
export async function pause(): Promise<SpotifyControlResult> {
  return runSpotifyScript("pause");
}

/**
 * Next track
 */
export async function nextTrack(): Promise<SpotifyControlResult> {
  return runSpotifyScript("next track");
}

/**
 * Previous track
 */
export async function previousTrack(): Promise<SpotifyControlResult> {
  return runSpotifyScript("previous track");
}

/**
 * Set volume (0-100)
 */
export async function setVolume(level: number): Promise<SpotifyControlResult> {
  const clampedLevel = Math.max(0, Math.min(100, level));
  return runSpotifyScript(`set sound volume to ${clampedLevel}`);
}

/**
 * Increase volume by step (default 10)
 */
export async function increaseVolume(step: number = 10): Promise<SpotifyControlResult> {
  return runSpotifyScript(`set sound volume to sound volume + ${step}`);
}

/**
 * Decrease volume by step (default 10)
 */
export async function decreaseVolume(step: number = 10): Promise<SpotifyControlResult> {
  return runSpotifyScript(`set sound volume to sound volume - ${step}`);
}

/**
 * Set volume to specific percentage
 */
export async function setVolumePercent(percent: number): Promise<SpotifyControlResult> {
  const level = Math.round((percent / 100) * 100);
  return setVolume(level);
}

/**
 * Mute (set to 0)
 */
export async function muteVolume(): Promise<SpotifyControlResult> {
  return setVolume(0);
}

/**
 * Toggle shuffle
 */
export async function toggleShuffle(): Promise<SpotifyControlResult> {
  const script = `
    set shuffleEnabled to shuffling
    set shuffling to not shuffleEnabled
    return not shuffleEnabled
  `;
  return runSpotifyScript(script);
}

/**
 * Toggle repeat
 */
export async function toggleRepeat(): Promise<SpotifyControlResult> {
  const script = `
    set repeatEnabled to repeating
    set repeating to not repeatEnabled
    return not repeatEnabled
  `;
  return runSpotifyScript(script);
}

/**
 * Forward X seconds
 */
export async function forwardSeconds(seconds: number): Promise<SpotifyControlResult> {
  const script = `
    if player state is playing then
      set playPos to player position + ${seconds}
      set player position to playPos
    end if
  `;
  return runSpotifyScript(script);
}

/**
 * Backward X seconds
 */
export async function backwardSeconds(seconds: number): Promise<SpotifyControlResult> {
  const script = `
    if player state is playing then
      set playPos to player position - ${seconds}
      set player position to playPos
    end if
  `;
  return runSpotifyScript(script);
}

/**
 * Go to beginning of track
 */
export async function backwardToBeginning(): Promise<SpotifyControlResult> {
  return runSpotifyScript("set player position to 0");
}

/**
 * Copy current track URL
 */
export async function copyTrackUrl(): Promise<SpotifyControlResult> {
  const script = `
    set trackUrl to spotify url of current track
    set the clipboard to trackUrl
    return trackUrl
  `;
  return runSpotifyScript(script);
}

/**
 * Copy artist and title
 */
export async function copyArtistAndTitle(): Promise<SpotifyControlResult> {
  const script = `
    set trackName to name of current track
    set artistName to artist of current track
    set result to artistName & " - " & trackName
    set the clipboard to result
    return result
  `;
  return runSpotifyScript(script);
}

/**
 * Search Spotify (Web API)
 */
export async function searchSpotify(
  apiClient: SpotifyApiClient,
  query: string,
  categories?: SpotifySearchCategory[]
): Promise<SpotifySearchResults> {
  return apiClient.search(query, categories);
}

/**
 * Get library (Web API)
 */
export async function getLibrary(apiClient: SpotifyApiClient): Promise<SpotifyLibraryState> {
  return apiClient.getLibrary();
}

/**
 * Play track/album/playlist (Web API)
 */
export async function playSpotify(
  apiClient: SpotifyApiClient,
  request: SpotifyPlaybackRequest
): Promise<void> {
  return apiClient.play(request);
}

/**
 * Queue track (Web API)
 */
export async function queueTrack(
  apiClient: SpotifyApiClient,
  uri: string
): Promise<void> {
  return apiClient.queue(uri);
}

/**
 * Like/Unlike track (Web API)
 */
export async function setTrackSaved(
  apiClient: SpotifyApiClient,
  trackId: string,
  saved: boolean
): Promise<void> {
  return apiClient.setTrackSaved(trackId, saved);
}

/**
 * Like/Unlike album (Web API)
 */
export async function setAlbumSaved(
  apiClient: SpotifyApiClient,
  albumId: string,
  saved: boolean
): Promise<void> {
  return apiClient.setAlbumSaved(albumId, saved);
}

/**
 * Get my playlists (Web API) - extended version
 */
export async function getMyPlaylists(
  apiClient: SpotifyApiClient,
  limit: number = 50
): Promise<SpotifyPlaylistInfo[]> {
  try {
    const response = await (apiClient as any).request(`/me/playlists?limit=${limit}`);
    return (response.items ?? []).map((item: any) => ({
      id: item.id,
      uri: item.uri,
      name: item.name,
      owner: item.owner?.display_name,
      imageUrl: item.images?.[0]?.url,
      trackCount: item.tracks?.total,
      description: item.description,
    }));
  } catch (error) {
    console.error("Error getting playlists:", error);
    return [];
  }
}

/**
 * Get queue (Web API)
 */
export async function getQueue(apiClient: SpotifyApiClient): Promise<any[]> {
  try {
    const response = await (apiClient as any).request("/me/player/queue");
    return response.queue || [];
  } catch (error) {
    console.error("Error getting queue:", error);
    return [];
  }
}

/**
 * Get devices (Web API)
 */
export async function getDevices(apiClient: SpotifyApiClient): Promise<SpotifyDeviceInfo[]> {
  try {
    const response = await (apiClient as any).request("/me/player/devices");
    return (response.devices || []).map((device: any) => ({
      id: device.id,
      name: device.name,
      type: device.type,
      volumePercent: device.volume_percent,
      isActive: device.is_active,
    }));
  } catch (error) {
    console.error("Error getting devices:", error);
    return [];
  }
}

/**
 * Get currently playing (Web API)
 */
export async function getCurrentlyPlaying(
  apiClient: SpotifyApiClient
): Promise<SpotifyTrackInfo | null> {
  try {
    const response = await (apiClient as any).request("/me/player/currently-playing");
    if (!response.item) return null;
    
    return {
      id: response.item.id,
      uri: response.item.uri,
      name: response.item.name,
      album: response.item.album?.name,
      albumId: response.item.album?.id,
      artists: response.item.artists?.map((a: any) => a.name) || [],
      imageUrl: response.item.album?.images?.[1]?.url || response.item.album?.images?.[0]?.url,
      durationMs: response.item.duration_ms,
      explicit: response.item.explicit,
      previewUrl: response.item.preview_url,
    };
  } catch (error) {
    console.error("Error getting currently playing:", error);
    return null;
  }
}

