import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { homedir } from "os";

const execAsync = promisify(exec);

/**
 * Escape double quotes in a string for AppleScript
 */
function escapeDoubleQuotes(value: string): string {
  return value.replace(/"/g, '\\"');
}

/**
 * Execute an AppleScript command
 */
async function runAppleScript(script: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(
      `osascript -e '${script.replace(/'/g, "'\\''")}'`,
      { timeout: 30000 }
    );

    if (stderr && (
      stderr.toLowerCase().includes("execution error") ||
      stderr.toLowerCase().includes("got an error")
    )) {
      throw new Error(stderr);
    }

    return stdout.trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`AppleScript error: ${message}`);
  }
}

export interface BrowserProfile {
  id: string;
  name: string;
  path: string;
  browser: string;
}

/**
 * List Chrome profiles
 */
async function listChromeProfiles(browserName: string = "chrome"): Promise<BrowserProfile[]> {
  try {
    const browserPaths: Record<string, string> = {
      chrome: "Library/Application Support/Google/Chrome",
      edge: "Library/Application Support/Microsoft Edge",
      brave: "Library/Application Support/BraveSoftware/Brave-Browser",
      arc: "Library/Application Support/Arc/User Data",
      vivaldi: "Library/Application Support/Vivaldi",
    };

    const browserPath = path.join(homedir(), browserPaths[browserName] || browserPaths.chrome);

    try {
      await fs.access(browserPath);
    } catch {
      return [];
    }

    const profiles: BrowserProfile[] = [];
    const entries = await fs.readdir(browserPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Check if it's a profile directory (contains Preferences file)
        const prefsPath = path.join(browserPath, entry.name, "Preferences");
        try {
          await fs.access(prefsPath);
          profiles.push({
            id: `${browserName}-${entry.name}`,
            name: entry.name === "Default" ? "Default Profile" : entry.name,
            path: path.join(browserPath, entry.name),
            browser: browserName,
          });
        } catch {
          // Not a profile directory
        }
      }
    }

    return profiles;
  } catch (error) {
    console.error(`Error listing ${browserName} profiles:`, error);
    return [];
  }
}

/**
 * List Firefox profiles
 */
async function listFirefoxProfiles(): Promise<BrowserProfile[]> {
  try {
    const firefoxPath = path.join(homedir(), "Library/Application Support/Firefox/Profiles");

    try {
      await fs.access(firefoxPath);
    } catch {
      return [];
    }

    const profiles: BrowserProfile[] = [];
    const entries = await fs.readdir(firefoxPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Firefox profile directories typically start with random string
        const prefsPath = path.join(firefoxPath, entry.name, "prefs.js");
        try {
          await fs.access(prefsPath);
          // Try to read profile name from prefs.js
          let profileName = entry.name;
          try {
            const prefsContent = await fs.readFile(prefsPath, "utf-8");
            const nameMatch = prefsContent.match(/user_pref\("profile\.name",\s*"([^"]+)"\)/);
            if (nameMatch) {
              profileName = nameMatch[1];
            }
          } catch {
            // Use directory name if we can't read prefs
          }

          profiles.push({
            id: `firefox-${entry.name}`,
            name: profileName,
            path: path.join(firefoxPath, entry.name),
            browser: "firefox",
          });
        } catch {
          // Not a valid profile
        }
      }
    }

    return profiles;
  } catch (error) {
    console.error("Error listing Firefox profiles:", error);
    return [];
  }
}

/**
 * List browser profiles
 */
export async function listProfiles(
  browser: string,
): Promise<{ success: boolean; profiles?: BrowserProfile[]; error?: string }> {
  try {
    console.log("👤 [Browser Profiles] Listing profiles for:", browser);

    const browserLower = browser.toLowerCase();
    let profiles: BrowserProfile[] = [];

    if (browserLower === "firefox") {
      profiles = await listFirefoxProfiles();
    } else if (["chrome", "edge", "brave", "arc", "vivaldi"].includes(browserLower)) {
      profiles = await listChromeProfiles(browserLower);
    } else {
      return { success: false, error: `Browser ${browser} not supported for profile listing` };
    }

    console.log(`✅ [Browser Profiles] Found ${profiles.length} profiles`);
    return { success: true, profiles };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Browser Profiles] Failed to list profiles:", message);
    return { success: false, error: `Failed to list profiles: ${message}` };
  }
}

/**
 * Open browser with specific profile
 */
export async function openBrowserProfile(
  browser: string,
  profile: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("👤 [Browser Profiles] Opening browser:", browser, "with profile:", profile);

    const browserLower = browser.toLowerCase();
    const escapedBrowser = escapeDoubleQuotes(browser);
    const escapedProfile = escapeDoubleQuotes(profile);

    if (browserLower === "chrome" || browserLower === "edge" || browserLower === "brave") {
      // Chrome-based browsers use --profile-directory flag
      const profileDir = profile.includes("/") ? path.basename(profile) : profile;
      await execAsync(`open -a "${escapedBrowser}" --args --profile-directory="${escapedProfile}"`);
    } else if (browserLower === "firefox") {
      // Firefox uses -P flag
      await execAsync(`open -a "Firefox" --args -P "${escapedProfile}"`);
    } else {
      return { success: false, error: `Browser ${browser} not supported for profile opening` };
    }

    console.log("✅ [Browser Profiles] Browser opened with profile");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Browser Profiles] Failed to open profile:", message);
    return { success: false, error: `Failed to open profile: ${message}` };
  }
}

