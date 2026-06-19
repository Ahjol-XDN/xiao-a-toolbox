import { ipcMain } from "electron";
import { PDFDocument } from "pdf-lib";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export function registerPdfHandlers() {
  ipcMain.handle("pdf:merge", async (_e, opts) => {
    const { inputPaths, outputPath } = opts;
    const mergedDoc = await PDFDocument.create();

    for (const path of inputPaths) {
      const bytes = readFileSync(path);
      const doc = await PDFDocument.load(bytes);
      const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach((p) => mergedDoc.addPage(p));
    }

    const mergedBytes = await mergedDoc.save();
    writeFileSync(outputPath, mergedBytes);
    return outputPath;
  });

  ipcMain.handle("pdf:split", async (_e, opts) => {
    const { inputPath, outputDir, ranges } = opts;
    const bytes = readFileSync(inputPath);
    const srcDoc = await PDFDocument.load(bytes);
    mkdirSync(outputDir, { recursive: true });
    const results: string[] = [];

    for (let i = 0; i < ranges.length; i++) {
      const { start, end } = ranges[i];
      const newDoc = await PDFDocument.create();
      for (let p = Math.max(0, start - 1); p < Math.min(srcDoc.getPageCount(), end); p++) {
        const [copied] = await newDoc.copyPages(srcDoc, [p]);
        newDoc.addPage(copied);
      }
      const outPath = join(outputDir, `split_${i + 1}.pdf`);
      writeFileSync(outPath, await newDoc.save());
      results.push(outPath);
    }
    return results;
  });
}
