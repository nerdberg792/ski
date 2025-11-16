import { exec } from "child_process";
import { promisify } from "util";
import { shell } from "electron";
import * as fs from "fs/promises";
import * as path from "path";

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

/**
 * Create a file in the active Finder window
 */
export async function createFileInFinder(
  filename: string,
  autoOpen: boolean = false,
): Promise<{ success: boolean; error?: string; filePath?: string }> {
  try {
    console.log("📁 [Finder] Creating file:", filename, "autoOpen:", autoOpen);

    const escapedFilename = escapeDoubleQuotes(filename);
    const extension = filename.split(".").pop() || "";

    let script = `
      if application "Finder" is not running then
        return "Finder not running"
      end if

      tell application "Finder"
        try
          set insertionLocation to insertion location
          set pathList to quoted form of POSIX path of (insertionLocation as alias)
          
          if exists (POSIX path of (insertionLocation as alias)) & "${escapedFilename}" as POSIX file then
            return "Already exists|" & pathList
          end if
        on error
          return "No active window"
        end try
      end tell

      set command to "touch " & pathList & "${escapedFilename}"
      do shell script command

      return "SUCCESS|" & pathList
    `;

    const result = await runAppleScript(script);
    console.log("📁 [Finder] Create file result:", result);

    if (result.includes("Finder not running")) {
      return { success: false, error: "Finder is not running" };
    }

    if (result.includes("No active window")) {
      return { success: false, error: "No active Finder window" };
    }

    if (result.includes("Already exists")) {
      const parts = result.split("|");
      const filePath = parts[1]?.replace(/^'|'$/g, "") + filename;
      return { success: false, error: "File already exists", filePath };
    }

    if (result.includes("SUCCESS")) {
      const parts = result.split("|");
      const dirPath = parts[1]?.replace(/^'|'$/g, "");
      const filePath = dirPath + filename;

      // Auto-open if requested and extension matches
      if (autoOpen) {
        try {
          await shell.openPath(filePath);
          console.log("✅ [Finder] File created and opened:", filePath);
        } catch (error) {
          console.error("⚠️ [Finder] Failed to auto-open file:", error);
        }
      }

      return { success: true, filePath };
    }

    return { success: false, error: "Unknown error occurred" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Finder] Failed to create file:", message);
    return { success: false, error: `Failed to create file: ${message}` };
  }
}

/**
 * Open a file or folder
 */
export async function openFile(
  filePath: string,
  application?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("📂 [Finder] Opening file:", filePath, "with app:", application || "default");

    // Expand ~ to home directory
    const expandedPath = filePath.startsWith("~")
      ? filePath.replace("~", process.env.HOME || "")
      : filePath;

    // Check if file exists
    try {
      await fs.access(expandedPath);
    } catch {
      return { success: false, error: "File or folder does not exist" };
    }

    if (application) {
      // Open with specific application
      const escapedApp = escapeDoubleQuotes(application);
      const escapedPath = escapeDoubleQuotes(expandedPath);
      
      const script = `
        set command to "open -a ${escapedApp} ${escapedPath}"
        try
          do shell script command
          return "SUCCESS"
        on error err
          return "ERROR: " & err
        end try
      `;

      const result = await runAppleScript(script);
      
      if (result.includes("ERROR:")) {
        return { success: false, error: result.replace("ERROR: ", "") };
      }

      if (result.includes("application")) {
        return { success: false, error: "Application not found" };
      }
    } else {
      // Open with default application
      await shell.openPath(expandedPath);
    }

    console.log("✅ [Finder] File opened successfully");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Finder] Failed to open file:", message);
    return { success: false, error: `Failed to open file: ${message}` };
  }
}

/**
 * Move files to a destination folder
 */
