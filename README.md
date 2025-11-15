# Sky Overlay Clone

<div align="center">
  <img src="public/sky-logo.png" alt="Sky Logo" width="200"/>
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

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_api_key_here
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

## Development Notes

- **File Size Limit**: No file exceeds 500 lines of code (enforced by project rules)
- **Component Library**: Uses shadcn UI components via MCP when possible
- **Styling**: Tailwind CSS for all styling
- **Animations**: Framer Motion for smooth transitions
- **Type Safety**: Full TypeScript coverage

## Git History

```
5051465 removed extra assets
4fe976a stable
5dc9fba stable
5c051da frosted glass buttons
7f46f81 some more animations added
dba8d2b card switching animation working
b63c1a2 stable with some animations
a0d0bd6 stable first day
```

## Contributing

Feel free to extend the action system by:
1. Adding new AppleScript files to `scripts/`
2. Registering actions in `src/renderer/lib/actions.ts`
3. Updating the action execution logic in `src/main/actions.ts`

## License

ISC
