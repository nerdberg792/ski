import { exec } from "child_process";
import { promisify } from "util";
import { shell } from "electron";
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

export interface BrowserBookmark {
  id: string;
  title: string;
  url: string;
  folder?: string;
  browser: string;
}

/**
 * Get Safari bookmarks using AppleScript
 * Note: Safari bookmarks via AppleScript are limited and unreliable.
 * For better results, use Chrome-based browsers which read from JSON files.
 */
async function getSafariBookmarks(): Promise<BrowserBookmark[]> {
  try {
    // Safari's AppleScript dictionary for bookmarks is very limited
    // We can try to access bookmarks via the reading list or use a simpler approach
    // For now, we'll return empty and rely on Chrome-based browsers
    // Safari bookmarks would require accessing the Safari bookmarks.plist file directly
    // which is more complex and may require additional permissions
    
    console.log("📖 [Browser Bookmarks] Safari bookmarks via AppleScript are limited, skipping");
    return [];
  } catch (error) {
    console.error("Error getting Safari bookmarks:", error);
    return [];
  }
}

/**
 * Get Chrome bookmarks from bookmarks file
 */
async function getChromeBookmarks(browserName: string = "chrome"): Promise<BrowserBookmark[]> {
  try {
    const browserPaths: Record<string, string> = {
      chrome: "Library/Application Support/Google/Chrome/Default/Bookmarks",
      edge: "Library/Application Support/Microsoft Edge/Default/Bookmarks",
      brave: "Library/Application Support/BraveSoftware/Brave-Browser/Default/Bookmarks",
      arc: "Library/Application Support/Arc/User Data/Default/Bookmarks",
      vivaldi: "Library/Application Support/Vivaldi/Default/Bookmarks",
    };

    const bookmarksPath = path.join(homedir(), browserPaths[browserName] || browserPaths.chrome);

    try {
      await fs.access(bookmarksPath);
    } catch {
      return [];
    }

    const bookmarksData = await fs.readFile(bookmarksPath, "utf-8");
    const bookmarksJson = JSON.parse(bookmarksData);
    const bookmarks: BrowserBookmark[] = [];

    function extractBookmarks(node: any, folder: string = ""): void {
      if (node.type === "url") {
        bookmarks.push({
          id: `${browserName}-${node.id || Date.now()}`,
          title: node.name || "",
          url: node.url || "",
          folder,
          browser: browserName,
        });
      } else if (node.children) {
        const currentFolder = folder ? `${folder}/${node.name || ""}` : (node.name || "");
        for (const child of node.children) {
          extractBookmarks(child, currentFolder);
        }
      }
    }

    if (bookmarksJson.roots) {
      for (const rootKey of Object.keys(bookmarksJson.roots)) {
        extractBookmarks(bookmarksJson.roots[rootKey], rootKey);
      }
    }

    return bookmarks;
  } catch (error) {
    console.error(`Error getting ${browserName} bookmarks:`, error);
    return [];
  }
}

/**
 * Search bookmarks across browsers
 */
export async function searchBookmarks(
  query: string,
  browser: string = "all",
): Promise<{ success: boolean; bookmarks?: BrowserBookmark[]; error?: string }> {
  try {
    console.log("🔖 [Browser Bookmarks] Searching bookmarks:", query, "in browser:", browser);

    const allBookmarks: BrowserBookmark[] = [];
    const browsersToSearch = browser === "all"
      ? ["safari", "chrome", "edge", "brave", "arc", "vivaldi"]
      : [browser.toLowerCase()];

    for (const browserName of browsersToSearch) {
      try {
        if (browserName === "safari") {
          const safariBookmarks = await getSafariBookmarks();
          allBookmarks.push(...safariBookmarks);
        } else {
          const chromeBookmarks = await getChromeBookmarks(browserName);
          allBookmarks.push(...chromeBookmarks);
        }
      } catch (error) {
        console.warn(`⚠️ [Browser Bookmarks] Failed to get ${browserName} bookmarks:`, error);
      }
    }

    // Simple search - filter by title or URL containing query
    const queryLower = query.toLowerCase();
    const filtered = allBookmarks.filter(
      (bookmark) =>
        bookmark.title.toLowerCase().includes(queryLower) ||
        bookmark.url.toLowerCase().includes(queryLower)
    );

    console.log(`✅ [Browser Bookmarks] Found ${filtered.length} matching bookmarks`);
    return { success: true, bookmarks: filtered };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Browser Bookmarks] Search failed:", message);
    return { success: false, error: `Failed to search bookmarks: ${message}` };
  }
}

/**
 * Open a bookmark URL
 */
export async function openBookmark(
  url: string,
  browser?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🔖 [Browser Bookmarks] Opening bookmark:", url, "in browser:", browser || "default");

    if (browser) {
      // Open with specific browser
      const escapedUrl = escapeDoubleQuotes(url);
      const escapedBrowser = escapeDoubleQuotes(browser);
      
      const script = `
        tell application "${escapedBrowser}"
          activate
          open location "${escapedUrl}"
        end tell
      `;

      await runAppleScript(script);
    } else {
      // Open with default browser
      await shell.openExternal(url);
    }

    console.log("✅ [Browser Bookmarks] Bookmark opened successfully");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Browser Bookmarks] Failed to open bookmark:", message);
    return { success: false, error: `Failed to open bookmark: ${message}` };
  }
}

