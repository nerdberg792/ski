-- Close a specific Chrome tab by window ID and tab index

on sanitized(rawValue, placeholderName)
	if rawValue is missing value then return ""
	if rawValue is "{{" & placeholderName & "}}" then
		return ""
	end if
	return rawValue
end sanitized

try
	set windowIdText to my sanitized("{{windowId}}", "windowId")
	set tabIndexText to my sanitized("{{tabIndex}}", "tabIndex")

	if windowIdText is "" then
		error "windowId is required."
	end if

	if tabIndexText is "" then
		error "tabIndex is required."
	end if

	set windowIdValue to windowIdText as integer
	set tabIndexValue to tabIndexText as integer

	tell application "Google Chrome"
		activate
		set targetWindow to first window whose id is windowIdValue
		set index of targetWindow to 1
		set active tab index of targetWindow to tabIndexValue
		close active tab of targetWindow
	end tell

	return "Closed Chrome tab " & tabIndexValue & " in window " & windowIdValue
on error errMsg number errNum
	if errMsg contains "Google Chrome" then
		error "Google Chrome is not available. Please install or launch it before running this action."
	else
		error errMsg
	end if
end try

