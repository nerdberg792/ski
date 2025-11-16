import { exec } from "child_process";
import { promisify } from "util";

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

export interface AppleReminder {
  id: string;
  name: string;
  body: string;
  completed: boolean;
  dueDate?: string;
  priority?: string;
  listName?: string;
}

/**
 * Create a new reminder in Apple Reminders
 */
export async function createReminder(payload: {
  title: string;
  listName?: string;
  dueDate?: string;
  priority?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string; reminderId?: string }> {
  try {
    console.log("📝 [Apple Reminders] Creating reminder with payload:", payload);
    
    if (!payload.title || typeof payload.title !== "string") {
      return { success: false, error: "Title is required and must be a string" };
    }

    const escapedTitle = escapeDoubleQuotes(payload.title);
    const escapedBody = payload.notes ? escapeDoubleQuotes(payload.notes) : "";
    const listName = payload.listName ? escapeDoubleQuotes(payload.listName) : "";

    let script = `
      tell application "Reminders"
        activate
    `;

    if (listName) {
      script += `
        try
          set targetList to list "${listName}"
          set newReminder to make new reminder at targetList
        on error
          set newReminder to make new reminder
        end try
      `;
    } else {
      script += `
        set newReminder to make new reminder
      `;
    }

    script += `
        set name of newReminder to "${escapedTitle}"
    `;

    if (escapedBody) {
      script += `
        set body of newReminder to "${escapedBody}"
      `;
    }

    if (payload.dueDate) {
      try {
        const dueDate = new Date(payload.dueDate);
        if (!isNaN(dueDate.getTime())) {
          // Extract date components
          // Note: AppleScript months are 1-indexed (January = 1), JavaScript months are 0-indexed
          const year = dueDate.getFullYear();
          const month = dueDate.getMonth() + 1; // Convert to 1-indexed
          const day = dueDate.getDate();
          const hours = dueDate.getHours();
          const minutes = dueDate.getMinutes();
          const seconds = dueDate.getSeconds();
          
          // AppleScript date format: Use "MM/DD/YYYY HH:MM:SS" format which is more reliable
          // Or better yet, construct the date object directly using date components
          script += `
        try
          -- Construct date directly using date string in ISO format or direct construction
          set targetDate to (current date)
          set year of targetDate to ${year}
          set month of targetDate to ${month}
          set day of targetDate to ${day}
          set hours of targetDate to ${hours}
          set minutes of targetDate to ${minutes}
          set seconds of targetDate to ${seconds}
          set due date of newReminder to targetDate
        on error errMsg
          -- If direct construction fails, try string format
          try
            set due date of newReminder to date "${month}/${day}/${year} ${hours}:${minutes}:${seconds}"
          on error
            -- Skip due date if both methods fail
          end try
        end try
      `;
        }
      } catch (error) {
        console.error("Error parsing due date:", error);
      }
    }

    if (payload.priority) {
      const priorityMap: Record<string, string> = {
        low: "1",
        medium: "5",
        high: "9",
      };
      const priorityValue = priorityMap[payload.priority.toLowerCase()] || "0";
      script += `
        try
          set priority of newReminder to ${priorityValue}
        on error
          -- Priority setting failed, continue without priority
        end try
      `;
    }

    script += `
        set reminderId to id of newReminder
        return reminderId
      end tell
    `;

    console.log("📜 [Apple Reminders] Generated AppleScript:", script);
    const reminderId = await runAppleScript(script);
    console.log("✅ [Apple Reminders] Reminder created successfully with ID:", reminderId.trim());
    return { success: true, reminderId: reminderId.trim() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Apple Reminders] Failed to create reminder:", message, error);
    return { success: false, error: `Failed to create reminder: ${message}` };
  }
}

/**
 * List reminders from Apple Reminders
 */
export async function listReminders(payload: {
  listName?: string;
  completed?: boolean;
}): Promise<{ success: boolean; reminders?: AppleReminder[]; error?: string }> {
  try {
    const listName = payload.listName ? escapeDoubleQuotes(payload.listName) : "";
    const includeCompleted = payload.completed === true;

    let script = `
      tell application "Reminders"
        activate
        set reminderList to {}
    `;

    if (listName) {
      script += `
        set targetList to list "${listName}"
        set allReminders to reminders of targetList
      `;
    } else {
      script += `
        set allReminders to reminders
      `;
    }

    script += `
        repeat with aReminder in allReminders
          set isCompleted to completed of aReminder
          if ${includeCompleted ? "true" : "not isCompleted"} then
            set reminderId to id of aReminder as string
            set reminderName to name of aReminder as string
            set reminderBody to body of aReminder as string
            set reminderListName to name of container of aReminder as string
            
            set dueDateStr to ""
            try
              set dueDate to due date of aReminder
              if dueDate is not missing value then
                set dueDateStr to dueDate as string
              end if
            end try
            
            set priorityStr to ""
            try
              set reminderPriority to priority of aReminder
              if reminderPriority is not missing value then
                set priorityStr to reminderPriority as string
              end if
            end try
            
            set end of reminderList to reminderId & "|||" & reminderName & "|||" & reminderBody & "|||" & (isCompleted as string) & "|||" & dueDateStr & "|||" & priorityStr & "|||" & reminderListName
          end if
        end repeat
        
        return reminderList
      end tell
    `;

    const result = await runAppleScript(script);

    if (!result || result.trim() === "") {
      return { success: true, reminders: [] };
    }

    const lines = result.split(", ");
    const reminders: AppleReminder[] = [];

    for (const line of lines) {
      if (line && line.includes("|||")) {
        const parts = line.split("|||");
        if (parts.length >= 7) {
          reminders.push({
            id: parts[0]?.trim() || "",
            name: parts[1]?.trim() || "",
            body: parts[2]?.trim() || "",
            completed: parts[3]?.trim() === "true",
            dueDate: parts[4]?.trim() || undefined,
            priority: parts[5]?.trim() || undefined,
            listName: parts[6]?.trim() || undefined,
          });
        }
      }
    }

    return { success: true, reminders };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      reminders: [],
      error: `Failed to list reminders: ${message}`,
    };
  }
}

/**
 * Complete a reminder by ID
 */
export async function completeReminder(reminderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const escapedId = escapeDoubleQuotes(reminderId);

    const script = `
      tell application "Reminders"
        activate
        try
          set targetReminder to reminder id "${escapedId}"
          set completed of targetReminder to true
          return "SUCCESS"
        on error errMsg
          return "ERROR: " & errMsg
        end try
      end tell
    `;

    const result = await runAppleScript(script);

    if (result.startsWith("ERROR:")) {
      return { success: false, error: result };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to complete reminder: ${message}` };
  }
}