export async function moveFilesToFolder(
  destination: string,
  filePaths: string[],
): Promise<{ success: boolean; error?: string; movedCount?: number }> {
  try {
    console.log("📦 [Finder] Moving files to folder:", destination);
    console.log("📦 [Finder] Files to move:", filePaths);

    // Expand ~ in destination
    const expandedDest = destination.startsWith("~")
      ? destination.replace("~", process.env.HOME || "")
      : destination;

    // Check if destination exists and is a directory
    try {
      const destStat = await fs.stat(expandedDest);
      if (!destStat.isDirectory()) {
        return { success: false, error: "Destination is not a directory" };
      }
    } catch {
      return { success: false, error: "Destination folder does not exist" };
    }

    let movedCount = 0;
    const errors: string[] = [];

    for (const filePath of filePaths) {
      try {
        const expandedPath = filePath.startsWith("~")
          ? filePath.replace("~", process.env.HOME || "")
          : filePath;

        // Check if source file exists
        try {
          await fs.access(expandedPath);
        } catch {
          errors.push(`File not found: ${filePath}`);
          continue;
        }

        const fileName = path.basename(expandedPath);
        const destPath = path.join(expandedDest, fileName);

        // Check if destination file already exists
        try {
          await fs.access(destPath);
          errors.push(`File already exists at destination: ${fileName}`);
          continue;
        } catch {
          // File doesn't exist, proceed with move
        }

        await fs.rename(expandedPath, destPath);
        movedCount++;
        console.log("✅ [Finder] Moved:", fileName);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to move ${path.basename(filePath)}: ${message}`);
      }
    }

    if (movedCount === 0 && errors.length > 0) {
      return { success: false, error: errors.join("; ") };
    }

    if (errors.length > 0) {
      console.warn("⚠️ [Finder] Some files failed to move:", errors);
    }

    console.log(`✅ [Finder] Successfully moved ${movedCount} file(s)`);
    return { success: true, movedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Finder] Failed to move files:", message);
    return { success: false, error: `Failed to move files: ${message}` };
  }
}

/**
 * Copy files to a destination folder
 */
export async function copyFilesToFolder(
  destination: string,
  filePaths: string[],
): Promise<{ success: boolean; error?: string; copiedCount?: number }> {
  try {
    console.log("📋 [Finder] Copying files to folder:", destination);
    console.log("📋 [Finder] Files to copy:", filePaths);

    // Expand ~ in destination
    const expandedDest = destination.startsWith("~")
      ? destination.replace("~", process.env.HOME || "")
      : destination;

    // Check if destination exists and is a directory
    try {
      const destStat = await fs.stat(expandedDest);
      if (!destStat.isDirectory()) {
        return { success: false, error: "Destination is not a directory" };
      }
    } catch {
      return { success: false, error: "Destination folder does not exist" };
    }

    let copiedCount = 0;
    const errors: string[] = [];

    for (const filePath of filePaths) {
      try {
        const expandedPath = filePath.startsWith("~")
          ? filePath.replace("~", process.env.HOME || "")
          : filePath;

        // Check if source file exists
        try {
          await fs.access(expandedPath);
        } catch {
          errors.push(`File not found: ${filePath}`);
          continue;
        }

        const fileName = path.basename(expandedPath);
        const destPath = path.join(expandedDest, fileName);

        // Check if destination file already exists
        try {
          await fs.access(destPath);
          errors.push(`File already exists at destination: ${fileName}`);
          continue;
        } catch {
          // File doesn't exist, proceed with copy
        }

        await fs.copyFile(expandedPath, destPath);
        copiedCount++;
        console.log("✅ [Finder] Copied:", fileName);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to copy ${path.basename(filePath)}: ${message}`);
      }
    }

    if (copiedCount === 0 && errors.length > 0) {
      return { success: false, error: errors.join("; ") };
    }

    if (errors.length > 0) {
      console.warn("⚠️ [Finder] Some files failed to copy:", errors);
    }

    console.log(`✅ [Finder] Successfully copied ${copiedCount} file(s)`);
    return { success: true, copiedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Finder] Failed to copy files:", message);
    return { success: false, error: `Failed to copy files: ${message}` };
  }
}

/**
 * Get selected files from Finder
 */
export async function getSelectedFinderFiles(): Promise<{
  success: boolean;
  files?: string[];
  error?: string;
}> {
  try {
    const script = `
      tell application "Finder"
        if not (exists window 1) then
          return "NO_WINDOW"
        end if
        
        set selectedItems to selection
        if (count of selectedItems) is 0 then
          return "NO_SELECTION"
        end if
        
        set fileList to {}
        repeat with anItem in selectedItems
          set end of fileList to POSIX path of (anItem as alias)
        end repeat
        
        return fileList
      end tell
    `;

    const result = await runAppleScript(script);

    if (result.includes("NO_WINDOW")) {
      return { success: false, error: "No Finder window is open" };
    }

    if (result.includes("NO_SELECTION")) {
      return { success: false, error: "No files selected in Finder" };
    }

    // Parse the file list (AppleScript returns comma-separated list)
    const files = result
      .split(", ")
      .map((file) => file.trim())
      .filter((file) => file.length > 0);

    console.log("📂 [Finder] Selected files:", files);
    return { success: true, files };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Finder] Failed to get selected files:", message);
    return { success: false, error: `Failed to get selected files: ${message}` };
  }
}

