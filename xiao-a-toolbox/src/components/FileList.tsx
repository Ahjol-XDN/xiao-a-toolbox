import type { FileItem } from "../hooks/useFiles";

interface Props { files: FileItem[]; onRemove: (id: string) => void; }

const sizeFormat = (bytes: number) => {
  if (bytes === 0) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
};

function fileIcon(ext: string): string {
  const map: Record<string, string> = {
    mp4: "🎬", mkv: "🎬", avi: "🎬", mov: "🎬", webm: "🎬", flv: "🎬",
    mp3: "🎵", wav: "🎵", aac: "🎵", flac: "🎵", ogg: "🎵", wma: "🎵",
    docx: "📄", doc: "📄", pdf: "📑", md: "📝", txt: "📃",
    png: "🖼️", jpg: "🖼️", jpeg: "🖼️", webp: "🖼️", bmp: "🖼️", gif: "🖼️",
  };
  return map[ext] ?? "📁";
}

export default function FileList({ files, onRemove }: Props) {
  if (files.length === 0) return null;
  return (
    <div className="space-y-1 mt-3">
      {files.map((file) => (
        <div key={file.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm transition-colors hover:border-[var(--accent-dark)]"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <span className="text-lg">{fileIcon(file.ext)}</span>
          <span className="flex-1 truncate" style={{ color: "var(--text-primary)" }}>{file.name}</span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{sizeFormat(file.size)}</span>
          <button onClick={() => onRemove(file.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-sm transition-colors hover:bg-red-50 hover:text-red-500"
            style={{ color: "var(--text-tertiary)" }}>×</button>
        </div>
      ))}
    </div>
  );
}