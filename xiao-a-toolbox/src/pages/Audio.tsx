import { useState, useCallback } from "react";
import DropZone from "../components/DropZone";
import FileList from "../components/FileList";
import FormatSelector from "../components/FormatSelector";
import ProgressPanel from "../components/ProgressPanel";
import { useFiles } from "../hooks/useFiles";
import { useIPC } from "../hooks/useIPC";

type AudioMode = "convert" | "merge";
const AUDIO_FORMATS = [
  { value: "mp3", label: "MP3" }, { value: "wav", label: "WAV" },
  { value: "aac", label: "AAC" }, { value: "flac", label: "FLAC" },
  { value: "ogg", label: "OGG" }, { value: "wma", label: "WMA" },
];

export default function AudioPage() {
  const { files, addFiles, removeFile } = useFiles();
  const { convertAudio, audioMerge, startProgress, stopProgress, cancelConvert } = useIPC();
  const [mode, setMode] = useState<AudioMode>("convert");
  const [format, setFormat] = useState("mp3");
  const [bitrate, setBitrate] = useState("192k");
  const [sampleRate, setSampleRate] = useState("44100");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const inactive = running || files.length === 0;
  const is = { background: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" };

  const handleDrop = useCallback((paths: string[]) => addFiles(paths), [addFiles]);
  const handleClick = async () => {
    const paths = await window.electronAPI.openFile([{ name: "音频", extensions: ["mp3","wav","aac","flac","ogg","wma","m4a"] }]);
    if (paths?.length) addFiles(paths);
  };

  const doConvert = async () => {
    if (files.length === 0) return;
    setRunning(true); setProgress({ percent: 0, time: "", speed: "", raw: "" });
    startProgress(setProgress);
    try {
      if (mode === "merge") {
        const savePath = await window.electronAPI.saveFile({ filters: [{ name: "音频", extensions: [format] }], defaultPath: "merged." + format });
        if (!savePath) { setRunning(false); stopProgress(); return; }
        await audioMerge({ inputPaths: files.map((f) => f.path), outputPath: savePath, format, params: { bitrate, sampleRate } });
      } else {
        const input = files[0].path;
        const savePath = await window.electronAPI.saveFile({ filters: [{ name: "音频", extensions: [format] }], defaultPath: files[0].name.replace(/\.[^.]+$/, "." + format) });
        if (!savePath) { setRunning(false); stopProgress(); return; }
        await convertAudio({ inputPath: input, outputPath: savePath, format, params: { bitrate, sampleRate } });
      }
      setProgress((p: any) => ({ ...p, percent: 100 }));
    } catch (err) { console.error(err); }
    finally { setRunning(false); stopProgress(); }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>音频转换</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-tertiary)" }}>转换格式或合并多个音频文件</p>
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
        {(["convert","merge"] as AudioMode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} className="px-4 py-1.5 text-sm rounded-lg transition-all duration-150"
            style={{ background: mode === m ? "var(--bg-card)" : "transparent", color: mode === m ? "var(--text-primary)" : "var(--text-secondary)", boxShadow: mode === m ? "var(--shadow-sm)" : "none", fontWeight: mode === m ? 500 : 400 }}>
            {m === "convert" ? "格式互转" : "音频合并"}
          </button>
        ))}
      </div>
      <DropZone onFilesDrop={handleDrop}>
        <div onClick={handleClick} className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-[var(--accent-dark)]"
          style={{ border: "2px dashed var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-3xl mb-2">🎵</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{mode === "merge" ? "拖拽多个音频文件" : "拖拽音频文件"}，或点击选择</p>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>支持 MP3 / WAV / AAC / FLAC / OGG / WMA</p>
        </div>
      </DropZone>
      <FileList files={files} onRemove={removeFile} />
      <div className="mt-4 rounded-xl border p-5 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
        <FormatSelector formats={AUDIO_FORMATS} value={format} onChange={setFormat} label="输出格式" />
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>码率</label>
          <select value={bitrate} onChange={(e) => setBitrate(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={is}>
            <option value="128k">128 kbps</option><option value="192k">192 kbps</option><option value="256k">256 kbps</option><option value="320k">320 kbps</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>采样率</label>
          <select value={sampleRate} onChange={(e) => setSampleRate(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={is}>
            <option value="22050">22050 Hz</option><option value="44100">44100 Hz</option><option value="48000">48000 Hz</option>
          </select>
        </div>
      </div>
      <ProgressPanel running={running} progress={progress} onCancel={cancelConvert} />
      <button onClick={doConvert} disabled={inactive} className="mt-4 w-full py-3 rounded-xl text-sm font-medium transition-all duration-150"
        style={{ background: inactive ? "var(--bg-secondary)" : "var(--accent-dark)", color: inactive ? "var(--text-tertiary)" : "#fff", boxShadow: inactive ? "none" : "0 2px 8px rgba(0,120,212,0.3)", cursor: inactive ? "not-allowed" : "pointer", opacity: inactive ? 0.6 : 1 }}>
        {running ? "转换中..." : "开始转换"}
      </button>
    </div>
  );
}