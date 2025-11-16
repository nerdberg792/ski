import type { SpotifyAuthManager } from "./spotify-auth";
import type {
  SpotifyAlbumInfo,
  SpotifyArtistInfo,
  SpotifyEpisodeInfo,
  SpotifyLibraryState,
  SpotifyPlaybackRequest,
  SpotifyPlaylistInfo,
  SpotifySearchCategory,
  SpotifySearchResults,
  SpotifyShowInfo,
  SpotifyTrackInfo,
} from "../types/spotify";

type SearchEntity = Exclude<SpotifySearchCategory, "all">;

const SEARCH_TYPE_MAP: Record<SearchEntity, string> = {
  tracks: "track",
  albums: "album",
  artists: "artist",
  playlists: "playlist",
  shows: "show",
  episodes: "episode",
};

const EMPTY_SEARCH_RESULTS: SpotifySearchResults = {
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  shows: [],
  episodes: [],
};

export class SpotifyApiClient {
  constructor(private readonly manager: SpotifyAuthManager) {}

  async search(query: string, categories?: SpotifySearchCategory[]): Promise<SpotifySearchResults> {
    const trimmed = query.trim();
    if (!trimmed) {
      return EMPTY_SEARCH_RESULTS;
    }

    const types = this.resolveSearchTypes(categories);
    if (!types.length) {
      return EMPTY_SEARCH_RESULTS;
    }

    const params = new URLSearchParams({
      q: trimmed,
      type: types.join(","),
      limit: "8",
      market: this.manager.getPreferredMarket() ?? "from_token",
    });

    const data = await this.request(`/search?${params.toString()}`);
    return {
      tracks: data.tracks?.items?.map(mapTrack).filter(Boolean) ?? [],
      albums: data.albums?.items?.map(mapAlbum).filter(Boolean) ?? [],
      artists: data.artists?.items?.map(mapArtist).filter(Boolean) ?? [],
      playlists: data.playlists?.items?.map(mapPlaylist).filter(Boolean) ?? [],
      shows: data.shows?.items?.map(mapShow).filter(Boolean) ?? [],
      episodes: data.episodes?.items?.map(mapEpisode).filter(Boolean) ?? [],
    };
  }

  async getLibrary(): Promise<SpotifyLibraryState> {
    const [
      savedTracks,
      savedAlbums,
      playlists,
      shows,
      episodes,
      recentlyPlayed,
      artists,
    ] = await Promise.all([
      this.request("/me/tracks?limit=20"),
      this.request("/me/albums?limit=20"),
      this.request("/me/playlists?limit=20"),
      this.request("/me/shows?limit=20"),
      this.request("/me/episodes?limit=20"),
      this.request("/me/player/recently-played?limit=20"),
      this.request("/me/following?type=artist&limit=20"),
    ]);

    return {
      savedTracks: (savedTracks.items ?? []).map((item: { track?: unknown }) => mapTrack(item.track)).filter(Boolean),
      savedAlbums: (savedAlbums.items ?? [])
        .map((item: { album?: unknown }) => mapAlbum(item.album))
        .filter(Boolean),
      playlists: (playlists.items ?? []).map(mapPlaylist).filter(Boolean),
      shows: (shows.items ?? []).map((item: { show?: unknown }) => mapShow(item.show ?? item)).filter(Boolean),
      savedEpisodes: (episodes.items ?? [])
        .map((item: { episode?: unknown }) => mapEpisode(item.episode ?? item))
        .filter(Boolean),
      recentlyPlayed: (recentlyPlayed.items ?? [])
        .map((item: { track?: unknown }) => mapTrack(item.track))
        .filter(Boolean),
      artists: (artists.artists?.items ?? []).map(mapArtist).filter(Boolean),
    };
  }

