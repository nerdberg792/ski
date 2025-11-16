import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  SpotifyLibraryState,
  SpotifyPlaybackRequest,
  SpotifySearchCategory,
  SpotifySearchResults,
} from "@/types/spotify";

interface UseSpotifyExtensionOptions {
  enabled: boolean;
  debounceMs?: number;
}

const DEFAULT_DEBOUNCE = 275;

const EMPTY_RESULTS: SpotifySearchResults = {
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  shows: [],
  episodes: [],
};

export function useSpotifyExtension(options: UseSpotifyExtensionOptions) {
  const { enabled, debounceMs = DEFAULT_DEBOUNCE } = options;
  const spotifyBridge = useMemo(() => window.sky?.spotify, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<SpotifySearchCategory>("all");
  const [searchResults, setSearchResults] = useState<SpotifySearchResults>(EMPTY_RESULTS);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [library, setLibrary] = useState<SpotifyLibraryState | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const pendingSearch = useRef<NodeJS.Timeout | null>(null);

  const fetchSearch = useCallback(async () => {
    if (!enabled || !spotifyBridge) return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(EMPTY_RESULTS);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    try {
      const categories = searchCategory === "all" ? undefined : [searchCategory];
      const results = await spotifyBridge.search({ query: trimmed, categories });
      setSearchResults(results ?? EMPTY_RESULTS);
      setSearchError(null);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : String(error));
    } finally {
      setSearchLoading(false);
    }
  }, [enabled, searchCategory, searchQuery, spotifyBridge]);

  useEffect(() => {
    if (!enabled) {
      setSearchLoading(false);
      setSearchResults(EMPTY_RESULTS);
      return;
    }
    if (pendingSearch.current) {
      clearTimeout(pendingSearch.current);
    }
    pendingSearch.current = setTimeout(fetchSearch, debounceMs);
    return () => {
      if (pendingSearch.current) {
        clearTimeout(pendingSearch.current);
      }
    };
  }, [enabled, debounceMs, fetchSearch]);

  const refreshLibrary = useCallback(async () => {
    if (!enabled || !spotifyBridge) return;
    setLibraryLoading(true);
    try {
      const result = await spotifyBridge.getLibrary();
      setLibrary(result);
      setLibraryError(null);
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : String(error));
    } finally {
      setLibraryLoading(false);
    }
  }, [enabled, spotifyBridge]);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const playUri = useCallback(
    (payload: SpotifyPlaybackRequest) => spotifyBridge?.playUri(payload),
    [spotifyBridge],
  );

  const queueUri = useCallback((uri: string) => spotifyBridge?.queueUri(uri), [spotifyBridge]);

  const toggleTrackSaved = useCallback(
    async (trackId: string, saved: boolean) => {
      await spotifyBridge?.setTrackSaved({ trackId, saved });
      refreshLibrary();
    },
    [spotifyBridge, refreshLibrary],
  );

  const toggleAlbumSaved = useCallback(
    async (albumId: string, saved: boolean) => {
      await spotifyBridge?.setAlbumSaved({ albumId, saved });
      refreshLibrary();
    },
    [spotifyBridge, refreshLibrary],
  );

  return {
    searchQuery,
    setSearchQuery,
    searchCategory,
    setSearchCategory,
    searchResults,
    searchLoading,
    searchError,
    library,
    libraryLoading,
    libraryError,
    refreshLibrary,
    playUri,
    queueUri,
    toggleTrackSaved,
    toggleAlbumSaved,
  };
}


