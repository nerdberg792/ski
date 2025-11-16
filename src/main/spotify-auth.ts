import { app, shell } from "electron";
import { createHash, randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { EventEmitter } from "node:events";
import type {
  SpotifyAuthStatus,
  SpotifyPlaybackCommand,
  SpotifyPlaybackState,
  SpotifyStartAuthResult,
} from "../types/spotify";
import {
  base64Url,
  decryptPayload,
  encryptPayload,
  isHttpRedirect,
  sleep,
} from "./spotify-helpers";

const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";
const DEFAULT_SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-read-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-library-read",
  "user-library-modify",
  "user-follow-read",
  "user-read-recently-played",
  "user-read-playback-position",
  "user-top-read",
];
const TOKEN_FILE = "spotify-token.v1";

interface SpotifyTokens { accessToken: string; refreshToken?: string; expiresAt: number; scope?: string }
interface SpotifyProfile { id?: string; display_name?: string; product?: string; country?: string }
interface SpotifyAuthOptions { clientId: string; clientSecret?: string; redirectUri: string; scopes?: string[] }

type AuthEvents = {
  "auth-updated": SpotifyAuthStatus;
  "playback-updated": SpotifyPlaybackState | null;
  "auth-error": string;
};

export class SpotifyAuthManager extends EventEmitter {
  private tokens: SpotifyTokens | null = null;
  private profile: SpotifyProfile | null = null;
  private playback: SpotifyPlaybackState | null = null;
  private readonly scopes: string[];
  private readonly tokenPath: string;
  private pendingAuth?: { verifier: string; state: string; createdAt: number };
  private callbackServer?: ReturnType<typeof createServer>;
  private callbackPath?: string;

