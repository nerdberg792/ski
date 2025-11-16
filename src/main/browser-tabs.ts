import { exec } from "child_process";
import { promisify } from "util";
import { shell } from "electron";

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

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  windowId: string;
  tabIndex: number;
  browser: string;
}

/**
 * Get Safari tabs
 */
async function getSafariTabs(): Promise<BrowserTab[]> {
  try {
    const script = `
      tell application "Safari"
        activate
        set tabList to {}
        set windowCount to count of windows
        
        repeat with w from 1 to windowCount
          set currentWindow to window w
          set tabCount to count of tabs of currentWindow
          
          repeat with t from 1 to tabCount
            set currentTab to tab t of currentWindow
            set tabTitle to name of currentTab as string
            set tabURL to URL of currentTab as string
            set tabId to "safari-w" & w & "-t" & t & "|" & tabTitle & "|" & tabURL
            set end of tabList to tabId
          end repeat
        end repeat
        
        return tabList
      end tell
    `;

    const result = await runAppleScript(script);
    const tabs: BrowserTab[] = [];

    if (result && result.trim() !== "") {
      const lines = result.split(", ");
      for (const line of lines) {
        if (line && line.includes("|")) {
          const parts = line.split("|");
          if (parts.length >= 3) {
            const idParts = parts[0].split("-");
            const windowId = idParts[1]?.replace("w", "") || "1";
            const tabIndex = parseInt(idParts[2]?.replace("t", "") || "1");
            
            tabs.push({
              id: parts[0] || "",
              title: parts[1]?.trim() || "",
              url: parts[2]?.trim() || "",
              windowId,
              tabIndex,
              browser: "safari",
            });
          }
        }
      }
    }

    return tabs;
  } catch (error) {
    console.error("Error getting Safari tabs:", error);
    return [];
  }
}

/**
 * Get Chrome tabs using AppleScript
 */
async function getChromeTabs(browserName: string = "chrome"): Promise<BrowserTab[]> {
  try {
    const browserAppName = browserName === "chrome" ? "Google Chrome" : 
                          browserName === "edge" ? "Microsoft Edge" :
                          browserName === "brave" ? "Brave Browser" :
                          browserName === "arc" ? "Arc" :
                          browserName === "vivaldi" ? "Vivaldi" : "Google Chrome";

    const script = `
      tell application "${browserAppName}"
        activate
        set tabList to {}
        set windowCount to count of windows
        
        repeat with w from 1 to windowCount
          set currentWindow to window w
          set tabCount to count of tabs of currentWindow
          
          repeat with t from 1 to tabCount
            set currentTab to tab t of currentWindow
            set tabTitle to title of currentTab as string
            set tabURL to URL of currentTab as string
            set tabId to "${browserName}-w" & w & "-t" & t & "|" & tabTitle & "|" & tabURL
            set end of tabList to tabId
          end repeat
        end repeat
        
        return tabList
      end tell
    `;

    const result = await runAppleScript(script);
    const tabs: BrowserTab[] = [];

    if (result && result.trim() !== "") {
      const lines = result.split(", ");
      for (const line of lines) {
        if (line && line.includes("|")) {
          const parts = line.split("|");
          if (parts.length >= 3) {
            const idParts = parts[0].split("-");
            const windowId = idParts[1]?.replace("w", "") || "1";
            const tabIndex = parseInt(idParts[2]?.replace("t", "") || "1");
            
            tabs.push({
              id: parts[0] || "",
              title: parts[1]?.trim() || "",
              url: parts[2]?.trim() || "",
              windowId,
              tabIndex,
              browser: browserName,
            });
          }
        }
      }
    }

    return tabs;
  } catch (error) {
    console.error(`Error getting ${browserName} tabs:`, error);
    return [];
  }
}

/**
 * Search browser tabs
 */
export async function searchTabs(
  query: string,
  browser: string = "all",
): Promise<{ success: boolean; tabs?: BrowserTab[]; error?: string }> {
  try {
    console.log("📑 [Browser Tabs] Searching tabs:", query, "in browser:", browser);

    const allTabs: BrowserTab[] = [];
    const browsersToSearch = browser === "all"
      ? ["safari", "chrome", "edge", "brave", "arc", "vivaldi"]
      : [browser.toLowerCase()];

    for (const browserName of browsersToSearch) {
      try {
        if (browserName === "safari") {
          const safariTabs = await getSafariTabs();
          allTabs.push(...safariTabs);
        } else if (["chrome", "edge", "brave", "arc", "vivaldi"].includes(browserName)) {
          const chromeTabs = await getChromeTabs(browserName);
          allTabs.push(...chromeTabs);
        }
      } catch (error) {
        console.warn(`⚠️ [Browser Tabs] Failed to get ${browserName} tabs:`, error);
      }
    }

    // If query is "all" or empty, return all tabs without filtering
    const queryLower = query.toLowerCase().trim();
    let filtered = allTabs;
    if (queryLower && queryLower !== "all") {
      // Simple search - filter by title or URL containing query
      filtered = allTabs.filter(
        (tab) =>
          tab.title.toLowerCase().includes(queryLower) ||
          tab.url.toLowerCase().includes(queryLower)
      );
    }

    console.log(`✅ [Browser Tabs] Found ${filtered.length} matching tabs`);
    return { success: true, tabs: filtered };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Browser Tabs] Search failed:", message);
    return { success: false, error: `Failed to search tabs: ${message}` };
  }
}

/**
 * Close a browser tab
 */
export async function closeTab(
  browser: string,
  windowId: string,
  tabIndex: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("📑 [Browser Tabs] Closing tab:", browser, windowId, tabIndex);

    if (browser.toLowerCase() === "chrome") {
      // Use existing Chrome close tab functionality
      // This would integrate with existing chrome-close-tab action
      return { success: false, error: "Use chrome-close-tab action for Chrome tabs" };
    } else if (browser.toLowerCase() === "safari") {
      const escapedWindowId = escapeDoubleQuotes(windowId);
      const tabIdx = parseInt(String(tabIndex));

      const script = `
        tell application "Safari"
          activate
          set targetWindow to window ${escapedWindowId}
          set targetTab to tab ${tabIdx} of targetWindow
          close targetTab
        end tell
      `;

      await runAppleScript(script);
      console.log("✅ [Browser Tabs] Tab closed successfully");
      return { success: true };
    }

    return { success: false, error: `Browser ${browser} not supported for tab closing` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Browser Tabs] Failed to close tab:", message);
    return { success: false, error: `Failed to close tab: ${message}` };
  }
}

