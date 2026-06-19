#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync, mkdirSync, createWriteStream } from "fs";
import { join } from "path";
import { get } from "https";
import { createGunzip } from "zlib";
import { Extract } from "unzipper";
import { pipeline } from "stream/promises";

const ENGINES_DIR = join(__dirname, "..", "engines");

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    mkdirSync(join(dest, ".."), { recursive: true });
    const file = createWriteStream(dest);
    get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        download(res.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", reject);
  });
}

async function main() {
  console.log("=== 下载转换引擎 ===\n");
  mkdirSync(ENGINES_DIR, { recursive: true });

  // FFmpeg
  console.log("[1/3] 下载 FFmpeg...");
  const ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip";
  const ffmpegZip = join(ENGINES_DIR, "ffmpeg.zip");
  if (!existsSync(join(ENGINES_DIR, "ffmpeg", "bin", "ffmpeg.exe"))) {
    await download(ffmpegUrl, ffmpegZip);
    console.log("  解压中...");
    const unzipper = await import("unzipper");
    const fs = await import("fs");
    const readStream = fs.createReadStream(ffmpegZip);
    const extractStream = unzipper.Extract({ path: join(ENGINES_DIR, "ffmpeg-tmp") });
    await pipeline(readStream, extractStream);
    const tmpDir = fs.readdirSync(join(ENGINES_DIR, "ffmpeg-tmp"))[0];
    fs.renameSync(join(ENGINES_DIR, "ffmpeg-tmp", tmpDir), join(ENGINES_DIR, "ffmpeg"));
    fs.rmSync(join(ENGINES_DIR, "ffmpeg-tmp"), { recursive: true, force: true });
    fs.unlinkSync(ffmpegZip);
    console.log("  FFmpeg 下载完成");
  } else {
    console.log("  FFmpeg 已存在，跳过");
  }

  // Pandoc
  console.log("[2/3] 下载 Pandoc...");
  const pandocUrl = "https://github.com/jgm/pandoc/releases/download/3.2.1/pandoc-3.2.1-windows-x86_64.zip";
  const pandocZip = join(ENGINES_DIR, "pandoc.zip");
  if (!existsSync(join(ENGINES_DIR, "pandoc", "pandoc.exe"))) {
    await download(pandocUrl, pandocZip);
    console.log("  解压中...");
    const unzipper = await import("unzipper");
    const fs = await import("fs");
    const readStream = fs.createReadStream(pandocZip);
    const extractStream = unzipper.Extract({ path: join(ENGINES_DIR, "pandoc-tmp") });
    await pipeline(readStream, extractStream);
    const pandocDir = join(ENGINES_DIR, "pandoc");
    mkdirSync(pandocDir, { recursive: true });
    const tmpSub = fs.readdirSync(join(ENGINES_DIR, "pandoc-tmp"))[0];
    const files = fs.readdirSync(join(ENGINES_DIR, "pandoc-tmp", tmpSub));
    for (const f of files) {
      fs.renameSync(join(ENGINES_DIR, "pandoc-tmp", tmpSub, f), join(pandocDir, f));
    }
    fs.rmSync(join(ENGINES_DIR, "pandoc-tmp"), { recursive: true, force: true });
    fs.unlinkSync(pandocZip);
    console.log("  Pandoc 下载完成");
  } else {
    console.log("  Pandoc 已存在，跳过");
  }

  // LibreOffice Portable
  console.log("[3/3] 下载 LibreOffice...");
  const loUrl = "https://download.documentfoundation.org/libreoffice/portable/24.2.5/LibreOfficePortable_24.2.5_MultilingualStandard.paf.exe";
  const loExe = join(ENGINES_DIR, "libreoffice.paf.exe");
  if (!existsSync(join(ENGINES_DIR, "libreoffice", "program", "soffice.exe"))) {
    console.log("  LibreOffice Portable 请手动下载并解压到 engines/libreoffice/");
    console.log(`  下载地址: ${loUrl}`);
    console.log("  安装方法：运行 paf.exe 解压，将 App/libreoffice/ 内容复制到 engines/libreoffice/");
  } else {
    console.log("  LibreOffice 已存在，跳过");
  }

  console.log("\n=== 引擎下载完成 ===");
}

main().catch(console.error);
