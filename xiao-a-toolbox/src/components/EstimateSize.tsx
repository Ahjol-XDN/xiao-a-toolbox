import { useState, useEffect } from "react";

interface Props {
  filePath?: string;
  bitrate?: string;   // e.g. "2M", "192k"
  quality?: number;   // 1-100 for images
  format?: string;
  mode?: string;       // "video" | "audio" | "image"
}

function parseBitrate(br: string): number {
  const num = parseFloat(br);
  if (!num) return 0;
  if (br.toLowerCase().includes("m")) return num * 1000000;
  if (br.toLowerCase().includes("k")) return num * 1000;
  return num;
}

function formatSize(bytes: number): string {
  if (bytes <= 0) return "无法估算";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function EstimateSize({ filePath, bitrate, quality, format, mode }: Props) {
  const [estimate, setEstimate] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  const [origSize, setOrigSize] = useState<number>(0);

  useEffect(() => {
    if (!filePath) { setEstimate(""); return; }

    if (mode === "image" && quality) {
      // Image: rough estimate based on quality ratio
      setEstimate(`约 ${quality}% 质量的输出（实际取决于编码器）`);
      return;
    }

    if ((mode === "video" || mode === "audio") && bitrate && filePath) {
      window.electronAPI.getMediaInfo(filePath).then((data: any) => {
        const dur = parseFloat(data?.format?.duration || "0");
        const size = parseInt(data?.format?.size || "0");
        setDuration(dur);
        setOrigSize(size);
        if (dur > 0 && bitrate) {
          const bps = parseBitrate(bitrate);
          const estimatedBytes = (bps * dur) / 8;
          setEstimate(`约 ${formatSize(estimatedBytes)}（基于 ${bitrate} × ${Math.round(dur)}秒）`);
        }
      }).catch(() => setEstimate(""));
    }
  }, [filePath, bitrate, quality, mode]);

  if (!estimate) return null;

  return (
    <div className="mt-1 rounded-lg px-3 py-2" style={{ background: "var(--bg-secondary)" }}>
      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>预估输出大小：</span>
      <span className="text-xs font-medium ml-1" style={{ color: "var(--text-primary)" }}>{estimate}</span>
    </div>
  );
}
