import { useState, useEffect } from "react";

interface MediaInfoData {
  duration: string;
  videoCodec?: string;
  audioCodec?: string;
  resolution?: string;
  fps?: string;
  bitrate?: string;
  sampleRate?: string;
  channels?: number;
  fileSize: string;
  format: string;
}

interface StreamInfo {
  codec_type: string;
  codec_name: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  sample_rate?: string;
  channels?: number;
  bit_rate?: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatBitrate(bps: number): string {
  if (bps >= 1000000) return `${(bps / 1000000).toFixed(1)} Mbps`;
  if (bps >= 1000) return `${(bps / 1000).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function parseFfprobeData(data: any): MediaInfoData | null {
  if (!data || data.error) return null;
  const format = data.format || {};
  const streams: StreamInfo[] = data.streams || [];

  const videoStream = streams.find((s: StreamInfo) => s.codec_type === "video");
  const audioStream = streams.find((s: StreamInfo) => s.codec_type === "audio");

  const result: MediaInfoData = {
    duration: format.duration ? formatDuration(parseFloat(format.duration)) : "—",
    fileSize: format.size ? formatSize(parseInt(format.size)) : "—",
    format: format.format_name || "—",
  };

  if (videoStream) {
    result.videoCodec = videoStream.codec_name;
    result.resolution = videoStream.width && videoStream.height ? `${videoStream.width}x${videoStream.height}` : undefined;
    if (videoStream.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
      result.fps = den ? `${(num / den).toFixed(1)} fps` : videoStream.r_frame_rate;
    }
    if (videoStream.bit_rate) {
      result.bitrate = formatBitrate(parseInt(videoStream.bit_rate));
    }
  }

  if (audioStream) {
    result.audioCodec = audioStream.codec_name;
    if (audioStream.sample_rate) result.sampleRate = `${parseInt(audioStream.sample_rate) / 1000} kHz`;
    if (audioStream.channels !== undefined) result.channels = audioStream.channels;
    if (!result.bitrate && audioStream.bit_rate) {
      result.bitrate = formatBitrate(parseInt(audioStream.bit_rate));
    }
  }

  return result;
}

interface Props {
  filePath: string;
  fileName: string;
}

export default function MediaInfo({ filePath, fileName }: Props) {
  const [info, setInfo] = useState<MediaInfoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setInfo(null);
    setExpanded(false);
  }, [filePath]);

  const handleToggle = async () => {
    if (expanded) { setExpanded(false); return; }
    if (!info && !loading) {
      setLoading(true);
      try {
        const data = await window.electronAPI.getMediaInfo(filePath);
        setInfo(parseFfprobeData(data));
      } catch { setInfo(null); }
      setLoading(false);
    }
    setExpanded(true);
  };

  const labelStyle = { color: "var(--text-tertiary)", fontSize: "11px" };
  const valueStyle = { color: "var(--text-primary)", fontSize: "12px", fontWeight: 500 as const };

  return (
    <div className="mt-1">
      <button
        onClick={handleToggle}
        className="text-xs transition-colors hover:opacity-80"
        style={{ color: "var(--accent-dark)" }}
      >
        {expanded ? "收起信息 ▲" : "查看详情 ▼"} — {fileName}
      </button>
      {expanded && (
        <div
          className="mt-2 rounded-lg border p-4 grid grid-cols-2 gap-x-6 gap-y-2"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          {loading && <p className="text-xs col-span-2" style={{ color: "var(--text-tertiary)" }}>加载中...</p>}
          {info && (
            <>
              {info.duration !== "—" && (
                <div>
                  <p style={labelStyle}>时长</p>
                  <p style={valueStyle}>{info.duration}</p>
                </div>
              )}
              {info.resolution && (
                <div>
                  <p style={labelStyle}>分辨率</p>
                  <p style={valueStyle}>{info.resolution}</p>
                </div>
              )}
              {info.videoCodec && (
                <div>
                  <p style={labelStyle}>视频编码</p>
                  <p style={valueStyle}>{info.videoCodec}</p>
                </div>
              )}
              {info.fps && (
                <div>
                  <p style={labelStyle}>帧率</p>
                  <p style={valueStyle}>{info.fps}</p>
                </div>
              )}
              {info.audioCodec && (
                <div>
                  <p style={labelStyle}>音频编码</p>
                  <p style={valueStyle}>{info.audioCodec}</p>
                </div>
              )}
              {info.sampleRate && (
                <div>
                  <p style={labelStyle}>采样率</p>
                  <p style={valueStyle}>{info.sampleRate}</p>
                </div>
              )}
              {info.channels !== undefined && (
                <div>
                  <p style={labelStyle}>声道</p>
                  <p style={valueStyle}>{info.channels === 2 ? "立体声" : info.channels === 1 ? "单声道" : `${info.channels} 声道`}</p>
                </div>
              )}
              {info.bitrate && (
                <div>
                  <p style={labelStyle}>码率</p>
                  <p style={valueStyle}>{info.bitrate}</p>
                </div>
              )}
              <div>
                <p style={labelStyle}>文件大小</p>
                <p style={valueStyle}>{info.fileSize}</p>
              </div>
              <div>
                <p style={labelStyle}>容器格式</p>
                <p style={valueStyle}>{info.format}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
