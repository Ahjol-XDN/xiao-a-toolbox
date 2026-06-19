import { useCallback, useRef, useState, type DragEvent, type ReactNode } from "react";

interface Props { onFilesDrop: (paths: string[]) => void; children: ReactNode; className?: string; }

export default function DropZone({ onFilesDrop, children, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const hDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }, []);
  const hDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }, []);
  const hDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesDrop(files.map((f) => (f as any).path ?? f.name));
  }, [onFilesDrop]);
  return (
    <div ref={ref} onDragOver={hDragOver} onDragLeave={hDragLeave} onDrop={hDrop} className={"relative " + className}>
      {dragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl backdrop-blur-sm"
          style={{ background: "rgba(0, 120, 212, 0.06)", border: "2px dashed var(--accent-dark)" }}>
          <div className="text-center"><p className="text-4xl mb-2">📥</p><p className="text-base font-medium" style={{ color: "var(--accent-dark)" }}>释放文件以添加</p></div>
        </div>
      )}
      {children}
    </div>
  );
}