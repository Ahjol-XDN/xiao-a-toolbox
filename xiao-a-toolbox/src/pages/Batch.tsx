import { useState, useCallback, useEffect } from "react";
import DropZone from "../components/DropZone";
import FileList from "../components/FileList";
import FormatSelector from "../components/FormatSelector";
import ProgressPanel from "../components/ProgressPanel";
import { useFiles } from "../hooks/useFiles";
import { useKeyboard } from "../hooks/useKeyboard";
import { useIPC } from "../hooks/useIPC";

const BATCH_FORMATS = [
  { value: "mp4", label: "MP4" }, { value: "mkv", label: "MKV" }, { value: "mp3", label: "MP3" },
  { value: "wav", label: "WAV" }, { value: "png", label: "PNG" }, { value: "jpg", label: "JPG" },
  { value: "webp", label: "WebP" }, { value: "docx", label: "DOCX" }, { value: "pdf", label: "PDF" },
];

export default function BatchPage() {
  const { files, addFiles, removeFile, reorderFiles } = useFiles();
  const { batchConvert, startProgress, stopProgress, cancelConvert, notify, getConfig, addHistory } = useIPC();
  const [format, setFormat] = useState("mp4");
  const [outputDir, setOutputDir] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    getConfig().then((cfg: any) => { if (!outputDir && cfg?.outputDir) setOutputDir(cfg.outputDir); });
  }, []);

  const is = { background: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" };
  const handleDrop = useCallback((paths: string[]) => addFiles(paths), [addFiles]);
  const handleClick = async () => {
    const paths = await window.electronAPI.openFile([
      { name: "所有支持格式", extensions: ["mp4", "mkv", "avi", "mov", "webm", "flv", "mp3", "wav", "aac", "flac", "ogg", "png", "jpg", "jpeg", "webp", "bmp", "docx", "pdf", "md", "txt"] },
    ]);
    if (paths?.length) addFiles(paths);
  };

  const selectOutputDir = async () => {
    const dir = await window.electronAPI.openDirectory();
    if (dir) setOutputDir(dir);
  };

  const doConvert = async () => {
    if (files.length === 0 || !outputDir) return;
    setRunning(true);
    setResults([]);
    setProgress({ percent: 0, time: "", speed: "", raw: "" });
    startProgress(setProgress);

    const tasks = files.map((f) => ({
      inputPath: f.path,
      outputPath: outputDir + "\\" + f.name.replace(/\.[^.]+$/, "." + format),
      format,
    }));

    try {
      const res = await batchConvert(tasks);
      setResults(res);
      res.forEach((r, i) => {
        addHistory({
          input: files[i].path,
          output: r.startsWith("FAILED") || r.startsWith("ERROR") ? "" : r,
          format,
          mode: "batch",
          status: r.startsWith("FAILED") || r.startsWith("ERROR") ? "failed" : "success",
        });
      });
      const ok = res.filter((r) => !r.startsWith("FAILED") && !r.startsWith("ERROR")).length;
      const fail = res.length - ok;
      notify("批量转换完成", `成功 ${ok} 个, 失败 ${fail} 个`);
    } catch (err) { console.error(err); }

    setProgress((p: any) => ({ ...p, percent: 100 }));
    setRunning(false);
    stopProgress();
  };

  useKeyboard({ selectFile: handleClick, startConvert: doConvert, cancelConvert });

  const inactive = running || files.length === 0 || !outputDir;
  const success = results.filter((r) => !r.startsWith("FAILED") && !r.startsWith("ERROR")).length;
  const failed = results.length - success;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>批量转换</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-tertiary)" }}>统一格式批量处理多个文件</p>

      <DropZone onFilesDrop={handleDrop}>
        <div onClick={handleClick}
          className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-[var(--accent-dark)]"
          style={{ border: "2px dashed var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-3xl mb-2">📦</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>拖拽多个文件到此处，或点击选择</p>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>支持视频 / 音频 / 图片 / 文档混合批量转换</p>
        </div>
      </DropZone>

      <FileList files={files} onRemove={removeFile} onReorder={reorderFiles} />

      <div className="mt-4 rounded-xl border p-5 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
        <FormatSelector formats={BATCH_FORMATS} value={format} onChange={setFormat} label="统一输出格式" />
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>输出目录</label>
          <div className="flex gap-2">
            <input type="text" readOnly value={outputDir} className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={is} placeholder="点击右侧按钮选择目录" />
            <button onClick={selectOutputDir} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>选择目录</button>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-4 rounded-xl border p-5 max-h-44 overflow-y-auto" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>转换结果</span>
            <span className="text-xs" style={{ color: "#107c10" }}>成功 {success}</span>
            {failed > 0 && <span className="text-xs" style={{ color: "#c42b1c" }}>失败 {failed}</span>}
          </div>
          {results.map((r, i) => (
            <p key={i} className="text-xs font-mono truncate" style={{ color: r.startsWith("FAILED") || r.startsWith("ERROR") ? "#c42b1c" : "#107c10" }}>{r}</p>
          ))}
        </div>
      )}

      <ProgressPanel running={running} progress={progress} onCancel={cancelConvert} />

      <button onClick={doConvert} disabled={inactive}
        className="mt-4 w-full py-3 rounded-xl text-sm font-medium transition-all duration-150"
        style={{
          background: inactive ? "var(--bg-secondary)" : "var(--accent-dark)",
          color: inactive ? "var(--text-tertiary)" : "#fff",
          boxShadow: inactive ? "none" : "0 2px 8px rgba(0,120,212,0.3)",
          cursor: inactive ? "not-allowed" : "pointer",
          opacity: inactive ? 0.6 : 1,
        }}>
        {running ? `转换中 (${files.length} 个)...` : `批量转换 ${files.length} 个文件`}
      </button>
    </div>
  );
}
