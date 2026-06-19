import { useState, useCallback } from "react";
import DropZone from "../components/DropZone";
import FileList from "../components/FileList";
import ProgressPanel from "../components/ProgressPanel";
import { useFiles } from "../hooks/useFiles";
import { useIPC } from "../hooks/useIPC";

type PDFMode = "merge" | "split";

export default function PDFPage() {
  const { files, addFiles, removeFile } = useFiles();
  const { pdfMerge, pdfSplit, cancelConvert } = useIPC();
  const [mode, setMode] = useState<PDFMode>("merge");
  const [splitRanges, setSplitRanges] = useState("1-3,4-6");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const inactive = running || files.length === 0;
  const handleDrop = useCallback((paths: string[]) => addFiles(paths), [addFiles]);
  const handleClick = async () => {
    const paths = await window.electronAPI.openFile([{ name: "PDF", extensions: ["pdf"] }]);
    if (paths?.length) addFiles(paths);
  };
  const doConvert = async () => {
    if (files.length === 0) return;
    setRunning(true); setProgress({ percent: 0, time: "", speed: "", raw: "" });
    try {
      if (mode === "merge") {
        const savePath = await window.electronAPI.saveFile({ filters: [{ name: "PDF", extensions: ["pdf"] }], defaultPath: "merged.pdf" });
        if (!savePath) { setRunning(false); return; }
        await pdfMerge({ inputPaths: files.map((f) => f.path), outputPath: savePath });
      } else {
        const saveDir = await window.electronAPI.saveFile({ defaultPath: "split_output" });
        if (!saveDir) { setRunning(false); return; }
        const ranges = splitRanges.split(",").map((r) => { const [s, e] = r.split("-").map(Number); return { start: s, end: e }; });
        await pdfSplit({ inputPath: files[0].path, outputDir: saveDir.replace(/\\[^\\]*$/, ""), ranges });
      }
      setProgress((p: any) => ({ ...p, percent: 100 }));
    } catch (err) { console.error(err); }
    finally { setRunning(false); }
  };
  const is = { background: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" };
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>PDF 工具</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-tertiary)" }}>合并或拆分 PDF 文件，纯本地处理</p>
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
        {(["merge","split"] as PDFMode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} className="px-4 py-1.5 text-sm rounded-lg transition-all duration-150"
            style={{ background: mode === m ? "var(--bg-card)" : "transparent", color: mode === m ? "var(--text-primary)" : "var(--text-secondary)", boxShadow: mode === m ? "var(--shadow-sm)" : "none", fontWeight: mode === m ? 500 : 400 }}>
            {m === "merge" ? "PDF 合并" : "PDF 拆分"}
          </button>
        ))}
      </div>
      <DropZone onFilesDrop={handleDrop}>
        <div onClick={handleClick} className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-[var(--accent-dark)]"
          style={{ border: "2px dashed var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-3xl mb-2">📑</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{mode === "merge" ? "拖拽多个 PDF（按顺序合并）" : "拖拽一个 PDF 文件"}，或点击选择</p>
        </div>
      </DropZone>
      <FileList files={files} onRemove={removeFile} />
      {mode === "split" && (
        <div className="mt-4 rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>页码范围（逗号分隔）</label>
          <input type="text" value={splitRanges} onChange={(e) => setSplitRanges(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm font-mono outline-none" style={is} />
          <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>例如：1-3,4-6 生成 split_1.pdf (1-3页) 和 split_2.pdf (4-6页)</p>
        </div>
      )}
      <ProgressPanel running={running} progress={progress} onCancel={cancelConvert} />
      <button onClick={doConvert} disabled={inactive} className="mt-4 w-full py-3 rounded-xl text-sm font-medium transition-all duration-150"
        style={{ background: inactive ? "var(--bg-secondary)" : "var(--accent-dark)", color: inactive ? "var(--text-tertiary)" : "#fff", boxShadow: inactive ? "none" : "0 2px 8px rgba(0,120,212,0.3)", cursor: inactive ? "not-allowed" : "pointer", opacity: inactive ? 0.6 : 1 }}>
        {running ? "处理中..." : mode === "merge" ? "开始合并" : "开始拆分"}
      </button>
    </div>
  );
}