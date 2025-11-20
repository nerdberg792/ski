import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useSpotify } from "@/hooks/useSpotify";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RefreshCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  Link,
  Globe,
} from "lucide-react";

export function SpotifyControlCard() {
  const {
    status,
    playback,
    isConfigured,
    isConnecting,
    error,
    lastAuthUrl,
    connect,
    disconnect,
    refresh,
    sendCommand,
    anonymizeTrack,
    openUrlInSpotify,
  } = useSpotify();

  const [volume, setVolume] = useState(playback?.device?.volumePercent ?? 40);

  const artists = useMemo(() => playback?.track?.artists?.join(", "), [playback?.track?.artists]);

  useEffect(() => {
    setVolume(playback?.device?.volumePercent ?? 40);
  }, [playback?.device?.volumePercent]);

  const handleVolumeCommit = async (value: number[]) => {
    const nextValue = value[0] ?? 0;
    setVolume(nextValue);
    await sendCommand({ type: "set-volume", value: nextValue });
  };

  const handleToggle = async () => {
    await sendCommand({ type: "toggle-play" });
  };

  const handleSkip = async (direction: "next" | "previous") => {
    await sendCommand({ type: direction });
  };

  const disabled = !status.connected || !isConfigured;

  return (
    <Card className="w-full max-w-xs border-white/30 bg-black/60 backdrop-blur-2xl shadow-2xl rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-white">Spotify</CardTitle>
          <CardDescription className="text-white/70 text-xs">
            {status.connected ? "Playback controls" : "Connect your account"}
          </CardDescription>
        </div>
        {status.account?.displayName && (
          <Badge variant="outline">{status.account.displayName}</Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!isConfigured && (
          <p className="text-sm text-rose-200">
            Configure `SPOTIFY_CLIENT_ID` and `SPOTIFY_REDIRECT_URI` to enable playback control.
          </p>
        )}

        {error && (
          <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        )}
        {status.connected && !playback && !error && (
          <p className="text-xs text-white/60">
            Tap play to hand off playback to your most recent Spotify device. Make sure Spotify is open on at least one
            device.
          </p>
        )}

        {!status.connected ? (
          <div className="flex flex-col gap-3">
            <Button onClick={connect} disabled={!isConfigured || isConnecting}>
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for approval…
                </span>
              ) : (
                "Connect Spotify"
              )}
            </Button>
            {lastAuthUrl && (
              <Button
                variant="ghost"
                className="text-white/70"
                onClick={() => window.open(lastAuthUrl, "_blank", "noreferrer")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open authorization link
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {playback?.track?.imageUrl ? (
                <img
                  src={playback.track.imageUrl}
                  alt={playback.track.name ?? "Album Art"}
                  className="h-16 w-16 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-white/5" />
              )}
              <div className="flex flex-col gap-1">
                <span className="text-sm text-white/60">
                  {playback?.track?.album ?? "Unknown album"}
                </span>
                <span className="text-lg font-semibold text-white/90">
                  {playback?.track?.name ?? "No active track"}
                </span>
                <span className="text-sm text-white/60">{artists}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                onClick={() => handleSkip("previous")}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                disabled={disabled}
                onClick={handleToggle}
              >
                {playback?.isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                onClick={() => handleSkip("next")}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                onClick={() => sendCommand({ type: "set-shuffle", value: !playback?.shuffleState })}
              >
                <Shuffle
                  className={cn(
                    "h-4 w-4",
                    playback?.shuffleState ? "text-white" : "text-white/60",
                  )}
                />
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="flex items-center gap-1">
                  <Volume2 className="h-4 w-4" /> Volume
                </span>
                <span>{playback?.device?.volumePercent ?? volume}%</span>
              </div>
              <Slider
                value={[volume]}
                max={100}
                step={1}
                disabled={disabled}
                onValueChange={(value) => setVolume(value[0] ?? 0)}
                onValueCommit={handleVolumeCommit}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70"
                  onClick={refresh}
                  disabled={disabled}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="ghost" size="sm" className="text-white/60" onClick={disconnect}>
                  Disconnect
                </Button>
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-white/70"
                  onClick={async () => {
                    const result = await anonymizeTrack();
                    if (!result.success && result.error) {
                      console.error("Failed to anonymize track:", result.error);
                    }
                  }}
                  disabled={disabled || !playback?.track}
                  title="Anonymize current track and open in browser"
                >
                  <Link className="mr-2 h-4 w-4" />
                  Anonymize Track
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-white/70"
                  onClick={async () => {
                    const result = await openUrlInSpotify();
                    if (!result.success && result.error) {
                      console.error("Failed to open URL in Spotify:", result.error);
                    }
                  }}
                  disabled={disabled}
                  title="Open URL from Chrome tab in Spotify"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Open in Spotify
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


