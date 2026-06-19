import { useState, useCallback, useEffect } from "react";
import DropZone from "../components/DropZone";
import FileList from "../components/FileList";
import FormatSelector from "../components/FormatSelector";
import MediaInfo from "../components/MediaInfo";
import EstimateSize from "../components/EstimateSize";
import ProgressPanel from "../components/ProgressPanel";
import { useFiles } from "../hooks/useFiles";
import { useKeyboard } from "../hooks/useKeyboard";
import { useIPC } from "../hooks/useIPC";

type VideoMode = "convert" | "compress" | "trim" | "extract-audio" | "gif" | "screenshot";

interface VideoPageProps {
  forceMode?: VideoMode;
}

const VIDEO_FORMATS = [
  { value: "mp4", label: "MP4" }, { value: "mkv", label: "MKV" },
  { value: "avi", label: "AVI" }, { value: "mov", label: "MOV" },
  { value: "webm", label: "WebM" }, { value: "flv", label: "FLV" },
];
const AUDIO_FORMATS = [
  { value: "mp3", label: "MP3" }, { value: "aac", label: "AAC" },
  { value: "wav", label: "WAV" }, { value: "flac", label: "FLAC" },
  { value: "ogg", label: "OGG" }, { value: "wma", label: "WMA" },
];
const IMG_FORMATS = [
  { value: "png", label: "PNG" }, { value: "jpg", label: "JPG" },
];
const CODECS = [
  { value: "libx264", label: "H.264" }, { value: "libx265", label: "H.265" },
  { value: "libvpx-vp9", label: "VP9" }, { value: "copy", label: "复制" },
];
const RESOLUTIONS = [
  { value: "", label: "原始" }, { value: "1920:1080", label: "1080p" },
  { value: "1280:720", label: "720p" }, { value: "854:480", label: "480p" },
];

