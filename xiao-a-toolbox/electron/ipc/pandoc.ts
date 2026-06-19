import { ipcMain } from "electron";
import { spawn } from "child_process";
import { getEnginePaths } from "../engines";

function getPandoc() {
  return getEnginePaths().pandoc;
}

export function registerPandocHandlers() {
  ipcMain.handle("convert:document", async (_e, opts) => {
    const { inputPath, outputPath, params } = opts;
    const args = [inputPath, "-o", outputPath, "--standalone"];
    if (params?.toc) args.push("--toc");

    return new Promise<string>((resolve, reject) => {
      const proc = spawn(getPandoc(), args);
      let stderr = "";
      proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
      proc.on("close", (code) => {
        code === 0 ? resolve(outputPath) : reject(new Error(stderr || `Pandoc exited ${code}`));
      });
      proc.on("error", reject);
    });
  });
}