  constructor(private readonly options: SpotifyAuthOptions) {
    super();
    this.scopes = options.scopes?.length ? options.scopes : DEFAULT_SCOPES;
    this.tokenPath = path.join(app.getPath("userData"), TOKEN_FILE);
  }
  override on<T extends keyof AuthEvents>(
    event: T,
    listener: (payload: AuthEvents[T]) => void,
  ): this {
    return super.on(event, listener);
  }
  async initialize() {
    await this.loadTokens();
    if (this.tokens) {
      await this.refreshProfile();
      await this.fetchPlaybackState();
      this.emit("auth-updated", this.getAuthState());
    }
  }
  async beginAuth(): Promise<SpotifyStartAuthResult> {
    this.assertConfig();

    const verifier = base64Url(randomBytes(32));
    const challenge = base64Url(createHash("sha256").update(verifier).digest());
    const state = base64Url(randomBytes(16));
    this.pendingAuth = { verifier, state, createdAt: Date.now() };

    await this.ensureCallbackServer();

    const url = new URL(AUTH_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.options.clientId);
    url.searchParams.set("redirect_uri", this.options.redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("scope", this.scopes.join(" "));

    // Open in default browser for user convenience
    shell.openExternal(url.toString()).catch(() => {
      // Ignore shell errors, caller still receives the URL
    });

    return { state, url: url.toString() };
  }
  async disconnect() {
    this.tokens = null;
    this.profile = null;
    this.playback = null;
    await fs.rm(this.tokenPath, { force: true });
    this.emit("auth-updated", this.getAuthState());
  }
  async finishAuth(code: string, state: string | null) {
    if (!this.pendingAuth) {
      throw new Error("No pending OAuth transaction");
    }
    if (!state || state !== this.pendingAuth.state) {
      throw new Error("State mismatch");
    }
    const { verifier } = this.pendingAuth;
    this.pendingAuth = undefined;

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.options.redirectUri,
      client_id: this.options.clientId,
      code_verifier: verifier,
    });
    if (this.options.clientSecret) {
      body.append("client_secret", this.options.clientSecret);
    }
    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!tokenResponse.ok) {
      const message = await tokenResponse.text();
      throw new Error(`Spotify token exchange failed: ${message}`);
    }
    const data = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
    };

    this.tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      scope: data.scope,
      expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
    };
    await this.saveTokens();
    await this.refreshProfile();
    await this.fetchPlaybackState();
    this.emit("auth-updated", this.getAuthState());
  }
  getAuthState(): SpotifyAuthStatus {
    return {
      connected: Boolean(this.tokens?.accessToken),
      scopes: this.tokens?.scope?.split(" ") ?? this.scopes,
      expiresAt: this.tokens?.expiresAt,
      account: this.profile
        ? {
            id: this.profile.id,
            displayName: this.profile.display_name,
            product: this.profile.product,
            country: this.profile.country,
          }
        : undefined,
      playback: this.playback,
    };
  }
  getPreferredMarket() {
    return this.profile?.country ?? null;
  }
  requestApi(pathname: string, init?: RequestInit) {
    return this.apiFetch(pathname, init);
  }
  async ensurePlaybackDevice(playOnTransfer = false) {
    return this.ensureActiveDevice(playOnTransfer);
  }
  async fetchPlaybackState(): Promise<SpotifyPlaybackState | null> {
    if (!this.tokens) return null;

    try {
      const response = await this.apiFetch("/me/player");
      if (response.status === 204) {
        this.playback = null;
        this.emit("playback-updated", null);
        return null;
      }
      if (!response.ok) {
        if (response.status === 404) {
          this.playback = null;
          this.emit("playback-updated", null);
          return null;
        }
        throw new Error(`Playback fetch failed: ${response.statusText}`);
      }
      const data = await response.json();
      this.playback = {
        isPlaying: Boolean(data.is_playing),
        progressMs: data.progress_ms ?? 0,
        track: data.item
          ? {
              id: data.item.id,
              name: data.item.name,
              album: data.item.album?.name,
              artists: data.item.artists?.map((a: { name: string }) => a.name) ?? [],
              imageUrl: data.item.album?.images?.[0]?.url,
              durationMs: data.item.duration_ms,
            }
          : undefined,
        device: data.device
          ? {
              id: data.device.id,
              name: data.device.name,
              type: data.device.type,
              volumePercent: data.device.volume_percent,
              isActive: data.device.is_active,
            }
          : undefined,
        shuffleState: data.shuffle_state ?? undefined,
        repeatState: data.repeat_state ?? undefined,
        updatedAt: Date.now(),
      };
      this.emit("playback-updated", this.playback);
      this.emit("auth-updated", this.getAuthState());
      return this.playback;
    } catch (error) {
      this.emit("auth-error", error instanceof Error ? error.message : String(error));
      if ((error as Error).message?.includes("401")) {
        await this.refreshTokens();
      }
      return null;
    }
  }
  private async getAvailableDevices() {
    const response = await this.apiFetch("/me/player/devices");
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error("[Spotify] Failed to get devices:", errorText);
      throw new Error(`Failed to load Spotify devices: ${errorText || response.statusText}`);
    }
    const data = await response.json();
    const devices = Array.isArray(data.devices) ? data.devices : [];
    console.log("[Spotify] Available devices:", devices.map((d: any) => ({ id: d.id, name: d.name, is_active: d.is_active, type: d.type })));
    return devices;
  }
  private async ensureActiveDevice(playOnTransfer = false) {
    await this.fetchPlaybackState();
    
    // If we already have an active device, return it
    if (this.playback?.device?.isActive && this.playback.device?.id) {
      return this.playback.device;
    }
    
    // Get all available devices
    const devices = await this.getAvailableDevices();
    
    if (!devices || devices.length === 0) {
      throw new Error("No Spotify devices found. Please open Spotify on your computer, phone, or web player and try again.");
    }
    
    // Prefer an already active device, otherwise use the first available device
    const target = devices.find((device: { is_active: boolean }) => device.is_active) ?? devices[0];
    
    if (!target?.id) {
      throw new Error("No available Spotify devices. Open Spotify on one of your devices and try again.");
    }
    
    // Transfer playback to the target device
    console.log(`[Spotify] Transferring playback to device: ${target.name || target.id} (play: ${playOnTransfer})`);
    const transferResponse = await this.apiFetch("/me/player", {
      method: "PUT",
      body: JSON.stringify({ device_ids: [target.id], play: playOnTransfer }),
    });
    
    // Check if transfer was successful (204 is success, 404 means no active device found)
    if (transferResponse.status === 404) {
      console.error(`[Spotify] Device transfer failed: 404 - Device "${target.name || target.id}" not found or not active`);
      throw new Error(`No active Spotify device found. The device "${target.name || target.id}" is not active. Make sure Spotify is open and try playing something manually first, then try again.`);
    }
    
    if (!transferResponse.ok && transferResponse.status !== 204) {
      const errorText = await transferResponse.text().catch(() => transferResponse.statusText);
      let errorMessage = errorText || transferResponse.statusText;
      try {
        const errorJson = await transferResponse.json().catch(() => null);
        if (errorJson?.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // Ignore JSON parse errors
      }
      console.error(`[Spotify] Device transfer failed: ${transferResponse.status} - ${errorMessage}`);
      throw new Error(`Failed to transfer playback to device "${target.name || target.id}": ${errorMessage}`);
    }
    
    console.log(`[Spotify] Device transfer successful: ${target.name || target.id}`);
    
    // Wait longer for device to be ready, especially if we're trying to play
    await sleep(playOnTransfer ? 800 : 400);
    
    // Verify the device is now active
    await this.fetchPlaybackState();
    
    if (!this.playback?.device?.isActive) {
      // Device transfer might have succeeded but device isn't showing as active yet
      // This can happen, so we'll still return the target device
      console.warn("Device transferred but not showing as active yet:", target);
    }
    
    return target;
  }
  async controlPlayback(command: SpotifyPlaybackCommand): Promise<SpotifyPlaybackState | null> {
    if (!this.tokens) {
      throw new Error("Spotify account is not connected");
    }
    try {
      switch (command.type) {
        case "play":
          try {
            await this.ensureActiveDevice(true);
          } catch (deviceError) {
            // If device activation fails, throw a clear error
            const deviceMsg = deviceError instanceof Error ? deviceError.message : String(deviceError);
            throw new Error(`Cannot play: ${deviceMsg}`);
          }
          console.log("[Spotify] Sending play command");
          const playResponse = await this.apiFetch("/me/player/play", { method: "PUT" });
          if (playResponse.status === 404) {
            console.error("[Spotify] Play failed: 404 - No active device");
            throw new Error("No active Spotify device found. Make sure Spotify is open and playing on at least one device.");
          }
          if (!playResponse.ok && playResponse.status !== 204) {
            const errorText = await playResponse.text().catch(() => playResponse.statusText);
            let errorMessage = errorText || playResponse.statusText;
            try {
              const errorJson = await playResponse.json().catch(() => null);
              if (errorJson?.error?.message) {
                errorMessage = errorJson.error.message;
              }
            } catch {
              // Ignore JSON parse errors
            }
            console.error(`[Spotify] Play failed: ${playResponse.status} - ${errorMessage}`);
            throw new Error(`Failed to play: ${errorMessage}`);
          }
          console.log("[Spotify] Play command successful");
          break;
        case "pause":
          const pauseResponse = await this.apiFetch("/me/player/pause", { method: "PUT" });
          if (!pauseResponse.ok && pauseResponse.status !== 204) {
            const errorText = await pauseResponse.text().catch(() => pauseResponse.statusText);
            throw new Error(`Failed to pause: ${errorText || pauseResponse.statusText}`);
          }
          break;
        case "toggle-play":
          if (!this.playback?.isPlaying) {
            try {
              await this.ensureActiveDevice(true);
            } catch (deviceError) {
              // If device activation fails, throw a clear error
              const deviceMsg = deviceError instanceof Error ? deviceError.message : String(deviceError);
              throw new Error(`Cannot play: ${deviceMsg}`);
            }
            const togglePlayResponse = await this.apiFetch("/me/player/play", { method: "PUT" });
            if (togglePlayResponse.status === 404) {
              throw new Error("No active Spotify device found. Make sure Spotify is open and playing on at least one device.");
            }
            if (!togglePlayResponse.ok && togglePlayResponse.status !== 204) {
              const errorText = await togglePlayResponse.text().catch(() => togglePlayResponse.statusText);
              let errorMessage = errorText || togglePlayResponse.statusText;
              try {
                const errorJson = await togglePlayResponse.json().catch(() => null);
                if (errorJson?.error?.message) {
                  errorMessage = errorJson.error.message;
                }
              } catch {
                // Ignore JSON parse errors
              }
              throw new Error(`Failed to play: ${errorMessage}`);
            }
          } else {
            const togglePauseResponse = await this.apiFetch("/me/player/pause", { method: "PUT" });
            if (!togglePauseResponse.ok && togglePauseResponse.status !== 204) {
              const errorText = await togglePauseResponse.text().catch(() => togglePauseResponse.statusText);
              let errorMessage = errorText || togglePauseResponse.statusText;
              try {
                const errorJson = await togglePauseResponse.json().catch(() => null);
                if (errorJson?.error?.message) {
                  errorMessage = errorJson.error.message;
                }
              } catch {
                // Ignore JSON parse errors
              }
              throw new Error(`Failed to pause: ${errorMessage}`);
            }
          }
          break;
        case "next":
          await this.ensureActiveDevice(true);
          const nextResponse = await this.apiFetch("/me/player/next", { method: "POST" });
          if (!nextResponse.ok && nextResponse.status !== 204) {
            const errorText = await nextResponse.text().catch(() => nextResponse.statusText);
            throw new Error(`Failed to skip: ${errorText || nextResponse.statusText}`);
          }
          break;
        case "previous":
          await this.ensureActiveDevice(true);
          const prevResponse = await this.apiFetch("/me/player/previous", { method: "POST" });
          if (!prevResponse.ok && prevResponse.status !== 204) {
            const errorText = await prevResponse.text().catch(() => prevResponse.statusText);
            throw new Error(`Failed to go back: ${errorText || prevResponse.statusText}`);
          }
          break;
        case "set-volume": {
          await this.ensureActiveDevice(false);
          const value = Math.min(100, Math.max(0, Math.round(command.value)));
          const volumeResponse = await this.apiFetch(`/me/player/volume?volume_percent=${value}`, { method: "PUT" });
          if (!volumeResponse.ok && volumeResponse.status !== 204) {
            const errorText = await volumeResponse.text().catch(() => volumeResponse.statusText);
            throw new Error(`Failed to set volume: ${errorText || volumeResponse.statusText}`);
          }
          break;
        }
        case "set-shuffle":
          await this.ensureActiveDevice(false);
          const shuffleResponse = await this.apiFetch(`/me/player/shuffle?state=${command.value}`, { method: "PUT" });
          if (!shuffleResponse.ok && shuffleResponse.status !== 204) {
            const errorText = await shuffleResponse.text().catch(() => shuffleResponse.statusText);
            throw new Error(`Failed to set shuffle: ${errorText || shuffleResponse.statusText}`);
          }
          break;
        case "refresh":
          return this.fetchPlaybackState();
        default:
          break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit("auth-error", message);
      throw error;
    }
    return this.fetchPlaybackState();
  }
  private assertConfig() {
    if (!this.options.clientId || !this.options.redirectUri) {
      throw new Error("Spotify credentials are not configured");
    }
    if (!isHttpRedirect(this.options.redirectUri)) {
      throw new Error("SPOTIFY_REDIRECT_URI must be a valid HTTP/S URL");
    }
    const parsed = new URL(this.options.redirectUri);
    if (parsed.protocol !== "http:") {
      throw new Error("SPOTIFY_REDIRECT_URI must use http:// for the local callback server");
    }
  }
  private async apiFetch(pathname: string, init?: RequestInit, retry = true) {
    await this.ensureValidAccessToken();
    if (!this.tokens) {
      throw new Error("Spotify access token is not available");
    }
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${this.tokens.accessToken}`);
    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`${API_BASE}${pathname}`, {
      ...init,
      headers,
    });

    if (response.status === 401 && retry) {
      await this.refreshTokens();
      return this.apiFetch(pathname, init, false);
    }
    return response;
  }
  private async ensureValidAccessToken() {
    if (!this.tokens) return;
    if (Date.now() < this.tokens.expiresAt - 30_000) return;
    await this.refreshTokens();
  }
  private async refreshTokens() {
    if (!this.tokens?.refreshToken) {
      await this.disconnect();
      return;
    }
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.tokens.refreshToken,
      client_id: this.options.clientId,
    });
    if (this.options.clientSecret) {
      body.append("client_secret", this.options.clientSecret);
    }
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      await this.disconnect();
      throw new Error(`Failed to refresh Spotify token: ${response.statusText}`);
    }
    const data = await response.json();
    this.tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? this.tokens.refreshToken,
      scope: data.scope ?? this.tokens.scope,
      expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
    };
    await this.saveTokens();
  }
  private async refreshProfile() {
    if (!this.tokens) return;
    const response = await this.apiFetch("/me");
    if (!response.ok) return;
    this.profile = await response.json();
  }
  private async loadTokens() {
    try {
      const contents = await fs.readFile(this.tokenPath, "utf8");
      const keySource = this.options.clientSecret || this.options.clientId;
      const decrypted = decryptPayload(contents, keySource);
      this.tokens = JSON.parse(decrypted);
    } catch {
      this.tokens = null;
    }
  }
  private async saveTokens() {
    if (!this.tokens) {
      await fs.rm(this.tokenPath, { force: true });
      return;
    }
    const payload = JSON.stringify(this.tokens);
    const keySource = this.options.clientSecret || this.options.clientId;
    const encrypted = encryptPayload(payload, keySource);
    await fs.writeFile(this.tokenPath, encrypted, "utf8");
  }
  private async ensureCallbackServer() {
    if (this.callbackServer) return;
    const redirect = new URL(this.options.redirectUri);
    if (redirect.protocol !== "http:") {
      throw new Error("Local callback server only supports http:// redirects");
    }
    this.callbackPath = redirect.pathname;

    this.callbackServer = createServer((req, res) => this.handleCallback(req, res));
    const port = Number(redirect.port || 80);

    await new Promise<void>((resolve, reject) => {
      this.callbackServer!.once("error", reject);
      this.callbackServer!.listen(port, redirect.hostname, () => {
        this.callbackServer?.off("error", reject);
        resolve();
      });
    });
  }
  private async handleCallback(req: IncomingMessage, res: ServerResponse) {
    if (!req.url || !this.callbackPath) {
      res.writeHead(400).end("Spotify callback misconfigured.");
      return;
    }
    const incoming = new URL(req.url, `http://${req.headers.host}`);
    if (incoming.pathname !== this.callbackPath) {
      res.writeHead(404).end("Not found");
      return;
    }
    const code = incoming.searchParams.get("code");
    const state = incoming.searchParams.get("state");
    const error = incoming.searchParams.get("error");

    try {
      if (error) {
        throw new Error(error);
      }
      if (!code) {
        throw new Error("Missing authorization code");
      }
      await this.finishAuth(code, state);
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<html><body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background:#0f172a; color:white; text-align:center; padding-top:40px;">
        <h1>Spotify connected</h1>
        <p>You can close this tab and return to Sky.</p>
      </body></html>`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(`<html><body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background:#0f172a; color:white; text-align:center; padding-top:40px;">
        <h1>Something went wrong</h1>
        <p>${message}</p>
        <p>You can close this tab and try connecting again.</p>
      </body></html>`);
      this.emit("auth-error", message);
    } finally {
      setTimeout(() => {
        this.callbackServer?.close();
        this.callbackServer = undefined;
      }, 250);
    }
  }
}
