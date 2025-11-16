-- Create a new Chrome tab in the first window and open a website

on sanitized(rawValue, placeholderName)
	if rawValue is missing value then return ""
	if rawValue is "{{" & placeholderName & "}}" then
		return ""
	end if
	return rawValue
end sanitized

try
	set website to my sanitized("{{website}}", "website")
	if website is "" then
		error "website is required."
	end if

	tell application "Google Chrome"
		if (count of windows) is 0 then
			make new window
		else
			activate
		end if
		tell window 1
			open location website
		end tell
	end tell

	return "Opened Chrome tab with URL: " & website
on error errMsg number errNum
	if errMsg contains "Google Chrome" then
		error "Google Chrome is not available. Please install or launch it before running this action."
	else
		error errMsg
	end if
end try

