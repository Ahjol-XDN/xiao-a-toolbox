import { contextBridge, ipcRenderer } from "electron";

export interface ConvertOptions {
  inputPath: string;
  outputPath: string;
  format: string;
  params?: Record<string, string | number>;
}

export interface ProgressInfo {
  percent: number;
  time: string;
  fps?: number;
  speed?: string;
  raw: string;
}

export interface EngineStatus {
  ffmpeg: boolean;
  pandoc: boolean;
  libreoffice: boolean;
  paths: Record<string, string>;
}

export interface HistoryEntry {
  input: string;
  output: string;
  format: string;
  mode: string;
  status: string;
  timestamp: number;
}

const api = {
  openFile: (filters?: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke("dialog:openFile", { filters }) as Promise<string[]>,

  openDirectory: () =>
    ipcRenderer.invoke("dialog:openDirectory") as Promise<string | null>,

  saveFile: (options?: { filters?: { name: string; extensions: string[] }[]; defaultPath?: string }) =>
    ipcRenderer.invoke("dialog:saveFile", options) as Promise<string | null>,

  getConfig: (key?: string) =>
    ipcRenderer.invoke("config:get", key) as Promise<any>,

  setConfig: (key: string, value: any) =>
    ipcRenderer.invoke("config:set", key, value) as Promise<any>,

  getHistory: () =>
    ipcRenderer.invoke("history:get") as Promise<HistoryEntry[]>,

  addHistory: (entry: Omit<HistoryEntry, "timestamp">) =>
    ipcRenderer.invoke("history:add", entry) as Promise<HistoryEntry[]>,

  clearHistory: () =>
    ipcRenderer.invoke("history:clear") as Promise<[]>,

  notify: (title: string, body: string) =>
    ipcRenderer.invoke("app:notify", title, body),

  getMediaInfo: (path: string) =>
    ipcRenderer.invoke("ffprobe:getInfo", path) as Promise<any>,

  convertVideo: (opts: ConvertOptions) =>
    ipcRenderer.invoke("ffmpeg:convertVideo", opts) as Promise<string>,

  convertAudio: (opts: ConvertOptions) =>
    ipcRenderer.invoke("ffmpeg:convertAudio", opts) as Promise<string>,

  convertVideoToGif: (opts: ConvertOptions) =>
    ipcRenderer.invoke("ffmpeg:convertVideoToGif", opts) as Promise<string>,

  extractAudio: (opts: ConvertOptions) =>
    ipcRenderer.invoke("ffmpeg:extractAudio", opts) as Promise<string>,

  extractFrame: (opts: ConvertOptions) =>
    ipcRenderer.invoke("ffmpeg:extractFrame", opts) as Promise<string>,

  compressVideo: (opts: ConvertOptions) =>
    ipcRenderer.invoke("ffmpeg:compressVideo", opts) as Promise<string>,

  trimVideo: (opts: ConvertOptions) =>
    ipcRenderer.invoke("ffmpeg:trimVideo", opts) as Promise<string>,

  trimAudio: (opts: ConvertOptions) =>
    ipcRenderer.invoke("ffmpeg:trimAudio", opts) as Promise<string>,

  audioMerge: (opts: { inputPaths: string[]; outputPath: string; format: string; params?: Record<string, string | number> }) =>
    ipcRenderer.invoke("ffmpeg:audioMerge", opts) as Promise<string>,

  convertDocument: (opts: ConvertOptions) =>
    ipcRenderer.invoke("convert:document", opts) as Promise<string>,

  convertImage: (opts: ConvertOptions) =>
    ipcRenderer.invoke("ffmpeg:convertImage", opts) as Promise<string>,

  pdfMerge: (opts: { inputPaths: string[]; outputPath: string }) =>
    ipcRenderer.invoke("pdf:merge", opts) as Promise<string>,

  pdfSplit: (opts: { inputPath: string; outputDir: string; ranges: { start: number; end: number }[] }) =>
    ipcRenderer.invoke("pdf:split", opts) as Promise<string>,

  batchConvert: (tasks: ConvertOptions[]) =>
    ipcRenderer.invoke("batch:convert", tasks) as Promise<string[]>,

  getEngines: () =>
    ipcRenderer.invoke("app:getEngines") as Promise<EngineStatus>,

  onProgress: (callback: (info: ProgressInfo) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, info: ProgressInfo) => callback(info);
    ipcRenderer.on("progress", handler);
    return () => ipcRenderer.removeListener("progress", handler);
  },

  cancelConvert: () => ipcRenderer.send("convert:cancel"),
};

contextBridge.exposeInMainWorld("electronAPI", api);

export type ElectronAPI = typeof api;
