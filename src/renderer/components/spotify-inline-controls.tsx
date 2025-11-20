import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSpotify } from "@/hooks/useSpotify";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Pause,
  Play,
  RefreshCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";

export function SpotifyInlineControls() {
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
  } = useSpotify();

  const [volume, setVolume] = useState(playback?.device?.volumePercent ?? 40);

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
  const artists = playback?.track?.artists?.join(", ");

  if (!isConfigured) {
    return (
      <div className="rounded-lg border border-slate-200/50 bg-white/40 p-4">
        <p className="text-sm text-slate-600">
          Configure `SPOTIFY_CLIENT_ID` and `SPOTIFY_REDIRECT_URI` to enable Spotify controls.
        </p>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="rounded-lg border border-slate-200/50 bg-white/40 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Spotify</h3>
            <p className="text-xs text-slate-600 mt-0.5">Connect your account to control playback</p>
          </div>
        </div>
        <Button onClick={connect} disabled={isConnecting} size="sm" className="w-full">
          {isConnecting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </span>
          ) : (
            "Connect Spotify"
          )}
        </Button>
        {lastAuthUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 text-xs"
            onClick={() => window.open(lastAuthUrl, "_blank", "noreferrer")}
          >
            <ExternalLink className="mr-2 h-3 w-3" />
            Open authorization link
          </Button>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200/50 bg-rose-50/40 p-4">
        <p className="text-sm text-rose-700">{error}</p>
      </div>
    );
  }

  if (!playback) {
    return (
      <div className="rounded-lg border border-slate-200/50 bg-white/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Spotify</h3>
            <p className="text-xs text-slate-600 mt-0.5">No active playback</p>
          </div>
          <Button variant="ghost" size="sm" onClick={disconnect} className="text-xs">
            Disconnect
          </Button>
        </div>
        <Button onClick={handleToggle} disabled={disabled} size="sm" className="w-full">
          <Play className="mr-2 h-4 w-4" />
          Start Playback
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200/50 bg-white/40 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 text-sm">Spotify</h3>
        <Button variant="ghost" size="sm" onClick={disconnect} className="text-xs h-6 px-2">
          Disconnect
        </Button>
      </div>

      {/* Track Info */}
      <div className="flex items-center gap-3">
        {playback.track?.imageUrl ? (
          <img
            src={playback.track.imageUrl}
            alt={playback.track.name ?? "Album Art"}
            className="h-12 w-12 rounded-lg object-cover shadow-sm"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-slate-200/50" />
        )}
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-sm font-medium text-slate-900 truncate">
            {playback.track?.name ?? "No active track"}
          </span>
          <span className="text-xs text-slate-600 truncate">{artists || "Unknown artist"}</span>
          {playback.track?.album && (
            <span className="text-xs text-slate-500 truncate">{playback.track.album}</span>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
          onClick={() => handleSkip("previous")}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          className="h-9 w-9"
          disabled={disabled}
          onClick={handleToggle}
        >
          {playback.isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
          onClick={() => handleSkip("next")}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
          onClick={() => sendCommand({ type: "set-shuffle", value: !playback.shuffleState })}
        >
          <Shuffle
            className={cn("h-4 w-4", playback.shuffleState ? "text-slate-900" : "text-slate-400")}
          />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled} onClick={refresh}>
          <RefreshCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <Volume2 className="h-3 w-3" /> Volume
          </span>
          <span>{playback.device?.volumePercent ?? volume}%</span>
        </div>
        <Slider
          value={[volume]}
          max={100}
          step={1}
          disabled={disabled}
          onValueChange={(value) => setVolume(value[0] ?? 0)}
          onValueCommit={handleVolumeCommit}
          className="w-full"
        />
      </div>
    </div>
  );
}

