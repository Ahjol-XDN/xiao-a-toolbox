import { useState, useCallback } from "react";
import DropZone from "../components/DropZone";
import FileList from "../components/FileList";
import FormatSelector from "../components/FormatSelector";
import ProgressPanel from "../components/ProgressPanel";
import { useFiles } from "../hooks/useFiles";
import { useIPC } from "../hooks/useIPC";

type VideoMode = "convert" | "compress" | "trim" | "extract-audio" | "gif";

const VIDEO_FORMATS = [
  { value: "mp4", label: "MP4" }, { value: "mkv", label: "MKV" },
  { value: "avi", label: "AVI" }, { value: "mov", label: "MOV" },
  { value: "webm", label: "WebM" }, { value: "flv", label: "FLV" },
];
const AUDIO_FORMATS = [
  { value: "mp3", label: "MP3" }, { value: "aac", label: "AAC" }, { value: "wav", label: "WAV" },
];
const CODECS = [
  { value: "libx264", label: "H.264" }, { value: "libx265", label: "H.265" },
  { value: "libvpx-vp9", label: "VP9" }, { value: "copy", label: "复制" },
];
const RESOLUTIONS = [
  { value: "", label: "原始" }, { value: "1920:1080", label: "1080p" },
  { value: "1280:720", label: "720p" }, { value: "854:480", label: "480p" },
];

