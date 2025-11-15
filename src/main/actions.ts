import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import type { ActionExecution, ActionExecutionResult } from "../renderer/types/actions";

const execAsync = promisify(exec);

/**
 * Execute an AppleScript file
 */
export async function executeAppleScript(
  scriptPath: string,
  parameters?: Record<string, string | number | boolean>,
): Promise<ActionExecutionResult> {
  try {
    console.log("🍎 [Main] Executing AppleScript:", {
      scriptPath,
      parameters,
    });

    // Resolve script path - if relative, resolve from project root
    const fullPath = path.isAbsolute(scriptPath)
      ? scriptPath
      : path.join(process.cwd(), scriptPath);

    console.log("📁 [Main] Resolved script path:", fullPath);

    try {
      await fs.access(fullPath);
    } catch {
      console.error("❌ [Main] Script file not found:", fullPath);
      return {
        success: false,
        error: `Script file not found: ${fullPath}`,
      };
    }

    // Read the script
    let scriptContent = await fs.readFile(fullPath, "utf-8");
    console.log("📄 [Main] Original script content:", scriptContent.substring(0, 200) + "...");

    // Replace parameters in script if provided
    if (parameters) {
      for (const [key, value] of Object.entries(parameters)) {
        const placeholder = `{{${key}}}`;
        scriptContent = scriptContent.replace(
          new RegExp(placeholder, "g"),
          String(value),
        );
        console.log(`🔄 [Main] Replaced ${placeholder} with:`, value);
      }
    }

    console.log("📝 [Main] Final script content:", scriptContent.substring(0, 200) + "...");

    // Execute the script using osascript
    console.log("⚡ [Main] Running osascript command...");
    const { stdout, stderr } = await execAsync(
      `osascript -e '${scriptContent.replace(/'/g, "'\\''")}'`,
      {
        timeout: 30000, // 30 second timeout
      },
    );

    console.log("📤 [Main] AppleScript stdout:", stdout || "(empty)");
    if (stderr) {
      console.warn("⚠️ [Main] AppleScript stderr:", stderr);
    }

    // Check for actual errors in stderr
    // osascript outputs errors to stderr with "execution error" or "got an error"
    const hasError = stderr && (
      stderr.toLowerCase().includes("execution error") ||
      stderr.toLowerCase().includes("got an error") ||
      stderr.toLowerCase().includes("error:")
    );

    if (hasError) {
      console.error("❌ [Main] AppleScript execution FAILED:", stderr);
      return {
        success: false,
        error: stderr,
      };
    }

    // Success - script executed without errors
    // Note: Some scripts don't produce stdout, which is fine (e.g., set volume)
    const result = {
      success: true,
      output: stdout.trim() || "Script executed successfully",
    };
    console.log("✅ [Main] AppleScript execution SUCCESS:", result);
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Execute an action
 */
export async function executeAction(
  execution: ActionExecution,
  action: { scriptPath: string },
): Promise<ActionExecutionResult> {
  return executeAppleScript(action.scriptPath, execution.parameters);
}

