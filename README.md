# Sky Overlay Clone

<div align="center">
  <img src="https://raw.githubusercontent.com/nerdberg792/ski/main/public/sky-logo.png" alt="Sky Logo" width="200"/>
</div>

Minimalist Electron + React recreation of the floating assistant overlay from [Sky for Mac](https://www.macstories.net/stories/sky-for-mac-preview/#:~:text=Sky%20is%20an%20AI%2Dpowered,tiny%20floating%20UI%20comes%20up), featuring a translucent gradient background, stacked chat cards, and a `Cmd+K` global shortcut toggle.

## Current Status

This project is an active development of a Sky-like overlay assistant with the following features:

- ✅ **AI Integration**: Powered by Google Gemini 2.5 Flash for intelligent responses
- ✅ **Action System**: Extensible action framework with AppleScript execution
- ✅ **Task Approval**: User approval workflow for system actions
- ✅ **Streaming Responses**: Real-time streaming AI responses
- ✅ **macOS Integration**: Native macOS actions (volume control, app launching, Do Not Disturb)
- ✅ **Animated UI**: Smooth transitions and animations using Framer Motion
- ✅ **Global Shortcut**: `Cmd+K` to toggle overlay visibility
- ✅ **Draggable Interface**: Compact and expanded modes with full drag support

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- macOS (for AppleScript actions)
- Google Gemini API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the root directory (see `.env.example` for a template):

```env
VITE_GEMINI_API_KEY=your_gemini_api_key

SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:5310/callback
```

### Development

```bash
npm run dev
```

The development server boots both Vite (renderer) and Electron (main). The app appears as a compact, draggable menubar widget that expands into the full assistant interface.

### Usage

- **Compact Mode**: Starts as a small 60x60px circular widget that can be dragged anywhere on screen. Click it to expand.
- **Expanded Mode**: Shows the full chat interface. Click the chevron button in the header to collapse back to compact mode.
- **Global Shortcut**: Press `Cmd+K` (or `Ctrl+K` on Windows/Linux) to toggle visibility.
- **Dragging**: The entire window is draggable when expanded via the header bar. The compact widget is fully draggable.
- **Dismissal**: Press `Esc` while the overlay is focused to hide it.
- **AI Chat**: Type your message and press `Enter` or `Shift+Enter` to send. The AI will respond with streaming text.
- **Actions**: The AI can propose system actions (like opening apps, setting volume, etc.) which require your approval before execution.

### Production Build

```bash
npm run build
npm run start
```

`npm run build` compiles the renderer assets into `dist/renderer` and the Electron files into `dist-electron`.

## Features

### AI-Powered Assistant

- **Google Gemini Integration**: Uses Gemini 2.5 Flash model for intelligent, context-aware responses
- **Streaming Responses**: Real-time text streaming for natural conversation flow
- **Action Proposals**: AI can propose system actions based on user requests
- **Context Awareness**: Maintains conversation history for better responses

### Action System

The app includes an extensible action framework that allows the AI to interact with your macOS system:

- **Open Application**: Launch any macOS application by name
- **Set Volume**: Adjust system volume (0-100)
- **Toggle Do Not Disturb**: Enable/disable macOS Focus mode

Actions are defined in `src/renderer/lib/actions.ts` and executed via AppleScript files in the `scripts/` directory.

### Spotify Playback Control

- **Authorization Code + PKCE**: Securely connect your Spotify account using a local callback server.
- **Encrypted Token Store**: Refresh tokens are saved under the Electron `userData` directory so the session survives restarts.
- **Playback Controls**: Play/pause, previous/next, shuffle, and volume adjustments are exposed in the expanded overlay via shadcn cards.
- **Status Streaming**: Playback state and device changes are streamed to the renderer over IPC, keeping the UI in sync.
- **Automatic Device Transfer**: When you hit play, Sky will transfer control to your most recent Spotify device (as long as the Spotify client is open somewhere) so playback starts immediately.

#### Connecting Spotify

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/documentation/web-api) and enable the Web API.
2. Add `http://localhost:5310/callback` to the app's Redirect URIs.
3. Copy the client ID/secret and set the environment variables shown above (make sure to keep the secret private).
4. Restart Sky, expand the overlay, and click **Connect Spotify**. Complete the browser-based authorization flow, then return to the overlay to control playback.
5. Grant the `user-read-playback-state` and `user-modify-playback-state` scopes so the player can read and control your devices.

### Task Approval Workflow

When the AI proposes a system action:
1. A task approval window appears
2. Review the proposed action and parameters
3. Approve or reject the action
4. Approved actions execute via AppleScript

### UI Components

Built with modern React and shadcn UI components:

- **Chat Cards**: Conversation history with animated transitions
- **Prompt Windows**: Stacked input windows for multi-turn conversations
- **Task Approval Window**: Modal for reviewing and approving actions
- **Device Stats**: System information display
- **Weather Card**: Weather information (if implemented)
- **Search Results**: Web search integration (if enabled)

## Project Structure

```
sky/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # BrowserWindow config, global shortcuts
│   │   └── actions.ts     # AppleScript execution
│   ├── preload/           # Secure IPC bridge
│   │   └── index.ts       # Exposes window.sky API
│   └── renderer/          # React UI
│       ├── components/    # React components
│       ├── hooks/         # Custom React hooks
│       ├── lib/           # Utilities (Gemini, actions, parsers)
│       ├── types/         # TypeScript type definitions
│       └── data/           # Mock data and presets
├── scripts/               # AppleScript files for system actions
├── dist/                  # Build output (renderer)
├── dist-electron/         # Build output (main process)
└── public/                # Static assets
```




