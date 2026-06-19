import { useState } from "react";
import DropZone from "../components/DropZone";
import FileList from "../components/FileList";
import FormatSelector from "../components/FormatSelector";
import ProgressPanel from "../components/ProgressPanel";
import { useFiles } from "../hooks/useFiles";
import { useIPC } from "../hooks/useIPC";

const DOC_FORMATS = [
  { value: "docx", label: "DOCX" }, { value: "pdf", label: "PDF" },
  { value: "md", label: "Markdown" }, { value: "txt", label: "TXT" },
  { value: "html", label: "HTML" }, { value: "rtf", label: "RTF" },
];

export default function DocumentPage() {
  const { files, addFiles, removeFile } = useFiles();
  const { convertDocument, startProgress, stopProgress, cancelConvert } = useIPC();
  const [format, setFormat] = useState("docx");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const inactive = running || files.length === 0;
  const handleDrop = (paths: string[]) => addFiles(paths);
  const handleClick = async () => {
    const paths = await window.electronAPI.openFile([{ name: "文档", extensions: ["docx","doc","pdf","md","txt","html","rtf","odt","epub"] }]);
    if (paths?.length) addFiles(paths);
  };
  const doConvert = async () => {
    if (files.length === 0) return;
    setRunning(true); setProgress({ percent: 0, time: "", speed: "", raw: "" });
    startProgress(setProgress);
    try {
      const savePath = await window.electronAPI.saveFile({ filters: [{ name: "文档", extensions: [format] }], defaultPath: files[0].name.replace(/\.[^.]+$/, "." + format) });
      if (!savePath) { setRunning(false); stopProgress(); return; }
      await convertDocument({ inputPath: files[0].path, outputPath: savePath, format });
      setProgress((p: any) => ({ ...p, percent: 100 }));
    } catch (err) { console.error(err); }
    finally { setRunning(false); stopProgress(); }
  };
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>文档转换</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-tertiary)" }}>使用 Pandoc 引擎在本地转换文档格式</p>
      <DropZone onFilesDrop={handleDrop}>
        <div onClick={handleClick} className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-[var(--accent-dark)]"
          style={{ border: "2px dashed var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-3xl mb-2">📄</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>拖拽文档到此处，或点击选择</p>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>支持 DOCX / PDF / MD / TXT / HTML / RTF / EPUB</p>
        </div>
      </DropZone>
      <FileList files={files} onRemove={removeFile} />
      <div className="mt-4 rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
        <FormatSelector formats={DOC_FORMATS} value={format} onChange={setFormat} label="输出格式" />
      </div>
      <ProgressPanel running={running} progress={progress} onCancel={cancelConvert} />
      <button onClick={doConvert} disabled={inactive} className="mt-4 w-full py-3 rounded-xl text-sm font-medium transition-all duration-150"
        style={{ background: inactive ? "var(--bg-secondary)" : "var(--accent-dark)", color: inactive ? "var(--text-tertiary)" : "#fff", boxShadow: inactive ? "none" : "0 2px 8px rgba(0,120,212,0.3)", cursor: inactive ? "not-allowed" : "pointer", opacity: inactive ? 0.6 : 1 }}>
        {running ? "转换中..." : "开始转换"}
      </button>
    </div>
  );
}