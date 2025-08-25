const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 1600,
    opacity: 1,
    alwaysOnTop: true,
    frame: true,
    // Exclude from screen capture/sharing
    skipTaskbar: true, // Hide from taskbar/dock
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

  // Alternative method for older Electron versions or additional protection
  if (process.platform === "darwin") {
    // macOS specific: Set window level to make it invisible to screen sharing
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  mainWindow.loadFile("index.html");

  // Uncomment for development
  //mainWindow.webContents.openDevTools();
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
