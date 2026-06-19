import { app } from "electron";
import { join } from "path";
import { existsSync } from "fs";

interface EnginePaths {
  ffmpeg: string;
  ffprobe: string;
  pandoc: string;
}

const engines: { paths: EnginePaths; available: Record<string, boolean> } = {
  paths: { ffmpeg: "ffmpeg", ffprobe: "ffprobe", pandoc: "pandoc" },
  available: { ffmpeg: false, pandoc: false },
};

export function detectEngines() {
  const isDev = !app.isPackaged;
  const basePath = isDev
    ? join(__dirname, "..", "engines")
    : join(process.resourcesPath, "engines");

  const ffmpegDir = join(basePath, "ffmpeg", "bin");
  if (existsSync(join(ffmpegDir, "ffmpeg.exe"))) {
    engines.paths.ffmpeg = join(ffmpegDir, "ffmpeg.exe");
    engines.paths.ffprobe = join(ffmpegDir, "ffprobe.exe");
    engines.available.ffmpeg = true;
  }

  const pandocPath = join(basePath, "pandoc", "pandoc.exe");
  if (existsSync(pandocPath)) {
    engines.paths.pandoc = pandocPath;
    engines.available.pandoc = true;
  }

  return {
    ffmpeg: engines.available.ffmpeg,
    pandoc: engines.available.pandoc,
    paths: engines.paths,
  };
}

export function getEnginePaths(): EnginePaths {
  return engines.paths;
}
