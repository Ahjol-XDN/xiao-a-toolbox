import { useState, type DragEvent } from "react";
import type { FileItem } from "../hooks/useFiles";

interface Props {
  files: FileItem[];
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}

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
    docx: "📄", doc: "📄", pdf: "📑", md: "📝", txt: "📋",
    png: "🖼️", jpg: "🖼️", jpeg: "🖼️", webp: "🖼️", bmp: "🖼️", gif: "🖼️",
  };
  return map[ext] ?? "📁";
}

export default function FileList({ files, onRemove, onReorder }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (files.length === 0) return null;

  const handleDragStart = (e: DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  };

  const handleDragLeave = () => {
    setOverIndex(null);
  };

  const handleDrop = (e: DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== toIndex) {
      onReorder(dragIndex, toIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="space-y-1 mt-3">
      {files.map((file, index) => (
        <div
          key={file.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm transition-all duration-150 cursor-grab active:cursor-grabbing"
          style={{
            background: "var(--bg-card)",
            borderColor: overIndex === index ? "var(--accent-dark)" : "var(--border-subtle)",
            boxShadow: overIndex === index ? "0 0 0 2px var(--accent-dark)" : "var(--shadow-sm)",
            opacity: dragIndex === index ? 0.5 : 1,
          }}
        >
          <span className="text-xs cursor-grab" style={{ color: "var(--text-tertiary)" }}>⠿</span>
          <span className="text-lg">{fileIcon(file.ext)}</span>
          <span className="flex-1 truncate" style={{ color: "var(--text-primary)" }}>{file.name}</span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{sizeFormat(file.size)}</span>
          <button
            onClick={() => onRemove(file.id)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-sm transition-colors hover:bg-red-50 hover:text-red-500"
            style={{ color: "var(--text-tertiary)" }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
