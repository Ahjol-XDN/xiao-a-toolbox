import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "path";
import { registerFfmpegHandlers } from "./ipc/ffmpeg";
import { registerPandocHandlers } from "./ipc/pandoc";
import { registerPdfHandlers } from "./ipc/pdf";
import { registerBatchHandlers } from "./ipc/batch";
import { detectEngines } from "./engines";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: "?A??????? 2.0",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  detectEngines();
  registerFfmpegHandlers();
  registerPandocHandlers();
  registerPdfHandlers();
  registerBatchHandlers();
  createWindow();

  ipcMain.handle("dialog:openFile", async (_e, options) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openFile", "multiSelections"],
      filters: options?.filters,
    });
    return result.filePaths;
  });

  ipcMain.handle("dialog:saveFile", async (_e, options) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      filters: options?.filters,
      defaultPath: options?.defaultPath,
    });
    return result.filePath;
  });

  ipcMain.handle("app:getEngines", () => detectEngines());
});

app.on("window-all-closed", () => {
  app.quit();
});
