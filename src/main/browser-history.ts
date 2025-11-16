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
 * Get Chrome-based browser history from History database using SQLite
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
      console.log(`📜 [Browser History] History database not found for ${browserName}`);
      return [];
    }

    // Chrome locks the History database when it's running, so we need to copy it first
    const tempHistoryPath = path.join(homedir(), `.sky-temp-history-${Date.now()}`);
    
    try {
      // Copy the database to a temp location to avoid locking issues
      await fs.copyFile(historyPath, tempHistoryPath);
      
      // Query the SQLite database using sqlite3 command
      // Chrome stores history in 'urls' table with columns: id, url, title, visit_count, last_visit_time
      // Create a temporary SQL file with the commands
      const query = `SELECT id, url, title, visit_count, last_visit_time FROM urls WHERE hidden = 0 ORDER BY last_visit_time DESC LIMIT ${limit * 2}`;
      const tempSqlPath = path.join(homedir(), `.sky-temp-sql-${Date.now()}`);
      const sqlCommands = `.mode list\n.separator |\n${query}`;
      await fs.writeFile(tempSqlPath, sqlCommands);
      
      const sqliteCommand = `sqlite3 "${tempHistoryPath}" < "${tempSqlPath}"`;
      const { stdout } = await execAsync(sqliteCommand, { timeout: 10000 });
      
      // Clean up temp SQL file
      await fs.unlink(tempSqlPath).catch(() => {});
      
      // Clean up temp file
      await fs.unlink(tempHistoryPath).catch(() => {});
      
      const entries: BrowserHistoryEntry[] = [];
      
      if (stdout && stdout.trim()) {
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          if (!line || line.trim() === '') continue;
          
          // SQLite outputs pipe-separated values when using .mode list
          const parts = line.split('|');
          if (parts.length >= 5) {
            const id = parts[0]?.trim() || '';
            const url = parts[1]?.trim() || '';
            const title = parts[2]?.trim() || '';
            const visitCount = parseInt(parts[3]?.trim() || '0', 10);
            const lastVisitTime = parts[4]?.trim() || '';
            
            // Convert Chrome timestamp (microseconds since 1601-01-01) to readable date
            let lastVisitDate = '';
            if (lastVisitTime) {
              try {
                // Chrome timestamp is in microseconds since 1601-01-01
                // Convert to milliseconds and adjust epoch
                const chromeEpoch = Date.UTC(1601, 0, 1);
                const timestamp = parseInt(lastVisitTime, 10) / 1000 + chromeEpoch;
                const date = new Date(timestamp);
                lastVisitDate = date.toISOString();
              } catch {
                // If conversion fails, use raw value
                lastVisitDate = lastVisitTime;
              }
            }
            
            entries.push({
              id: `${browserName}-${id}`,
              url,
              title: title || url,
              visitCount,
              lastVisitTime: lastVisitDate,
              browser: browserName,
            });
          }
        }
      }
      
      console.log(`📜 [Browser History] Retrieved ${entries.length} entries from ${browserName}`);
      return entries;
    } catch (copyError) {
      // If copy fails, try reading directly (might work if Chrome is closed)
      console.log(`📜 [Browser History] Could not copy database, trying direct access`);
      
      try {
        const query = `SELECT id, url, title, visit_count, last_visit_time FROM urls WHERE hidden = 0 ORDER BY last_visit_time DESC LIMIT ${limit * 2}`;
        const tempSqlPath = path.join(homedir(), `.sky-temp-sql-${Date.now()}`);
        const sqlCommands = `.mode list\n.separator |\n${query}`;
        await fs.writeFile(tempSqlPath, sqlCommands);
        
        const sqliteCommand = `sqlite3 "${historyPath}" < "${tempSqlPath}"`;
        const { stdout } = await execAsync(sqliteCommand, { timeout: 10000 });
        
        // Clean up temp SQL file
        await fs.unlink(tempSqlPath).catch(() => {});
        
        const entries: BrowserHistoryEntry[] = [];
        
        if (stdout && stdout.trim()) {
          const lines = stdout.trim().split('\n');
          for (const line of lines) {
            if (!line || line.trim() === '') continue;
            
            const parts = line.split('|');
            if (parts.length >= 5) {
              const id = parts[0]?.trim() || '';
              const url = parts[1]?.trim() || '';
              const title = parts[2]?.trim() || '';
              const visitCount = parseInt(parts[3]?.trim() || '0', 10);
              const lastVisitTime = parts[4]?.trim() || '';
              
              let lastVisitDate = '';
              if (lastVisitTime) {
                try {
                  const chromeEpoch = Date.UTC(1601, 0, 1);
                  const timestamp = parseInt(lastVisitTime, 10) / 1000 + chromeEpoch;
                  const date = new Date(timestamp);
                  lastVisitDate = date.toISOString();
                } catch {
                  lastVisitDate = lastVisitTime;
                }
              }
              
              entries.push({
                id: `${browserName}-${id}`,
                url,
                title: title || url,
                visitCount,
                lastVisitTime: lastVisitDate,
                browser: browserName,
              });
            }
          }
        }
        
        console.log(`📜 [Browser History] Retrieved ${entries.length} entries from ${browserName} (direct access)`);
        return entries;
      } catch (directError) {
        console.error(`📜 [Browser History] Failed to read ${browserName} history:`, directError);
        // Clean up temp file if it exists
        await fs.unlink(tempHistoryPath).catch(() => {});
        return [];
      }
    }
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

