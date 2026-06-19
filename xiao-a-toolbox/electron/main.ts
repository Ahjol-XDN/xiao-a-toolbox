import { app, BrowserWindow, ipcMain, dialog, Notification } from "electron";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
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
    title: "小A万能转换工具箱 2.0",
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

  // --- config persistence ---
  const configPath = join(app.getPath("userData"), "config.json");
  function readConfig(): Record<string, any> {
    try { return JSON.parse(readFileSync(configPath, "utf-8")); } catch { return {}; }
  }
  function writeConfig(updates: Record<string, any>) {
    const dir = app.getPath("userData");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const cfg = readConfig();
    Object.assign(cfg, updates);
    writeFileSync(configPath, JSON.stringify(cfg, null, 2), "utf-8");
  }

  ipcMain.handle("config:get", (_e, key: string) => {
    const cfg = readConfig();
    return key !== undefined ? cfg[key] : cfg;
  });
  ipcMain.handle("config:set", (_e, key: string, value: any) => {
    writeConfig({ [key]: value });
    return value;
  });

  ipcMain.handle("dialog:openFile", async (_e, options) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openFile", "multiSelections"],
      filters: options?.filters,
    });
    return result.filePaths;
  });

  ipcMain.handle("dialog:openDirectory", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openDirectory"],
      title: "选择输出目录",
    });
    return result.filePaths?.[0] ?? null;
  });

  ipcMain.handle("dialog:saveFile", async (_e, options) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      filters: options?.filters,
      defaultPath: options?.defaultPath,
    });
    return result.filePath;
  });

  ipcMain.handle("app:getEngines", () => detectEngines());

  // --- history ---
  const historyPath = join(app.getPath("userData"), "history.json");
  function readHistory(): any[] {
    try { return JSON.parse(readFileSync(historyPath, "utf-8")); } catch { return []; }
  }
  function writeHistory(entries: any[]) {
    const dir = app.getPath("userData");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(historyPath, JSON.stringify(entries, null, 2), "utf-8");
  }

  ipcMain.handle("history:get", () => readHistory());
  ipcMain.handle("history:add", (_e, entry: any) => {
    const entries = readHistory();
    entries.unshift({ ...entry, timestamp: Date.now() });
    if (entries.length > 100) entries.length = 100;
    writeHistory(entries);
    return entries;
  });
  ipcMain.handle("history:clear", () => {
    writeHistory([]);
    return [];
  });

  // --- notification helper ---
  ipcMain.handle("app:notify", (_e, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body });
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
