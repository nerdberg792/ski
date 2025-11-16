-- Open a new Google Chrome tab with optional profile targeting

on replace_text(theText, search_string, replacement_string)
	set prevDelims to AppleScript's text item delimiters
	set AppleScript's text item delimiters to search_string
	set theItems to text items of theText
	set AppleScript's text item delimiters to replacement_string
	set theText to theItems as text
	set AppleScript's text item delimiters to prevDelims
	return theText
end replace_text

on sanitized(rawValue, placeholderName)
	if rawValue is missing value then return ""
	if rawValue is "{{" & placeholderName & "}}" then
		return ""
	end if
	return rawValue
end sanitized

on encode_query(theText)
	if theText is missing value then return ""
	set encoded to theText as string
	set encoded to my replace_text(encoded, "%", "%25")
	set encoded to my replace_text(encoded, " ", "+")
	set encoded to my replace_text(encoded, "\"", "%22")
	set encoded to my replace_text(encoded, "#", "%23")
	set encoded to my replace_text(encoded, "&", "%26")
	set encoded to my replace_text(encoded, "?", "%3F")
	set encoded to my replace_text(encoded, "=", "%3D")
	set encoded to my replace_text(encoded, "+", "%2B")
	return encoded
end encode_query

on normalize_mode(profileMode)
	if profileMode is missing value or profileMode is "" then return "default"
	set modeValue to profileMode as string
	ignoring case
		if modeValue is "profilecurrent" or modeValue is "profile_current" then
			return "profilecurrent"
		else if modeValue is "profileoriginal" or modeValue is "profile_original" then
			return "profileoriginal"
		else
			return "default"
		end if
	end ignoring
	return "default"
end normalize_mode

try
	set rawUrl to my sanitized("{{url}}", "url")
	set rawQuery to my sanitized("{{query}}", "query")
	set profileModeRaw to my sanitized("{{profileMode}}", "profileMode")
	set profileCurrent to my sanitized("{{profileCurrent}}", "profileCurrent")
	set profileOriginal to my sanitized("{{profileOriginal}}", "profileOriginal")

	set targetUrl to rawUrl
	if targetUrl is "" then
		if rawQuery is not "" then
			set targetUrl to "https://www.google.com/search?q=" & my encode_query(rawQuery)
		else
			set targetUrl to "about:blank"
		end if
	end if

	set normalizedMode to my normalize_mode(profileModeRaw)
	set selectedProfile to ""
	if normalizedMode is "profilecurrent" then
		set selectedProfile to profileCurrent
	else if normalizedMode is "profileoriginal" then
		set selectedProfile to profileOriginal
	end if

	if normalizedMode is not "default" and selectedProfile is "" then
		error "A Chrome profile directory is required for the selected profile mode."
	end if

	if selectedProfile is not "" then
		set command to "open -na 'Google Chrome' --args --profile-directory=" & quoted form of selectedProfile & " " & quoted form of targetUrl
		do shell script command
	else
		tell application "Google Chrome"
			set winExists to false
			repeat with win in every window
				if index of win is 1 then
					set winExists to true
					exit repeat
				end if
			end repeat

			if not winExists then
				make new window
			else
				activate
			end if

			tell window 1
				set newTab to make new tab with properties {URL:targetUrl}
				set active tab to newTab
			end tell
		end tell
	end if

	return "Opened Chrome tab with URL: " & targetUrl
on error errMsg number errNum
	if errMsg contains "Google Chrome" then
		error "Google Chrome is not available. Please install or launch it before running this action."
	else
		error errMsg
	end if
end try

