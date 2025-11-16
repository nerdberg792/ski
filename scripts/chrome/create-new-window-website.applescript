-- Create a new Chrome window and open a specific website

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
		set newWindow to make new window
		tell newWindow to open location website
		activate
	end tell

	return "Opened new Chrome window with URL: " & website
on error errMsg number errNum
	if errMsg contains "Google Chrome" then
		error "Google Chrome is not available. Please install or launch it before running this action."
	else
		error errMsg
	end if
end try