  async play(request: SpotifyPlaybackRequest) {
    // For tracks, we need to ensure device is active and ready to play
    // For albums/playlists, we can transfer and play
    await this.manager.ensurePlaybackDevice(request.type !== "track");
    const body =
      request.type === "track"
        ? {
            uris: [request.uri],
            ...(request.positionMs != null ? { position_ms: request.positionMs } : {}),
          }
        : {
            context_uri: request.uri,
            ...(request.offsetUri ? { offset: { uri: request.offsetUri } } : {}),
            ...(request.positionMs != null ? { position_ms: request.positionMs } : {}),
          };

    const response = await this.request("/me/player/play", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    
    // Check response status - 204 is success, 404 means no active device
    if (response.status === 404) {
      throw new Error("No active Spotify device found. Make sure Spotify is open and playing on at least one device.");
    }
    
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to play: ${errorText || response.statusText}`);
    }
  }

  async queue(uri: string) {
    await this.request(`/me/player/queue?uri=${encodeURIComponent(uri)}`, { method: "POST" });
  }

  async setTrackSaved(trackId: string, saved: boolean) {
    await this.request(`/me/tracks?ids=${trackId}`, { method: saved ? "PUT" : "DELETE" });
  }

  async setAlbumSaved(albumId: string, saved: boolean) {
    await this.request(`/me/albums?ids=${albumId}`, { method: saved ? "PUT" : "DELETE" });
  }

  private resolveSearchTypes(categories?: SpotifySearchCategory[]) {
    const normalized = (categories ?? []).filter((category) => category !== "all") as SearchEntity[];
    const selected = normalized.length ? normalized : (Object.keys(SEARCH_TYPE_MAP) as SearchEntity[]);
    return selected.map((key) => SEARCH_TYPE_MAP[key]);
  }

  private async request(pathname: string, init?: RequestInit) {
    const response = await this.manager.requestApi(pathname, init);
    if (response.status === 204) {
      return {};
    }
    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(message || "Spotify request failed");
    }
    return response.json();
  }
}

function mapTrack(input: any): SpotifyTrackInfo | null {
  if (!input) return null;
  return {
    id: input.id,
    uri: input.uri,
    name: input.name,
    album: input.album?.name,
    albumId: input.album?.id,
    artists: Array.isArray(input.artists) ? input.artists.map((artist: any) => artist?.name).filter(Boolean) : [],
    imageUrl: input.album?.images?.[1]?.url ?? input.album?.images?.[0]?.url,
    durationMs: input.duration_ms,
    explicit: input.explicit,
    previewUrl: input.preview_url,
  };
}

function mapAlbum(input: any): SpotifyAlbumInfo | null {
  if (!input) return null;
  return {
    id: input.id,
    uri: input.uri,
    name: input.name,
    artists: Array.isArray(input.artists) ? input.artists.map((artist: any) => artist?.name).filter(Boolean) : [],
    imageUrl: input.images?.[1]?.url ?? input.images?.[0]?.url,
    releaseDate: input.release_date,
    totalTracks: input.total_tracks,
  };
}

function mapArtist(input: any): SpotifyArtistInfo | null {
  if (!input) return null;
  return {
    id: input.id,
    uri: input.uri,
    name: input.name,
    imageUrl: input.images?.[1]?.url ?? input.images?.[0]?.url,
    followers: input.followers?.total,
    genres: Array.isArray(input.genres) ? input.genres.slice(0, 3) : undefined,
  };
}

function mapPlaylist(input: any): SpotifyPlaylistInfo | null {
  if (!input) return null;
  return {
    id: input.id,
    uri: input.uri,
    name: input.name,
    owner: input.owner?.display_name,
    imageUrl: input.images?.[0]?.url,
    trackCount: input.tracks?.total,
    description: input.description,
  };
}

function mapShow(input: any): SpotifyShowInfo | null {
  if (!input) return null;
  return {
    id: input.id,
    uri: input.uri,
    name: input.name,
    publisher: input.publisher,
    imageUrl: input.images?.[0]?.url,
    mediaType: input.media_type,
  };
}

function mapEpisode(input: any): SpotifyEpisodeInfo | null {
  if (!input) return null;
  return {
    id: input.id,
    uri: input.uri,
    name: input.name,
    description: input.description,
    showName: input.show?.name,
    imageUrl: input.images?.[0]?.url ?? input.show?.images?.[0]?.url,
    durationMs: input.duration_ms,
    releaseDate: input.release_date,
  };
}


