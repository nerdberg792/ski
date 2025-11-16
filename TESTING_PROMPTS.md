# Testing Prompts for All Tool Integrations

This document contains test prompts for all integrated tools in Sky.

## Browser Bookmarks

1. **Search bookmarks:**
   - "Search my bookmarks for github"
   - "Find bookmarks about React"
   - "Show me Chrome bookmarks for work"
   - "Search all my bookmarks for machine learning"

2. **Open bookmarks:**
   - "Open bookmark https://github.com"
   - "Open the GitHub bookmark in Chrome"
   - "Open https://react.dev in Safari"

## Browser History

1. **Search history:**
   - "Search my browser history for github"
   - "What did I visit yesterday about React?"
   - "Show me my Chrome history for work"
   - "Find pages I visited about TypeScript"
   - "Search my history for documentation limit 10"

## Browser Tabs

1. **Search tabs:**
   - "Search my open tabs for github"
   - "What tabs do I have open about React?"
   - "Show me Safari tabs with documentation"
   - "Find open tabs related to work"
   - "List all the open chrome tabs"

2. **Close tabs:**
   - "Close tab in Safari window 1 tab 2" (requires search first to get windowId and tabIndex)

## Browser Profiles

1. **List profiles:**
   - "List Chrome profiles"
   - "Show me Firefox profiles"
   - "What profiles do I have in Brave?"
   - "List my Edge profiles"

2. **Open with profile:**
   - "Open Chrome with profile Work"
   - "Launch Firefox profile Personal"
   - "Open Brave with profile Development"
   - "Start Edge with my Work profile"

## Apple Notes

1. **Search notes:**
   - "Search my notes for meeting"
   - "Find notes about project ideas"
   - "Show me notes containing TODO"
   - "Search Apple Notes for vacation"

2. **Create notes:**
   - "Create a note about today's meeting"
   - "Make a new note with text: Remember to buy groceries"
   - "Create a note called Shopping List"

3. **Get note content:**
   - "Show me the content of note [noteId]" (use ID from search results)
   - "Get the text from note [noteId]"

4. **Update notes:**
   - "Update note [noteId] with content: Updated text here" (use ID from search results)

## Apple Maps

1. **Search:**
   - "Search Apple Maps for coffee shops near me"
   - "Find restaurants in San Francisco"
   - "Search for gas stations"

2. **Directions:**
   - "Get directions to 123 Main Street"
   - "Directions from my location to Times Square"
   - "Show me how to get to the airport"
   - "Directions to Central Park from Brooklyn"

3. **Directions home:**
   - "Get directions home"
   - "Directions to my home address"
   - "Show me the way home" (requires home address to be set)

## Apple Reminders

1. **Create reminders:**
   - "Create a reminder to call mom"
   - "Set a reminder: Buy groceries tomorrow at 3 PM"
   - "Remind me to finish the report on December 25, 2025 at 10:00 AM"
   - "Create a reminder called Meeting with team in Work list"

2. **List reminders:**
   - "List my reminders"
   - "Show me all reminders in Work list"
   - "What reminders do I have?"
   - "List incomplete reminders"

3. **Complete reminders:**
   - "Mark reminder [reminderId] as complete" (use ID from list results)
   - "Complete the reminder [reminderId]"

## Apple Stocks

1. **Search stocks:**
   - "Search Apple Stocks for AAPL"
   - "Show me TSLA stock"
   - "Open stocks for MSFT"
   - "Search stocks ticker GOOGL"

## Finder

1. **Create files:**
   - "Create a new file called notes.md"
   - "Create test.txt and open it"
   - "Make a file named todo-list.md"

2. **Open files:**
   - "Open ~/Documents/myfile.txt"
   - "Open myfile.txt with TextEdit"
   - "Open the file at /Users/name/Documents/report.pdf"

3. **Move files:**
   - "Move selected files to ~/Desktop"
   - "Move file.txt to /Users/name/Documents"
   - "Move the selected files to Downloads folder"

4. **Copy files:**
   - "Copy file.txt to /Users/name/Documents"
   - "Copy selected files to Desktop"
   - "Duplicate file.pdf to Documents folder"

5. **Get selected files:**
   - "What files are selected in Finder?"
   - "Show me the selected files"
   - "List selected Finder files"

## Chrome Actions

1. **List tabs:**
   - "List all Chrome tabs"
   - "Show me open Chrome tabs"
   - "Get all Chrome tabs"

2. **Open tabs:**
   - "Open a new Chrome tab with https://github.com"
   - "Open Chrome tab to google.com"
   - "Create a new tab and search for React"

3. **Focus tabs:**
   - "Focus Chrome tab 3 in window 1"
   - "Switch to tab 2 in Chrome"

4. **Close tabs:**
   - "Close Chrome tab 5 in window 1"
   - "Close the current Chrome tab"

5. **Reload tabs:**
   - "Reload Chrome tab 2 in window 1"
   - "Refresh the current Chrome tab"

## Spotify

1. **Playback control:**
   - "Play Spotify"
   - "Pause Spotify"
   - "Toggle Spotify play/pause"
   - "Next song on Spotify"
   - "Previous track in Spotify"

2. **Volume:**
   - "Set Spotify volume to 50"
   - "Change Spotify volume to 75 percent"

3. **Search:**
   - "Search Spotify for The Beatles"
   - "Find songs by Taylor Swift on Spotify"
   - "Search Spotify for jazz music"

4. **Play specific:**
   - "Play track spotify:track:4iV5W9uYEdYUVa79Axb7Rh on Spotify"
   - "Play album spotify:album:1ATL5GLyefJaxhQzSPVrLX"

## System Actions

1. **Open apps:**
   - "Open Safari"
   - "Launch Chrome"
   - "Open TextEdit"

2. **System control:**
   - "Set volume to 50"
   - "Mute the system"
   - "Increase brightness"

## Combined/Complex Prompts

1. **Multi-step:**
   - "Search my bookmarks for github, then open the first one"
   - "List my Chrome tabs and close the ones about shopping"
   - "Create a reminder to review my notes tomorrow"

2. **Cross-integration:**
   - "Search my notes for meeting, then create a reminder about it"
   - "Find my bookmarks about React, then open one in Chrome"
   - "List my reminders, then get directions to complete the first one"

## Testing Checklist

- [ ] Browser Bookmarks - search and open
- [ ] Browser History - search
- [ ] Browser Tabs - search and list all
- [ ] Browser Profiles - list and open
- [ ] Apple Notes - search, create, get content, update
- [ ] Apple Maps - search, directions, directions home
- [ ] Apple Reminders - create, list, complete
- [ ] Apple Stocks - search
- [ ] Finder - create file, open file, move, copy, get selected
- [ ] Chrome actions - list tabs, open tab, focus, close, reload
- [ ] Spotify - play, pause, next, previous, volume, search

## Notes

- Some actions require specific IDs from previous results (e.g., noteId, reminderId)
- Browser history search may be limited (requires SQLite access)
- Directions home requires a home address to be configured
- File operations may require files to be selected in Finder first
- Chrome tab operations require window and tab indices from search results

