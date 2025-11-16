# Debugging Apple Reminders Integration

If reminders aren't working, follow these steps to debug:

## Step 1: Check if Action is Being Proposed

1. Open the browser DevTools (Cmd+Option+I)
2. Go to the Console tab
3. Try asking to create a reminder: "Create a reminder to buy milk"
4. Look for these logs:
   - `🛠️ [Gemini] Available actions/tools:` - Should include `apple-reminders-create`
   - `🔧 [Gemini] Function call detected:` - Should show when Gemini proposes the action
   - `📋 [useGemini] Action proposed:` - Should show the action was proposed
   - `📋 [App] Handling Apple Reminders action:` - Should show when action is being handled

**If you don't see these logs:**
- The action might not be registered. Check console for action registration.
- Gemini might not be recognizing the request. Try more explicit prompts like "Create a reminder called 'buy milk'"

## Step 2: Check if Approval Window Shows

- After Gemini proposes the action, you should see a task approval window
- Click "Approve" to execute the action
- If you don't see the window, check the console for errors

## Step 3: Check Action Execution

After approving, look for these logs:

**In Renderer Console (DevTools):**
- `📋 [App] Handling Apple Reminders action:`
- `📝 [App] Creating reminder with params:`
- `🔔 [useAppleReminders] create called with payload:`
- `📞 [useAppleReminders] Calling skyAppleReminders.create...`
- `✅ [App] Apple Reminder created:` (on success)

**In Main Process Terminal:**
- `📝 [Apple Reminders] Creating reminder with payload:`
- `📜 [Apple Reminders] Generated AppleScript:`
- `✅ [Apple Reminders] Reminder created successfully with ID:`

## Step 4: Check for Errors

Look for any `❌` error logs:
- Check both DevTools console and terminal
- Common errors:
  - **"Apple Reminders integration is not available"** - The API isn't exposed properly
  - **"Title must be a string"** - Parameter type issue
  - **AppleScript errors** - Check terminal for detailed errors

## Step 5: Test Permissions

Apple Reminders requires permissions:
1. Go to System Settings > Privacy & Security > Automation
2. Find your app (or Electron)
3. Ensure "Reminders" is checked

Also check:
- System Settings > Privacy & Security > Reminders
- Make sure your app has access to Reminders

## Step 6: Test Manually

Try calling the API directly in the browser console:

```javascript
// Test if API is available
window.sky?.appleReminders

// Try creating a reminder manually
await window.sky?.appleReminders?.create({
  title: "Test reminder"
})
```

## Common Issues

### Issue: "Nothing happens" - No logs at all
**Solution:** 
- Check if actions are registered: Look for `🛠️ [Gemini] Available actions/tools:` in console
- Try a more explicit prompt: "Create a reminder with title 'buy milk'"
- Check if Gemini is initialized properly

### Issue: Action proposed but approval window doesn't show
**Solution:**
- Check if `pendingAction` state is being set (check React DevTools)
- Look for errors in console about rendering
- Check if the TaskApprovalWindow component is rendering

### Issue: Action approved but no reminder created
**Solution:**
- Check terminal for AppleScript errors
- Verify Reminders app permissions
- Check if Reminders app is installed and accessible
- Look for error messages in terminal about AppleScript execution

### Issue: AppleScript errors in terminal
**Solution:**
- The script might have syntax errors
- Date format might be wrong
- List name might not exist (it will fallback to default list)
- Check the generated AppleScript in terminal logs

## Quick Test Commands

Try these in the chat:

1. **Simple:** "Create a reminder to buy milk"
2. **With date:** "Create a reminder to call Mom tomorrow"
3. **With priority:** "Create a high priority reminder to finish report"
4. **Explicit:** "Use apple-reminders-create action to create a reminder with title 'test'"

## Getting Help

If still not working, collect:
1. All console logs from DevTools
2. All terminal logs from main process
3. Screenshot of any error messages
4. What prompt you used
5. macOS version and Reminders app status

