const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  globalShortcut,
} = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 900,
    opacity: 1,
    alwaysOnTop: true,
    frame: true,
    // Exclude from screen capture/sharing
    skipTaskbar: true, // Hide from taskbar/dock
    // Make window click-through initially
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  // Set the window to be excluded from screen capture
  // This works on macOS, Windows, and Linux
  mainWindow.setContentProtection(true);

  // Make the window ignore mouse events (click-through)
  mainWindow.setIgnoreMouseEvents(true);

  // Alternative method for older Electron versions or additional protection
  if (process.platform === "darwin") {
    // macOS specific: Set window level to make it invisible to screen sharing
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  mainWindow.loadFile("index.html");

  // Register global shortcuts for moving the window
  registerMovementShortcuts();

  // Uncomment for development
  //mainWindow.webContents.openDevTools();
});

function registerMovementShortcuts() {
  const moveDistance = 50; // pixels to move each time

  // Move left
  globalShortcut.register("CommandOrControl+Left", () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x - moveDistance, y);
    }
  });

  // Move right
  globalShortcut.register("CommandOrControl+Right", () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x + moveDistance, y);
    }
  });

  // Move up
  globalShortcut.register("CommandOrControl+Up", () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x, y - moveDistance);
    }
  });

  // Move down
  globalShortcut.register("CommandOrControl+Down", () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x, y + moveDistance);
    }
  });
}

app.on("will-quit", () => {
  // Unregister all shortcuts when app is about to quit
  globalShortcut.unregisterAll();
});

// Handle folder selection
ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result.filePaths[0];
});

// Read files from folder
ipcMain.handle("read-files", (event, folderPath) => {
  return fs.readdirSync(folderPath).filter((file) => file.endsWith(".md"));
});

// Read file content
ipcMain.handle("read-file", (event, filePath) => {
  return fs.readFileSync(filePath, "utf8");
});

// Handle opacity change
ipcMain.on("set-opacity", (event, opacity) => {
  mainWindow.setOpacity(opacity);
});

// Handle close app request
ipcMain.on("close-app", () => {
  app.quit();
});

// Handle mouse events for specific UI areas
ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
  const { forward } = options || {};
  mainWindow.setIgnoreMouseEvents(ignore, { forward });
});
