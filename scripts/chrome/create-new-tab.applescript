-- Create a new blank Chrome tab in the first window

try
	tell application "Google Chrome"
		if (count of windows) is 0 then
			make new window
		end if
		tell window 1
			make new tab at end of tabs
		end tell
		activate
	end tell
	return "Created a new Chrome tab."
on error errMsg number errNum
	if errMsg contains "Google Chrome" then
		error "Google Chrome is not available. Please install or launch it before running this action."
	else
		error errMsg
	end if
end try

