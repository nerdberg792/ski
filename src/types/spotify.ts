export interface SpotifyTrackInfo {
  id?: string;
  uri?: string;
  name?: string;
  album?: string;
  albumId?: string;
  artists?: string[];
  imageUrl?: string;
  durationMs?: number;
  explicit?: boolean;
  previewUrl?: string | null;
}

export interface SpotifyArtistInfo {
  id?: string;
  uri?: string;
  name?: string;
  imageUrl?: string;
  followers?: number;
  genres?: string[];
}

export interface SpotifyAlbumInfo {
  id?: string;
  uri?: string;
  name?: string;
  artists?: string[];
  imageUrl?: string;
  releaseDate?: string;
  totalTracks?: number;
}

export interface SpotifyPlaylistInfo {
  id?: string;
  uri?: string;
  name?: string;
  owner?: string;
  imageUrl?: string;
  trackCount?: number;
  description?: string;
}

export interface SpotifyShowInfo {
  id?: string;
  uri?: string;
  name?: string;
  publisher?: string;
  imageUrl?: string;
  mediaType?: string;
}

export interface SpotifyEpisodeInfo {
  id?: string;
  uri?: string;
  name?: string;
  description?: string;
  showName?: string;
  imageUrl?: string;
  durationMs?: number;
  releaseDate?: string;
}

export interface SpotifyDeviceInfo {
  id?: string;
  name?: string;
  type?: string;
  volumePercent?: number;
  isActive?: boolean;
}

export interface SpotifyPlaybackState {
  isPlaying: boolean;
  progressMs: number;
  track?: SpotifyTrackInfo;
  device?: SpotifyDeviceInfo;
  shuffleState?: boolean;
  repeatState?: "off" | "track" | "context";
  updatedAt: number;
}

export interface SpotifyAuthStatus {
  connected: boolean;
  scopes?: string[];
  expiresAt?: number;
  account?: {
    id?: string;
    displayName?: string;
    product?: string;
    country?: string;
  };
  playback?: SpotifyPlaybackState | null;
  error?: string;
}

export interface SpotifyStartAuthResult {
  state: string;
  url: string;
}

export type SpotifyPlaybackCommand =
  | { type: "play" }
  | { type: "pause" }
  | { type: "toggle-play" }
  | { type: "next" }
  | { type: "previous" }
  | { type: "set-volume"; value: number }
  | { type: "set-shuffle"; value: boolean }
  | { type: "refresh" };

export type SpotifySearchCategory = "all" | "tracks" | "albums" | "artists" | "playlists" | "shows" | "episodes";

export interface SpotifySearchResults {
  tracks: SpotifyTrackInfo[];
  albums: SpotifyAlbumInfo[];
  artists: SpotifyArtistInfo[];
  playlists: SpotifyPlaylistInfo[];
  shows: SpotifyShowInfo[];
  episodes: SpotifyEpisodeInfo[];
}

export interface SpotifyLibraryState {
  recentlyPlayed: SpotifyTrackInfo[];
  savedTracks: SpotifyTrackInfo[];
  savedAlbums: SpotifyAlbumInfo[];
  playlists: SpotifyPlaylistInfo[];
  shows: SpotifyShowInfo[];
  savedEpisodes: SpotifyEpisodeInfo[];
  artists: SpotifyArtistInfo[];
}

export interface SpotifyPlaybackRequest {
  uri: string;
  type?: "track" | "context";
  offsetUri?: string;
  positionMs?: number;
}