export default function VideoPage({ forceMode }: VideoPageProps = {}) {
  const { files, addFiles, removeFile, clearFiles, reorderFiles } = useFiles();
  const { convertVideo, compressVideo, trimVideo, extractAudio, extractFrame, convertVideoToGif,
    startProgress, stopProgress, cancelConvert, notify, getConfig, addHistory } = useIPC();
  const [mode, setMode] = useState<VideoMode>(forceMode || "convert");
  const [format, setFormat] = useState(forceMode === "extract-audio" ? "mp3" : "mp4");
  const [codec, setCodec] = useState("libx264");
  const [resolution, setResolution] = useState("");
  const [crf, setCrf] = useState(23);
  const [bitrate, setBitrate] = useState("");
  const [startTime, setStartTime] = useState("00:00:00");
  const [endTime, setEndTime] = useState("00:00:10");
  const [gifFps, setGifFps] = useState(10);
  const [gifSize, setGifSize] = useState("480:-1");
  const [ssTime, setSsTime] = useState("00:00:01");
  const [audioBitrate, setAudioBitrate] = useState("192k");
  const [sampleRate, setSampleRate] = useState("44100");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [outputDir, setOutputDir] = useState("");
  const [results, setResults] = useState<{ ok: number; fail: number }>({ ok: 0, fail: 0 });

  useEffect(() => {
    getConfig().then((cfg: any) => { if (cfg?.outputDir) setOutputDir(cfg.outputDir); });
  }, []);

  const getExt = () => {
    if (mode === "extract-audio") return format;
    if (mode === "gif") return "gif";
    if (mode === "screenshot") return format;
    return format;
  };

  const resolveOutput = async (inputFile: any, ext: string): Promise<string | null> => {
    if (outputDir) {
      return `${outputDir}\\${inputFile.name.replace(/\.[^.]+$/, "." + ext)}`;
    }
    return window.electronAPI.saveFile({
      filters: [{ name: "输出", extensions: [ext] }],
      defaultPath: inputFile.name.replace(/\.[^.]+$/, "." + ext),
    });
  };

  const handleDrop = useCallback((paths: string[]) => addFiles(paths), [addFiles]);

  const handleClickSelect = async () => {
    if (forceMode === "extract-audio") {
      const paths = await window.electronAPI.openFile([
        { name: "视频", extensions: ["mp4", "mkv", "avi", "mov", "webm", "flv", "wmv"] },
      ]);
      if (paths?.length) addFiles(paths);
    } else {
      const paths = await window.electronAPI.openFile([
        { name: "视频", extensions: ["mp4", "mkv", "avi", "mov", "webm", "flv", "wmv"] },
      ]);
      if (paths?.length) addFiles(paths);
    }
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
        const ext = getExt();
        const savePath = await resolveOutput(input, ext);
        if (!savePath) { fail++; continue; }

        const params: any = {};
        if (mode === "convert" || mode === "compress") {
          if (codec && codec !== "copy") params.codec = codec;
          if (resolution) params.resolution = resolution;
          if (bitrate) params.bitrate = bitrate;
          if (crf) params.crf = crf;
        }
        if (mode === "trim") { params.start = startTime; params.end = endTime; }
        if (mode === "gif") { params.fps = gifFps; params.resolution = gifSize; }
        if (mode === "extract-audio") { params.bitrate = audioBitrate; params.sampleRate = sampleRate; }
        if (mode === "screenshot") { params.time = ssTime; if (resolution) params.resolution = resolution; }

        if (mode === "convert") await convertVideo({ inputPath: input.path, outputPath: savePath, format: ext, params });
        else if (mode === "compress") await compressVideo({ inputPath: input.path, outputPath: savePath, format: ext, params });
        else if (mode === "trim") await trimVideo({ inputPath: input.path, outputPath: savePath, format: ext, params });
        else if (mode === "extract-audio") await extractAudio({ inputPath: input.path, outputPath: savePath, format: ext, params });
        else if (mode === "gif") await convertVideoToGif({ inputPath: input.path, outputPath: savePath, format: "gif", params });
        else if (mode === "screenshot") await extractFrame({ inputPath: input.path, outputPath: savePath, format: ext, params });

        ok++;
        addHistory({ input: input.path, output: savePath, format: ext, mode, status: "success" });
      } catch (err: any) {
        fail++;
        addHistory({ input: files[i].path, output: "", format: getExt(), mode, status: "failed" });
      }
      setProgress({ percent: Math.round(((i + 1) / total) * 100), time: `${i + 1}/${total}`, speed: "", raw: "" });
    }

    setResults({ ok, fail });
    setProgress((p: any) => ({ ...p, percent: 100 }));
    notify("转换完成", `成功 ${ok} 个, 失败 ${fail} 个`);
    setRunning(false);
    stopProgress();
  };

  useKeyboard({ selectFile: handleClickSelect, startConvert: doConvert, cancelConvert });

  const modeLabels: Record<VideoMode, string> = {
    convert: "格式互转", compress: "视频压缩", trim: "视频裁剪",
    "extract-audio": "提取音频", gif: "GIF转换", screenshot: "截图提取",
  };
  const inactive = running || files.length === 0;
  const inputStyle = { background: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" };

  const title = forceMode === "extract-audio" ? "视频转音频" : "视频转换";
  const subtitle = forceMode === "extract-audio"
    ? "从视频文件中提取音频，支持多文件批量处理"
    : "转换、压缩、裁剪您的视频文件 · 支持多文件";

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{title}</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-tertiary)" }}>{subtitle}</p>

      {!forceMode && (
        <div className="flex gap-1 mb-5 p-1 rounded-xl flex-wrap" style={{ background: "var(--bg-secondary)" }}>
          {(Object.keys(modeLabels) as VideoMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setFormat(m === "extract-audio" ? "mp3" : m === "screenshot" ? "png" : "mp4"); }}
              className="px-3 py-1.5 text-xs rounded-lg transition-all duration-150"
              style={{
                background: mode === m ? "var(--bg-card)" : "transparent",
                color: mode === m ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: mode === m ? "var(--shadow-sm)" : "none",
                fontWeight: mode === m ? 500 : 400,
              }}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      )}

      <DropZone onFilesDrop={handleDrop}>
        <div onClick={handleClickSelect}
          className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-[var(--accent-dark)]"
          style={{ border: "2px dashed var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-3xl mb-2">{forceMode === "extract-audio" ? "🎵" : "🎬"}</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {forceMode === "extract-audio" ? "拖拽视频文件，提取其中的音频" : "拖拽视频文件到此处，或点击选择"}
          </p>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>
            {forceMode === "extract-audio" ? "支持 MP4 / MKV / AVI / MOV / WebM / FLV → MP3 / AAC / WAV / FLAC / OGG" : "支持 MP4 / MKV / AVI / MOV / WebM / FLV"}
          </p>
        </div>
      </DropZone>

      <FileList files={files} onRemove={removeFile} onReorder={reorderFiles} />
      {files.length > 0 && <MediaInfo filePath={files[0].path} fileName={files[0].name} />}

      {/* Convert & Compress params */}
      {(mode === "convert" || mode === "compress") && !forceMode && (
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
            <input type="text" value={bitrate} onChange={(e) => setBitrate(e.target.value)} placeholder="如 2M" className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ ...inputStyle, width: 160 }} />
          </div>
          {files.length > 0 && bitrate && <EstimateSize filePath={files[0].path} bitrate={bitrate} mode="video" />}
        </div>
      )}

      {/* Trim params */}
      {mode === "trim" && !forceMode && (
        <div className="mt-4 rounded-xl border p-5 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <div className="flex gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>起始时间</label>
              <input type="text" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ ...inputStyle, width: 140 }} placeholder="00:00:00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>结束时间</label>
              <input type="text" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ ...inputStyle, width: 140 }} placeholder="00:00:10" />
            </div>
          </div>
        </div>
      )}

      {/* Extract Audio params — always show when in extract-audio mode */}
      {mode === "extract-audio" && (
        <div className="mt-4 rounded-xl border p-5 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <FormatSelector formats={AUDIO_FORMATS} value={format} onChange={setFormat} label="输出音频格式" />
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>码率</label>
            <select value={audioBitrate} onChange={(e) => setAudioBitrate(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
              <option value="128k">128 kbps</option><option value="192k">192 kbps</option><option value="256k">256 kbps</option><option value="320k">320 kbps</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>采样率</label>
            <select value={sampleRate} onChange={(e) => setSampleRate(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
              <option value="22050">22050 Hz</option><option value="44100">44100 Hz</option><option value="48000">48000 Hz</option>
            </select>
          </div>
          {files.length > 0 && audioBitrate && <EstimateSize filePath={files[0].path} bitrate={audioBitrate} mode="audio" />}
        </div>
      )}

      {/* GIF params */}
      {mode === "gif" && !forceMode && (
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

      {/* Screenshot params */}
      {mode === "screenshot" && !forceMode && (
        <div className="mt-4 rounded-xl border p-5 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <FormatSelector formats={IMG_FORMATS} value={format} onChange={setFormat} label="输出图片格式" />
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>截图时间点</label>
            <input type="text" value={ssTime} onChange={(e) => setSsTime(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ ...inputStyle, width: 160 }} placeholder="00:00:01" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>尺寸（可选）</label>
            <input type="text" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="留空为原始尺寸" className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ ...inputStyle, width: 240 }} />
          </div>
        </div>
      )}

      <ProgressPanel running={running} progress={progress} onCancel={cancelConvert} />

      {!running && (results.ok > 0 || results.fail > 0) && (
        <div className="mt-3 flex gap-3 text-xs">
          {results.ok > 0 && <span style={{ color: "#107c10" }}>成功 {results.ok} 个</span>}
          {results.fail > 0 && <span style={{ color: "#c42b1c" }}>失败 {results.fail} 个</span>}
        </div>
      )}

      {outputDir && (
        <p className="mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>输出目录：{outputDir}</p>
      )}

      <button onClick={doConvert} disabled={inactive}
        className="mt-4 w-full py-3 rounded-xl text-sm font-medium transition-all duration-150"
        style={{
          background: inactive ? "var(--bg-secondary)" : "var(--accent-dark)",
          color: inactive ? "var(--text-tertiary)" : "#fff",
          boxShadow: inactive ? "none" : "0 2px 8px rgba(0,120,212,0.3)",
          cursor: inactive ? "not-allowed" : "pointer",
          opacity: inactive ? 0.6 : 1,
        }}>
        {running ? "转换中..." : forceMode === "extract-audio" ? `开始提取音频 (${files.length} 个文件)` : `开始转换 (${files.length} 个文件)`}
      </button>
    </div>
  );
}
