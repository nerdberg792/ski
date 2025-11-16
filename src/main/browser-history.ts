import { exec } from "child_process";
import { promisify } from "util";
import { shell } from "electron";
import * as fs from "fs/promises";
import * as path from "path";
import { homedir } from "os";

const execAsync = promisify(exec);

export interface BrowserHistoryEntry {
  id: string;
  url: string;
  title: string;
  visitCount?: number;
  lastVisitTime?: string;
  browser: string;
}

/**
 * Get Safari history using AppleScript (limited)
 */
async function getSafariHistory(): Promise<BrowserHistoryEntry[]> {
  try {
    // Safari history is harder to access via AppleScript
    // This is a simplified version
    const script = `
      tell application "Safari"
        activate
        -- Safari history access is limited via AppleScript
        return "limited"
      end tell
    `;

    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    // Safari history requires database access which is complex
    return [];
  } catch (error) {
    console.error("Error getting Safari history:", error);
    return [];
  }
}

/**
 * Get Chrome-based browser history from History database
 */
async function getChromeHistory(browserName: string = "chrome", limit: number = 20): Promise<BrowserHistoryEntry[]> {
  try {
    const browserPaths: Record<string, string> = {
      chrome: "Library/Application Support/Google/Chrome/Default/History",
      edge: "Library/Application Support/Microsoft Edge/Default/History",
      brave: "Library/Application Support/BraveSoftware/Brave-Browser/Default/History",
      arc: "Library/Application Support/Arc/User Data/Default/History",
      vivaldi: "Library/Application Support/Vivaldi/Default/History",
    };

    const historyPath = path.join(homedir(), browserPaths[browserName] || browserPaths.chrome);

    try {
      await fs.access(historyPath);
    } catch {
      return [];
    }

    // Chrome history is in SQLite format, but reading it requires sqlite3 or similar
    // For now, return empty array - full implementation would require SQLite library
    // This is a placeholder that indicates the functionality exists
    console.log(`📜 [Browser History] History database found for ${browserName}, but SQLite access needed`);
    return [];
  } catch (error) {
    console.error(`Error getting ${browserName} history:`, error);
    return [];
  }
}

/**
 * Search browser history
 */
export async function searchHistory(
  query: string,
  browser: string = "all",
  limit: number = 20,
): Promise<{ success: boolean; entries?: BrowserHistoryEntry[]; error?: string }> {
  try {
    console.log("📜 [Browser History] Searching history:", query, "in browser:", browser, "limit:", limit);

    const allEntries: BrowserHistoryEntry[] = [];
    const browsersToSearch = browser === "all"
      ? ["chrome", "edge", "brave", "arc", "vivaldi"]
      : [browser.toLowerCase()];

    for (const browserName of browsersToSearch) {
      try {
        if (browserName === "safari") {
          const safariHistory = await getSafariHistory();
          allEntries.push(...safariHistory);
        } else {
          const chromeHistory = await getChromeHistory(browserName, limit);
          allEntries.push(...chromeHistory);
        }
      } catch (error) {
        console.warn(`⚠️ [Browser History] Failed to get ${browserName} history:`, error);
      }
    }

    // Simple search - filter by title or URL containing query
    const queryLower = query.toLowerCase();
    const filtered = allEntries
      .filter(
        (entry) =>
          entry.title.toLowerCase().includes(queryLower) ||
          entry.url.toLowerCase().includes(queryLower)
      )
      .slice(0, limit);

    console.log(`✅ [Browser History] Found ${filtered.length} matching entries`);
    return { success: true, entries: filtered };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Browser History] Search failed:", message);
    return { success: false, error: `Failed to search history: ${message}` };
  }
}

/**
 * Open a history entry URL
 */
export async function openHistoryUrl(
  url: string,
  browser?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("📜 [Browser History] Opening URL:", url, "in browser:", browser || "default");

    if (browser) {
      const escapedUrl = url.replace(/"/g, '\\"');
      const escapedBrowser = browser.replace(/"/g, '\\"');
      
      const script = `
        tell application "${escapedBrowser}"
          activate
          open location "${escapedUrl}"
        end tell
      `;

      await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    } else {
      await shell.openExternal(url);
    }

    console.log("✅ [Browser History] URL opened successfully");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Browser History] Failed to open URL:", message);
    return { success: false, error: `Failed to open URL: ${message}` };
  }
}

