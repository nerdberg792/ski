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

export interface AppleNote {
  id: string;
  title: string;
  folder: string;
  snippet: string;
  modifiedAt?: string;
  account?: string;
}

export interface AppleNotesSearchResult {
  notes: AppleNote[];
  success: boolean;
  error?: string;
}

/**
 * Search for notes in Apple Notes
 * Note: This is a simplified version using AppleScript
 * Full search with advanced filtering would require SQLite access to the Notes database
 */
export async function searchNotes(query: string): Promise<AppleNotesSearchResult> {
  try {
    // Basic search using AppleScript - limited but functional
    // Note: This searches through a limited number of notes due to AppleScript limitations
    // For better performance and full search, consider accessing the SQLite database directly
    const escapedQuery = escapeDoubleQuotes(query);
    const script = `
      tell application "Notes"
        activate
        set searchResults to {}
        set allNotes to notes
        set noteCount to 0
        set maxNotes to 100
        
        repeat with aNote in allNotes
          set noteCount to noteCount + 1
          if noteCount > maxNotes then exit repeat
          
          try
            set noteTitle to name of aNote as string
            set noteBody to body of aNote as string
            set noteContainer to container of aNote
            set noteFolder to name of noteContainer as string
            
            if noteTitle contains "${escapedQuery}" or noteBody contains "${escapedQuery}" or noteFolder contains "${escapedQuery}" then
              set noteId to id of aNote as string
              set noteSnippet to ""
              set bodyLength to length of noteBody
              if bodyLength > 0 then
                if bodyLength > 100 then
                  set noteSnippet to text 1 thru 100 of noteBody
                else
                  set noteSnippet to noteBody
                end if
              end if
              set end of searchResults to noteId & "|||" & noteTitle & "|||" & noteFolder & "|||" & noteSnippet
            end if
          on error errMsg
            -- Skip notes that cause errors
          end try
        end repeat
        
        return searchResults
      end tell
    `;

    const result = await runAppleScript(script);
    
    // Handle case where result is empty or just whitespace
    if (!result || result.trim() === "") {
      return { notes: [], success: true };
    }

    // Parse results - using ||| as delimiter to avoid conflicts with note content
    const lines = result.split(", ");
    const notes: AppleNote[] = [];

    for (const line of lines) {
      if (line && line.includes("|||")) {
        const parts = line.split("|||");
        if (parts.length >= 4) {
          notes.push({
            id: parts[0]?.trim() || "",
            title: parts[1]?.trim() || "Untitled",
            folder: parts[2]?.trim() || "",
            snippet: parts[3]?.trim() || "",
          });
        }
      }
    }

    return { notes, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      notes: [],
      success: false,
      error: `Search failed: ${message}`,
    };
  }
}

/**
 * Create a new note in Apple Notes
 */
export async function createNote(content?: string, text?: string): Promise<{ success: boolean; error?: string; noteId?: string }> {
  try {
    const noteContent = content || text || "";
    const escapedContent = escapeDoubleQuotes(noteContent);

    const script = `
      tell application "Notes"
        activate
        set newNote to make new note
        if "${escapedContent}" is not "" then
          set body of newNote to "${escapedContent}"
        end if
        set selection to newNote
        show newNote
        set noteId to id of newNote as string
        return noteId
      end tell
    `;

    const noteId = await runAppleScript(script);
    return { success: true, noteId: noteId.trim() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to create note: ${message}` };
  }
}

/**
 * Get the content of a note by ID
 */
export async function getNoteContent(noteId: string): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const escapedId = escapeDoubleQuotes(noteId);

    const script = `
      tell application "Notes"
        try
          set theNote to note id "${escapedId}"
          set noteBody to body of theNote as string
          return noteBody
        on error errMsg
          return "ERROR: " & errMsg
        end try
      end tell
    `;

    const result = await runAppleScript(script);
    
    if (result.startsWith("ERROR:")) {
      return { success: false, error: result };
    }

    return { success: true, content: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to get note content: ${message}` };
  }
}

/**
 * Update the content of a note by ID
 */
export async function updateNote(noteId: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const escapedId = escapeDoubleQuotes(noteId);
    const escapedContent = escapeDoubleQuotes(content);

    const script = `
      tell application "Notes"
        try
          set theNote to note id "${escapedId}"
          set body of theNote to "${escapedContent}"
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
    return { success: false, error: `Failed to update note: ${message}` };
  }
}

