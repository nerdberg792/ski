import { app, BrowserWindow, globalShortcut, ipcMain, nativeTheme, screen } from "electron";
import path from "node:path";

const isMac = process.platform === "darwin";

let overlayWindow: BrowserWindow | null = null;
let isWindowReady = false;
let isQuitting = false;

const COMPACT_SIZE = { width: 600, height: 50 };
const EXPANDED_SIZE = { width: 720, height: 520 };

function getDefaultPosition() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  return {
    x: width - EXPANDED_SIZE.width - 20,
    y: 100,
  };
}

function safeSend(channel: string, ...args: unknown[]) {
  if (!overlayWindow || overlayWindow.isDestroyed() || !isWindowReady) return;
  try {
    const webContents = overlayWindow.webContents;
    if (webContents && !webContents.isDestroyed()) {
      webContents.send(channel, ...args);
    }
  } catch (error) {
    // Silently ignore errors when frame is disposed
  }
}

function createOverlayWindow(): Promise<BrowserWindow> {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    return Promise.resolve(overlayWindow);
  }
  
  isWindowReady = false;
  const defaultPos = getDefaultPosition();
  
  overlayWindow = new BrowserWindow({
    width: COMPACT_SIZE.width,
    height: COMPACT_SIZE.height,
    x: defaultPos.x,
    y: defaultPos.y,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    roundedCorners: true,
    hasShadow: false,
    fullscreenable: false,
    focusable: true,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setAlwaysOnTop(true, "floating");

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  return new Promise((resolve) => {
    overlayWindow!.on("blur", () => {
      safeSend("sky:blur");
    });

    overlayWindow!.on("closed", () => {
      overlayWindow = null;
      isWindowReady = false;
    });

    overlayWindow!.on("moved", () => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        const [x, y] = overlayWindow.getPosition();
        safeSend("sky:position", { x, y });
      }
    });

    overlayWindow!.webContents.once("did-finish-load", () => {
      isWindowReady = true;
      safeSend("sky:expanded", false);
      safeSend("sky:visibility", true);
      resolve(overlayWindow!);
    });

    if (devServerUrl) {
      overlayWindow!.loadURL(devServerUrl);
    } else {
      overlayWindow!.loadFile(path.join(__dirname, "../dist/renderer/index.html"));
    }
  });
}

async function toggleOverlay(force?: boolean) {
  if (isQuitting) return;
  
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    await createOverlayWindow();
  }
  if (!overlayWindow || isQuitting) return;
  
  // Wait for window to be ready if it was just created
  if (!isWindowReady) {
    await new Promise<void>((resolve) => {
      const checkReady = () => {
        if (isWindowReady || isQuitting) {
          resolve();
        } else {
          setTimeout(checkReady, 50);
        }
      };
      checkReady();
    });
  }
  
  if (isQuitting || !overlayWindow) return;
  
  const shouldShow = force ?? !overlayWindow.isVisible();
  if (shouldShow) {
    overlayWindow.showInactive();
    overlayWindow.focus();
    safeSend("sky:visibility", true);
  } else {
    overlayWindow.hide();
    safeSend("sky:visibility", false);
  }
}

function setWindowSize(size: { width: number; height: number }, animated = true) {
  if (!overlayWindow) return;
  
  const [x, y] = overlayWindow.getPosition();
  const currentSize = overlayWindow.getSize();
  
  // When expanding, position below the compact widget
  // When collapsing, keep the same top position
  let newX = x;
  let newY = y;
  
  if (size.width === EXPANDED_SIZE.width && size.height === EXPANDED_SIZE.height) {
    // Expanding: position below, centered horizontally
    newX = Math.max(0, x - (EXPANDED_SIZE.width - COMPACT_SIZE.width) / 2);
    newY = y + COMPACT_SIZE.height + 10; // 10px gap below compact widget
  } else {
    // Collapsing: adjust horizontally to center, keep top position
    newX = x + (currentSize[0] - COMPACT_SIZE.width) / 2;
    newY = y;
  }
  
  // Ensure window stays within screen bounds
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  newX = Math.max(0, Math.min(newX, screenWidth - size.width));
  newY = Math.max(0, Math.min(newY, screenHeight - size.height));
  
  overlayWindow.setBounds({
    x: newX,
    y: newY,
    width: size.width,
    height: size.height,
  }, animated);
}

function registerShortcuts() {
  globalShortcut.register(isMac ? "Command+K" : "Control+K", () => toggleOverlay());
}

app.whenReady().then(async () => {
  nativeTheme.themeSource = "dark";
  await createOverlayWindow();
  if (overlayWindow) {
    overlayWindow.showInactive();
  }
  registerShortcuts();

  ipcMain.handle("sky:toggle", (_, payload: { visible?: boolean }) => {
    toggleOverlay(payload.visible);
  });

  ipcMain.handle("sky:expand", () => {
    setWindowSize(EXPANDED_SIZE);
    // Keep transparent but visible when expanded
    if (overlayWindow) {
      overlayWindow.setBackgroundColor("#00000000"); // Fully transparent
      overlayWindow.setOpacity(1.0); // Full opacity - blur handled by CSS
    }
    safeSend("sky:expanded", true);
  });

  ipcMain.handle("sky:collapse", () => {
    setWindowSize(COMPACT_SIZE);
    // Restore transparency when collapsed
    if (overlayWindow) {
      overlayWindow.setBackgroundColor("#00000000");
      overlayWindow.setOpacity(1.0);
    }
    safeSend("sky:expanded", false);
  });

  ipcMain.handle("sky:setPosition", (_, payload: { x: number; y: number }) => {
    if (overlayWindow) {
      overlayWindow.setPosition(payload.x, payload.y);
    }
  });

  app.on("activate", () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      createOverlayWindow();
      if (overlayWindow) {
        overlayWindow.showInactive();
      }
    } else {
      overlayWindow.showInactive();
    }
  });
});

app.on("will-quit", (event) => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});

app.on("before-quit", () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  // Don't quit on macOS - keep the app running in the background
  // Shortcuts remain registered so Cmd+K can reopen the window
  if (!isMac) {
    globalShortcut.unregisterAll();
    app.quit();
  }
});

// Handle app termination (SIGTERM, SIGINT)
process.on("SIGTERM", () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
  app.quit();
});

process.on("SIGINT", () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
  app.quit();
});

// Ensure shortcuts are unregistered on any exit
process.on("exit", () => {
  globalShortcut.unregisterAll();
});

