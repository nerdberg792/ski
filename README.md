# Sky Overlay Clone

Minimalist Electron + React recreation of the floating assistant overlay from [Sky for Mac](https://www.macstories.net/stories/sky-for-mac-preview/#:~:text=Sky%20is%20an%20AI%2Dpowered,tiny%20floating%20UI%20comes%20up), featuring a translucent gradient background, stacked chat cards, and a `Cmd+K` global shortcut toggle.

## Getting Started

```bash
npm install
npm run dev
```

The development server boots both Vite (renderer) and Electron (main). The app appears as a compact, draggable menubar widget that expands into the full assistant interface.

### Usage

- **Compact Mode**: Starts as a small 60x60px circular widget that can be dragged anywhere on screen. Click it to expand.
- **Expanded Mode**: Shows the full chat interface. Click the chevron button in the header to collapse back to compact mode.
- **Global Shortcut**: Press `Cmd+K` (or `Ctrl+K` on Windows/Linux) to toggle visibility.
- **Dragging**: The entire window is draggable when expanded via the header bar. The compact widget is fully draggable.
- **Dismissal**: Press `Esc` while the overlay is focused to hide it.

### Production Build

```bash
npm run build
npm run start
```

`npm run build` compiles the renderer assets into `dist/renderer` and the Electron files into `dist-electron`.

## UI Interaction

- **Expandable Widget**: The app starts in compact mode (60x60px) and expands to full size (720x520px) when clicked. The window position is preserved when toggling between states.
- **Draggable**: Both compact and expanded states are fully draggable, allowing you to position the overlay anywhere on your screen.
- **Search Toggle**: The toolbar's `Search Web` toggle emulates Sky's search integration, switching responses between "Search Web" and local "Sky" sources.
- **Mock Responses**: Typing into the prompt area and pressing `Shift+Enter` submits a mock request. Responses are generated client-side from curated scenarios inspired by the MacStories preview (Switch 2 launch, The O.C. finale, and sending a message draft).
- **Components**: Conversation cards use shadcn UI primitives (buttons, badges, cards, textarea) with Tailwind styling to stay below the 500-line file limit.

## Project Structure

- `src/main` – Electron main process, BrowserWindow configuration, and global shortcut.
- `src/preload` – Secure bridge exposing overlay toggles to the renderer.
- `src/renderer` – React UI with shadcn components, mock data, and animated overlay styling.

Feel free to extend the mock scenarios or wire real MCP tooling into the preload bridge to connect Sky with live automations.