export default function VideoPage() {
  const { files, addFiles, removeFile } = useFiles();
  const { convertVideo, compressVideo, trimVideo, extractAudio, convertVideoToGif, startProgress, stopProgress, cancelConvert } = useIPC();
  const [mode, setMode] = useState<VideoMode>("convert");
  const [format, setFormat] = useState("mp4");
  const [codec, setCodec] = useState("libx264");
  const [resolution, setResolution] = useState("");
  const [crf, setCrf] = useState(23);
  const [bitrate, setBitrate] = useState("");
  const [startTime, setStartTime] = useState("00:00:00");
  const [endTime, setEndTime] = useState("00:00:10");
  const [gifFps, setGifFps] = useState(10);
  const [gifSize, setGifSize] = useState("480:-1");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  const handleDrop = useCallback((paths: string[]) => addFiles(paths), [addFiles]);
  const handleClickSelect = async () => {
    const paths = await window.electronAPI.openFile([{ name: "视频", extensions: ["mp4","mkv","avi","mov","webm","flv","wmv"] }]);
    if (paths?.length) addFiles(paths);
  };

  const doConvert = async () => {
    if (files.length === 0) return;
    setRunning(true); setProgress({ percent: 0, time: "", speed: "", raw: "" });
    startProgress(setProgress);
    try {
      const input = files[0].path;
      const ext = mode === "extract-audio" ? format : mode === "gif" ? "gif" : format;
      const savePath = await window.electronAPI.saveFile({
        filters: [{ name: "输出", extensions: [ext] }],
        defaultPath: files[0].name.replace(/\.[^.]+$/, "." + ext),
      });
      if (!savePath) { setRunning(false); stopProgress(); return; }
      const params: any = {};
      if (mode === "convert" || mode === "compress") {
        if (codec && codec !== "copy") params.codec = codec;
        if (resolution) params.resolution = resolution;
        if (bitrate) params.bitrate = bitrate;
        if (crf) params.crf = crf;
      }
      if (mode === "trim") { params.start = startTime; params.end = endTime; }
      if (mode === "gif") { params.fps = gifFps; params.resolution = gifSize; }

      if (mode === "convert" || mode === "compress") {
        mode === "compress"
          ? await compressVideo({ inputPath: input, outputPath: savePath, format: ext, params })
          : await convertVideo({ inputPath: input, outputPath: savePath, format: ext, params });
      } else if (mode === "trim") {
        await trimVideo({ inputPath: input, outputPath: savePath, format: ext, params });
      } else if (mode === "extract-audio") {
        await extractAudio({ inputPath: input, outputPath: savePath, format: ext, params });
      } else if (mode === "gif") {
        await convertVideoToGif({ inputPath: input, outputPath: savePath, format: "gif", params });
      }
      setProgress((p: any) => ({ ...p, percent: 100 }));
    } catch (err) { console.error(err); }
    finally { setRunning(false); stopProgress(); }
  };

  const modeLabels: Record<VideoMode, string> = {
    convert: "格式互转", compress: "视频压缩", trim: "视频裁剪", "extract-audio": "提取音频", gif: "GIF转换",
  };
  const inactive = running || files.length === 0;
  const inputStyle = { background: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>视频转换</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-tertiary)" }}>转换、压缩、裁剪您的视频文件</p>

      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
        {(Object.keys(modeLabels) as VideoMode[]).map((m) => (
          <button key={m}
            onClick={() => { setMode(m); if (m === "extract-audio") setFormat("mp3"); else if (m !== "gif") setFormat("mp4"); }}
            className="px-4 py-1.5 text-sm rounded-lg transition-all duration-150"
            style={{ background: mode === m ? "var(--bg-card)" : "transparent", color: mode === m ? "var(--text-primary)" : "var(--text-secondary)", boxShadow: mode === m ? "var(--shadow-sm)" : "none", fontWeight: mode === m ? 500 : 400 }}>
            {modeLabels[m]}
          </button>
        ))}
      </div>

      <DropZone onFilesDrop={handleDrop}>
        <div onClick={handleClickSelect} className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-[var(--accent-dark)]"
          style={{ border: "2px dashed var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-3xl mb-2">🎬</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>拖拽视频文件到此处，或点击选择</p>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>支持 MP4 / MKV / AVI / MOV / WebM / FLV</p>
        </div>
      </DropZone>
      <FileList files={files} onRemove={removeFile} />

      {(mode === "convert" || mode === "compress") && (
        <div className="mt-4 rounded-xl border p-5 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          {mode === "convert" && <FormatSelector formats={VIDEO_FORMATS} value={format} onChange={setFormat} label="输出格式" />}
          <FormatSelector formats={CODECS} value={codec} onChange={setCodec} label="视频编码" />
          <FormatSelector formats={RESOLUTIONS} value={resolution} onChange={setResolution} label="分辨率" />
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>CRF 质量 ({crf})</label>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>高质量</span>
              <input type="range" min={0} max={51} value={crf} onChange={(e) => setCrf(Number(e.target.value))} className="flex-1 accent-[#0078d4]" />
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>小体积</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>码率限制</label>
            <input type="text" value={bitrate} onChange={(e) => setBitrate(e.target.value)} placeholder="如 2M"
              className="px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
        </div>
      )}

      {mode === "trim" && (
        <div className="mt-4 rounded-xl border p-5 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <div className="flex gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>起始时间</label>
              <input type="text" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{...inputStyle, width: 140}} placeholder="00:00:00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>结束时间</label>
              <input type="text" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{...inputStyle, width: 140}} placeholder="00:00:10" />
            </div>
          </div>
        </div>
      )}

      {mode === "extract-audio" && (
        <div className="mt-4 rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <FormatSelector formats={AUDIO_FORMATS} value={format} onChange={setFormat} label="输出音频格式" />
        </div>
      )}

      {mode === "gif" && (
        <div className="mt-4 rounded-xl border p-5 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>帧率 ({gifFps} fps)</label>
            <input type="range" min={5} max={30} value={gifFps} onChange={(e) => setGifFps(Number(e.target.value))} className="w-full accent-[#0078d4]" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>尺寸</label>
            <select value={gifSize} onChange={(e) => setGifSize(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
              <option value="480:-1">小 (480p)</option><option value="640:-1">中 (640p)</option><option value="800:-1">大 (800p)</option>
            </select>
          </div>
        </div>
      )}

      <ProgressPanel running={running} progress={progress} onCancel={cancelConvert} />

      <button onClick={doConvert} disabled={inactive}
        className="mt-4 w-full py-3 rounded-xl text-sm font-medium transition-all duration-150"
        style={{ background: inactive ? "var(--bg-secondary)" : "var(--accent-dark)", color: inactive ? "var(--text-tertiary)" : "#fff", boxShadow: inactive ? "none" : "0 2px 8px rgba(0,120,212,0.3)", cursor: inactive ? "not-allowed" : "pointer", opacity: inactive ? 0.6 : 1 }}>
        {running ? "转换中..." : "开始转换"}
      </button>
    </div>
  );
}