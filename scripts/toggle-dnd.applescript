tell application "System Events"
  tell application process "ControlCenter"
    try
      set menuBarItem to menu bar item "Focus" of menu bar 1
      click menuBarItem
      delay 0.5
      try
        click button "Do Not Disturb" of group 1 of window 1
      on error
        -- Do Not Disturb is already on, click again to turn off
        click button "Do Not Disturb" of group 1 of window 1
      end try
      key code 53 -- Press Escape to close Control Center
    on error
      -- Fallback: use AppleScript to toggle via Shortcuts
      do shell script "shortcuts run 'Toggle Do Not Disturb'"
    end try
  end tell
end tell

