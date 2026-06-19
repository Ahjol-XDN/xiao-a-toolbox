import { ipcMain, BrowserWindow } from "electron";
import { spawn, ChildProcess } from "child_process";
import { getEnginePaths } from "../engines";
import { parseFfmpegProgress } from "../utils";

export function registerBatchHandlers() {
  ipcMain.handle("batch:convert", async (_e, tasks) => {
    const results: string[] = [];
    const win = BrowserWindow.getAllWindows()[0];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const ffmpeg = getEnginePaths().ffmpeg;
      const args = ["-y", "-i", task.inputPath];
      if (task.params?.bitrate) args.push("-b:v", String(task.params.bitrate));
      if (task.params?.resolution) args.push("-vf", `scale=${task.params.resolution}`);
      args.push(task.outputPath);

      await new Promise<void>((resolve, reject) => {
        const proc = spawn(ffmpeg, args);
        proc.stderr.on("data", (d: Buffer) => {
          const progress = parseFfmpegProgress(d.toString());
          if (progress && win) {
            win.webContents.send("progress", {
              ...progress,
              raw: `[${i + 1}/${tasks.length}] ${task.inputPath}`,
            });
          }
        });
        proc.on("close", (code) => {
          if (code === 0) { results.push(task.outputPath); resolve(); }
          else { results.push(`FAILED: ${task.inputPath}`); resolve(); }
        });
        proc.on("error", (err) => { results.push(`ERROR: ${task.inputPath}`); resolve(); });
      });
    }
    return results;
  });
}
