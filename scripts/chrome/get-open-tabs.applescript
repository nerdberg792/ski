-- List all open Google Chrome tabs as JSON

on replace_text(theText, search_string, replacement_string)
	set prevDelims to AppleScript's text item delimiters
	set AppleScript's text item delimiters to search_string
	set theItems to text items of theText
	set AppleScript's text item delimiters to replacement_string
	set theText to theItems as text
	set AppleScript's text item delimiters to prevDelims
	return theText
end replace_text

on escape_json(value)
	if value is missing value then return ""
	set value to value as string
	set value to my replace_text(value, "\\", "\\\\")
	set value to my replace_text(value, "\"", "\\\"")
	set value to my replace_text(value, return, "\\n")
	set value to my replace_text(value, linefeed, "\\n")
	set value to my replace_text(value, tab, "\\t")
	return value
end escape_json

on sanitized(rawValue, placeholderName)
	if rawValue is missing value then return ""
	if rawValue is "{{" & placeholderName & "}}" then
		return ""
	end if
	return rawValue
end sanitized

on bool_from(rawValue)
	if rawValue is missing value then return false
	if rawValue is "" then return false
	ignoring case
		if rawValue is "true" or rawValue is "1" or rawValue is "yes" then
			return true
		end if
	end ignoring
	return false
end bool_from

try
	set includeFavicons to my bool_from(my sanitized("{{useOriginalFavicon}}", "useOriginalFavicon"))

	set tabItems to {}
	tell application "Google Chrome"
		repeat with w in windows
			set windowRef to contents of w
			set windowId to id of windowRef as string
			set tabIndex to 1

			repeat with t in tabs of windowRef
				set tabRef to contents of t
				set titleText to ""
				set urlText to ""
				try
					set titleText to title of tabRef as string
				end try
				try
					set urlText to URL of tabRef as string
				end try

				set faviconValue to ""
				if includeFavicons then
					try
						set favResult to execute tabRef javascript ¬
							"var el=document.head&&document.head.querySelector('link[rel~=icon]');el?el.href:'';"
						if favResult is not missing value then
							set faviconValue to favResult as string
						end if
					end try
				end if

				set recordText to "{\"title\":\"" & my escape_json(titleText) & "\",\"url\":\"" & my escape_json(urlText) & "\",\"favicon\":\"" & my escape_json(faviconValue) & "\",\"windowId\":\"" & my escape_json(windowId) & "\",\"tabIndex\":" & tabIndex & "}"
				set end of tabItems to recordText
				set tabIndex to tabIndex + 1
			end repeat
		end repeat
	end tell

	if (count of tabItems) is 0 then
		return "[]"
	end if

	set prevDelims to AppleScript's text item delimiters
	set AppleScript's text item delimiters to ","
	set payload to "[" & (tabItems as text) & "]"
	set AppleScript's text item delimiters to prevDelims
	return payload
on error errMsg number errNum
	if errMsg contains "Google Chrome" then
		error "Google Chrome is not available. Please install or launch it before running this action."
	else
		error errMsg
	end if
end try

