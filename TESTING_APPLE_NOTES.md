# Testing Apple Notes Integration

This guide will help you test the Apple Notes integration feature.

## Prerequisites

1. **macOS**: Apple Notes integration only works on macOS
2. **Apple Notes App**: Make sure the Apple Notes app is installed (it comes with macOS)
3. **Notes in Apple Notes**: Have some notes in your Apple Notes app to test search functionality
4. **App Running**: Make sure your Sky app is running
5. **Gemini API Key**: Ensure you have a GEMINI_API_KEY set in your `.env` file

## How to Test

### Method 1: Through Chat Interface (Recommended)

The app uses Gemini's function calling to automatically detect when users want to interact with Apple Notes. Simply type natural language prompts in the chat interface.

#### 1. Test Creating a Note

**Prompts to try:**
- "Create a note called Shopping List"
- "Make a new note about my meeting notes"
- "Create a note with the text: Hello World"
- "Add a note about groceries"

**What to expect:**
1. Type your prompt and press Enter
2. Gemini should propose the `apple-notes-create` action
3. A task approval window should appear asking you to approve the action
4. Click "Approve" to execute
5. Check the console logs for success messages
6. Open Apple Notes app to verify the note was created

**Console logs to look for:**
```
✅ [App] Apple Note created: [noteId]
```

#### 2. Test Searching Notes

**Prompts to try:**
- "Search my notes for grocery"
- "Find notes about meetings"
- "Show me my notes with the word 'todo'"
- "What notes do I have about work?"

**What to expect:**
1. Type your prompt and press Enter
2. Gemini should propose the `apple-notes-search` action with your query
3. Approve the action
4. Check console logs for the search results
5. The results should show notes matching your query

**Console logs to look for:**
```
✅ [App] Apple Notes search completed: X notes found
```

**Note:** The search currently searches through up to 100 notes using AppleScript, so results may be limited.

#### 3. Test Getting Note Content

**Prompts to try:**
- "Get the content of note [noteId]" (you'll need to get a noteId from search first)
- "What's in my note with ID xyz?"

**What to expect:**
1. First, search for a note to get its ID
2. Then use the note ID to get its content
3. Check console logs for the content

**Console logs to look for:**
```
✅ [App] Apple Note content retrieved
```

#### 4. Test Updating a Note

**Prompts to try:**
- "Update note [noteId] with new content"
- "Change my shopping list note to include bananas"

**What to expect:**
1. Search for a note first to get its ID
2. Get the current content of the note
3. Update the note with new content
4. Verify in Apple Notes app that the note was updated

**Console logs to look for:**
```
✅ [App] Apple Note updated
```

### Method 2: Direct Action Testing (For Developers)

You can also test actions directly by checking if they're registered:

1. Open the browser DevTools console
2. Look for logs that show available actions:
   ```
   🛠️ [Gemini] Available actions/tools: [...]
   ```
3. Verify that Apple Notes actions are in the list:
   - `apple-notes-search`
   - `apple-notes-create`
   - `apple-notes-get-content`
   - `apple-notes-update`

### Method 3: Manual Console Testing

You can test the Apple Notes API directly in the browser console:

1. Open DevTools (Cmd+Option+I)
2. In the console, try:

```javascript
// Test search
await window.sky.appleNotes.search("grocery")

// Test create
await window.sky.appleNotes.create({ text: "Test note from console" })

// Test get content (use a real noteId from search results)
await window.sky.appleNotes.getContent("noteIdHere")

// Test update
await window.sky.appleNotes.update({ 
  noteId: "noteIdHere", 
  content: "<h1>Updated Note</h1><p>New content</p>" 
})
```

## Troubleshooting

### Actions Not Being Proposed

**Problem:** Gemini doesn't propose Apple Notes actions when you ask about notes.

**Solutions:**
1. Check that actions are registered - look for console logs showing available actions
2. Try more explicit prompts like "Search my Apple Notes for..."
3. Check the system prompt in `src/renderer/lib/gemini.ts` includes Apple Notes capabilities

### Search Returns No Results

**Problem:** Search doesn't find notes you know exist.

**Solutions:**
1. The search is limited to about 100 notes for performance
2. Make sure the search query matches words in the note title or content
3. Check console logs for any error messages
4. Verify Apple Notes app is accessible and has permissions

### Note Creation Fails

**Problem:** Notes aren't being created.

**Solutions:**
1. Make sure Apple Notes app is installed
2. Check console for error messages
3. Verify the app has necessary permissions to control Apple Notes
4. Try creating a note manually in Apple Notes to ensure the app works

### Permission Errors

**Problem:** Getting permission errors when accessing notes.

**Solutions:**
1. macOS may require accessibility permissions for AppleScript to control apps
2. Go to System Settings > Privacy & Security > Accessibility
3. Make sure your app (or Electron) has accessibility permissions
4. You may need to restart the app after granting permissions

## Debugging Tips

1. **Check Console Logs**: All Apple Notes operations log to the console
   - Look for `✅` for success messages
   - Look for `❌` for error messages

2. **Watch Network Tab**: Check DevTools Network tab for IPC communication

3. **Main Process Logs**: Check the terminal where you're running the app for main process logs

4. **AppleScript Errors**: If AppleScript fails, check the terminal for detailed error messages

## Expected Behavior

- **Search**: Should return an array of notes matching the query with IDs, titles, folders, and snippets
- **Create**: Should create a new note and return its ID
- **Get Content**: Should return the HTML content of the specified note
- **Update**: Should update the note content and return success

## Next Steps for Enhancement

Consider adding:
- UI components to display search results
- Better error handling and user feedback
- Direct SQLite access for faster, more comprehensive search
- Support for note folders, tags, and other metadata
- Batch operations (create multiple notes, update multiple notes)

