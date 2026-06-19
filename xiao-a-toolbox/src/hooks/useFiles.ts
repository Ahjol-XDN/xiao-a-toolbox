import { useState, useCallback } from "react";

export interface FileItem {
  id: string;
  path: string;
  name: string;
  size: number;
  ext: string;
}

let idCounter = 0;

export function useFiles() {
  const [files, setFiles] = useState<FileItem[]>([]);

  const addFiles = useCallback((paths: string[]) => {
    const newFiles: FileItem[] = paths.map((p) => {
      const parts = p.split("\\");
      const name = parts[parts.length - 1];
      const ext = name.split(".").pop()?.toLowerCase() ?? "";
      idCounter++;
      return { id: String(idCounter), path: p, name, size: 0, ext };
    });
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => setFiles([]), []);

  const reorderFiles = useCallback((from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  return { files, addFiles, removeFile, clearFiles, reorderFiles };
}
