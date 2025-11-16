import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  SpotifyAuthStatus,
  SpotifyPlaybackCommand,
  SpotifyPlaybackState,
} from "../../types/spotify";

const DEFAULT_POLL_INTERVAL = 12_000;

export interface UseSpotifyResult {
  status: SpotifyAuthStatus;
  playback: SpotifyPlaybackState | null;
  isConfigured: boolean;
  isConnecting: boolean;
  error: string | null;
  lastAuthUrl: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  sendCommand: (command: SpotifyPlaybackCommand) => Promise<void>;
  anonymizeTrack: () => Promise<{ success: boolean; url?: string; error?: string }>;
  openUrlInSpotify: () => Promise<{ success: boolean; url?: string; error?: string }>;
}

export function useSpotify(pollInterval = DEFAULT_POLL_INTERVAL): UseSpotifyResult {
  const skySpotify = useMemo(() => window.sky?.spotify, []);
  const [status, setStatus] = useState<SpotifyAuthStatus>({ connected: false });
  const [playback, setPlayback] = useState<SpotifyPlaybackState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAuthUrl, setLastAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!skySpotify) return;
    let mounted = true;

    const bootstrap = async () => {
      try {
        const snapshot = await skySpotify.getStatus();
        if (!mounted) return;
        setStatus(snapshot);
        setPlayback(snapshot.playback ?? null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    bootstrap();
    const unsubscribeAuth = skySpotify.onAuthChange?.((next) => {
      setStatus(next);
      setPlayback(next.playback ?? null);
      setIsConnecting(false);
    });
    const unsubscribePlayback = skySpotify.onPlaybackChange?.((next) => {
      setPlayback(next);
    });
    const unsubscribeError = skySpotify.onError?.((message) => setError(message));

    return () => {
      mounted = false;
      unsubscribeAuth?.();
      unsubscribePlayback?.();
      unsubscribeError?.();
    };
  }, [skySpotify]);

  useEffect(() => {
    if (!skySpotify || !status.connected || pollInterval <= 0) return;
    const id = setInterval(() => {
      skySpotify.refreshPlayback();
    }, pollInterval);
    return () => clearInterval(id);
  }, [skySpotify, status.connected, pollInterval]);

  const connect = useCallback(async () => {
    if (!skySpotify) {
      setError("Spotify integration is not configured");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const result = await skySpotify.startAuth();
      setLastAuthUrl(result?.url ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsConnecting(false);
    }
  }, [skySpotify]);

  const disconnect = useCallback(async () => {
    if (!skySpotify) return;
    await skySpotify.disconnect();
    setPlayback(null);
    setStatus({ connected: false });
  }, [skySpotify]);

  const refresh = useCallback(async () => {
    if (!skySpotify) return;
    const next = await skySpotify.refreshPlayback();
    setPlayback(next);
  }, [skySpotify]);

  const sendCommand = useCallback(
    async (command: SpotifyPlaybackCommand) => {
      if (!skySpotify) return;
      try {
        const next = await skySpotify.sendCommand(command);
        if (command.type !== "set-volume" && command.type !== "set-shuffle") {
          setPlayback(next);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [skySpotify],
  );

  const anonymizeTrack = useCallback(async () => {
    if (!skySpotify) {
      return { success: false, error: "Spotify integration is not configured" };
    }
    try {
      return await skySpotify.anonymizeTrack();
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, [skySpotify]);

  const openUrlInSpotify = useCallback(async () => {
    if (!skySpotify) {
      return { success: false, error: "Spotify integration is not configured" };
    }
    try {
      return await skySpotify.openUrlInSpotify();
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, [skySpotify]);

  return {
    status,
    playback,
    isConfigured: Boolean(skySpotify),
    isConnecting,
    error,
    lastAuthUrl,
    connect,
    disconnect,
    refresh,
    sendCommand,
    anonymizeTrack,
    openUrlInSpotify,
  };
}


