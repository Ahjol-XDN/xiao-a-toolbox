import { ipcMain, BrowserWindow } from "electron";
import { spawn, ChildProcess } from "child_process";
import { getEnginePaths } from "../engines";
import { parseFfmpegProgress } from "../utils";

let currentProcess: ChildProcess | null = null;

function getFfmpeg() {
  return getEnginePaths().ffmpeg;
}

function runFfmpeg(args: string[], onData?: (line: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = getFfmpeg();
    const proc = spawn(ffmpeg, args);
    currentProcess = proc;

    proc.stderr.on("data", (data: Buffer) => {
      const text = data.toString();
      if (onData) onData(text);
    });

    proc.on("close", (code) => {
      currentProcess = null;
      code === 0 ? resolve() : reject(new Error(`FFmpeg exited with code ${code}`));
    });

    proc.on("error", (err) => {
      currentProcess = null;
      reject(err);
    });
  });
}

function sendProgress(mainWindow: BrowserWindow | null, info: { percent: number; time: string; speed: string; raw: string }) {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send("progress", info);
}

function buildVideoArgs(inputPath: string, outputPath: string, format: string, params?: Record<string, string | number>): string[] {
  const args: string[] = ["-y", "-i", inputPath];
  if (params?.codec) args.push("-c:v", String(params.codec));
  if (params?.bitrate) args.push("-b:v", String(params.bitrate));
  if (params?.resolution) args.push("-vf", `scale=${params.resolution}`);
  if (params?.crf) args.push("-crf", String(params.crf));
  if (params?.fps) args.push("-r", String(params.fps));
  args.push(outputPath);
  return args;
}

export function registerFfmpegHandlers() {
  ipcMain.handle("ffmpeg:convertVideo", async (_e, opts) => {
    const args = buildVideoArgs(opts.inputPath, opts.outputPath, opts.format, opts.params);
    const onData = (line: string) => {
      const progress = parseFfmpegProgress(line);
      if (progress) sendProgress(null, { ...progress, raw: line });
    };
    await runFfmpeg(args, onData);
    return opts.outputPath;
  });

  ipcMain.handle("ffmpeg:convertAudio", async (_e, opts) => {
    const args = ["-y", "-i", opts.inputPath];
    if (opts.params?.bitrate) args.push("-b:a", String(opts.params.bitrate));
    if (opts.params?.sampleRate) args.push("-ar", String(opts.params.sampleRate));
    if (opts.params?.channels) args.push("-ac", String(opts.params.channels));
    args.push("-vn", opts.outputPath);

    const onData = (line: string) => {
      const progress = parseFfmpegProgress(line);
      if (progress) sendProgress(null, { ...progress, raw: line });
    };
    await runFfmpeg(args, onData);
    return opts.outputPath;
  });

  ipcMain.handle("ffmpeg:convertVideoToGif", async (_e, opts) => {
    const args = ["-y", "-i", opts.inputPath];
    if (opts.params?.fps) args.push("-r", String(opts.params.fps));
    if (opts.params?.resolution) args.push("-vf", `fps=${opts.params.fps ?? 10},scale=${opts.params.resolution ?? "480:-1"}:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`);
    args.push(opts.outputPath);
    await runFfmpeg(args);
    return opts.outputPath;
  });

  ipcMain.handle("ffmpeg:extractAudio", async (_e, opts) => {
    const args = ["-y", "-i", opts.inputPath, "-vn"];
    if (opts.params?.bitrate) args.push("-b:a", String(opts.params.bitrate));
    args.push(opts.outputPath);
    await runFfmpeg(args);
    return opts.outputPath;
  });

  ipcMain.handle("ffmpeg:compressVideo", async (_e, opts) => {
    const args = ["-y", "-i", opts.inputPath];
    if (opts.params?.crf) args.push("-crf", String(opts.params.crf));
    if (opts.params?.codec) args.push("-c:v", String(opts.params.codec));
    if (opts.params?.resolution) args.push("-vf", `scale=${opts.params.resolution}`);
    if (opts.params?.bitrate) args.push("-b:v", String(opts.params.bitrate));
    args.push("-preset", "medium");
    args.push(opts.outputPath);
    const onData = (line: string) => {
      const progress = parseFfmpegProgress(line);
      if (progress) sendProgress(null, { ...progress, raw: line });
    };
    await runFfmpeg(args, onData);
    return opts.outputPath;
  });

  ipcMain.handle("ffmpeg:trimVideo", async (_e, opts) => {
    const args = ["-y", "-i", opts.inputPath];
    if (opts.params?.start) args.push("-ss", String(opts.params.start));
    if (opts.params?.end) args.push("-to", String(opts.params.end));
    args.push("-c", "copy", opts.outputPath);
    await runFfmpeg(args);
    return opts.outputPath;
  });

  ipcMain.handle("ffmpeg:audioMerge", async (_e, opts) => {
    const listContent = opts.inputPaths.map((p: string) => `file '${p.replace(/\\/g, "/")}'`).join("\n");
    const tmpDir = require("os").tmpdir();
    const listPath = require("path").join(tmpDir, `ffmpeg-concat-${Date.now()}.txt`);
    require("fs").writeFileSync(listPath, listContent, "utf-8");
    const args = ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", opts.outputPath];
    await runFfmpeg(args);
    require("fs").unlinkSync(listPath);
    return opts.outputPath;
  });

  ipcMain.handle("ffmpeg:convertImage", async (_e, opts) => {
    const args = ["-y", "-i", opts.inputPath];
    if (opts.params?.quality) args.push("-q:v", String(Math.round((100 - Number(opts.params.quality)) / 100 * 31)));
    if (opts.params?.resolution) args.push("-vf", `scale=${opts.params.resolution}`);
    args.push(opts.outputPath);
    await runFfmpeg(args);
    return opts.outputPath;
  });

  ipcMain.on("convert:cancel", () => {
    if (currentProcess) {
      currentProcess.kill();
      currentProcess = null;
    }
  });
}
