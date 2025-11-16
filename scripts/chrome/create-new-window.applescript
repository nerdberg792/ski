-- Create a new blank Chrome window

try
	tell application "Google Chrome"
		make new window
		activate
	end tell
	return "Created a new Chrome window."
on error errMsg number errNum
	if errMsg contains "Google Chrome" then
		error "Google Chrome is not available. Please install or launch it before running this action."
	else
		error errMsg
	end if
end try

