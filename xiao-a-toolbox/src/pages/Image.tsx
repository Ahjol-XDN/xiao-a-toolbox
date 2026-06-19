import { useState, useCallback, useEffect } from "react";
import DropZone from "../components/DropZone";
import FileList from "../components/FileList";
import FormatSelector from "../components/FormatSelector";
import EstimateSize from "../components/EstimateSize";
import ProgressPanel from "../components/ProgressPanel";
import { useFiles } from "../hooks/useFiles";
import { useKeyboard } from "../hooks/useKeyboard";
import { useIPC } from "../hooks/useIPC";

const IMAGE_FORMATS = [
  { value: "png", label: "PNG" }, { value: "jpg", label: "JPG" },
  { value: "webp", label: "WebP" }, { value: "bmp", label: "BMP" },
  { value: "tiff", label: "TIFF" }, { value: "ico", label: "ICO" },
];

export default function ImagePage() {
  const { files, addFiles, removeFile, reorderFiles } = useFiles();
  const { convertImage, startProgress, stopProgress, cancelConvert, notify, getConfig, addHistory } = useIPC();
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState(95);
  const [resolution, setResolution] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [outputDir, setOutputDir] = useState("");
  const [results, setResults] = useState({ ok: 0, fail: 0 });

  useEffect(() => {
    getConfig().then((cfg: any) => { if (cfg?.outputDir) setOutputDir(cfg.outputDir); });
  }, []);

  const resolveOutput = async (inputFile: any, ext: string): Promise<string | null> => {
    if (outputDir) {
      return `${outputDir}\\${inputFile.name.replace(/\.[^.]+$/, "." + ext)}`;
    }
    return window.electronAPI.saveFile({
      filters: [{ name: "图片", extensions: [ext] }],
      defaultPath: inputFile.name.replace(/\.[^.]+$/, "." + ext),
    });
  };

  const is = { background: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" };
  const handleDrop = useCallback((paths: string[]) => addFiles(paths), [addFiles]);
  const handleClick = async () => {
    const paths = await window.electronAPI.openFile([
      { name: "图片", extensions: ["png", "jpg", "jpeg", "webp", "bmp", "tiff", "ico", "gif"] },
    ]);
    if (paths?.length) addFiles(paths);
  };

  const doConvert = async () => {
    if (files.length === 0) return;
    setRunning(true);
    setResults({ ok: 0, fail: 0 });
    setProgress({ percent: 0, time: "", speed: "", raw: "" });
    startProgress(setProgress);

    let ok = 0;
    let fail = 0;
    const total = files.length;

    for (let i = 0; i < total; i++) {
      try {
        const input = files[i];
        const savePath = await resolveOutput(input, format);
        if (!savePath) { fail++; continue; }
        await convertImage({ inputPath: input.path, outputPath: savePath, format, params: { quality, resolution } });
        ok++;
        addHistory({ input: input.path, output: savePath, format, mode: "image", status: "success" });
      } catch {
        fail++;
        addHistory({ input: files[i].path, output: "", format, mode: "image", status: "failed" });
      }
      setProgress({ percent: Math.round(((i + 1) / total) * 100), time: `${i + 1}/${total}`, speed: "", raw: "" });
    }

    setResults({ ok, fail });
    setProgress((p: any) => ({ ...p, percent: 100 }));
    notify("转换完成", `成功 ${ok} 个, 失败 ${fail} 个`);
    setRunning(false);
    stopProgress();
  };

  useKeyboard({ selectFile: handleClick, startConvert: doConvert, cancelConvert });

  const inactive = running || files.length === 0;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>图片转换</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-tertiary)" }}>转换图片格式、调整质量和尺寸 · 支持多文件</p>

      <DropZone onFilesDrop={handleDrop}>
        <div onClick={handleClick}
          className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-[var(--accent-dark)]"
          style={{ border: "2px dashed var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-3xl mb-2">🖼️</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>拖拽图片到此处，或点击选择</p>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>支持 PNG / JPG / WebP / BMP / TIFF / ICO</p>
        </div>
      </DropZone>

      <FileList files={files} onRemove={removeFile} onReorder={reorderFiles} />

      <div className="mt-4 rounded-xl border p-5 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
        <FormatSelector formats={IMAGE_FORMATS} value={format} onChange={setFormat} label="输出格式" />
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>质量 ({quality}%)</label>
          <input type="range" min={1} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-[#0078d4]" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>尺寸</label>
          <input type="text" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="如 800:600，留空为原尺寸"
            className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ ...is, width: 240 }} />
        </div>
        {files.length > 0 && <EstimateSize filePath={files[0].path} quality={quality} mode="image" />}
      </div>

      <ProgressPanel running={running} progress={progress} onCancel={cancelConvert} />

      {!running && (results.ok > 0 || results.fail > 0) && (
        <div className="mt-3 flex gap-3 text-xs">
          {results.ok > 0 && <span style={{ color: "#107c10" }}>成功 {results.ok} 个</span>}
          {results.fail > 0 && <span style={{ color: "#c42b1c" }}>失败 {results.fail} 个</span>}
        </div>
      )}

      {outputDir && <p className="mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>输出目录：{outputDir}</p>}

      <button onClick={doConvert} disabled={inactive}
        className="mt-4 w-full py-3 rounded-xl text-sm font-medium transition-all duration-150"
        style={{
          background: inactive ? "var(--bg-secondary)" : "var(--accent-dark)",
          color: inactive ? "var(--text-tertiary)" : "#fff",
          boxShadow: inactive ? "none" : "0 2px 8px rgba(0,120,212,0.3)",
          cursor: inactive ? "not-allowed" : "pointer",
          opacity: inactive ? 0.6 : 1,
        }}>
        {running ? "转换中..." : `开始转换 (${files.length} 个文件)`}
      </button>
    </div>
  );
}
