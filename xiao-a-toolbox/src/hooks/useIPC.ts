import { useCallback, useRef } from "react";

interface ProgressInfo {
  percent: number;
  time: string;
  fps?: number;
  speed?: string;
  raw: string;
}

export function useIPC() {
  const cleanupRef = useRef<(() => void) | null>(null);

  const startProgress = useCallback((onProgress: (info: ProgressInfo) => void) => {
    cleanupRef.current = window.electronAPI.onProgress(onProgress);
  }, []);

  const stopProgress = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const convertVideo = (opts: any) => window.electronAPI.convertVideo(opts);
  const convertAudio = (opts: any) => window.electronAPI.convertAudio(opts);
  const convertVideoToGif = (opts: any) => window.electronAPI.convertVideoToGif(opts);
  const extractAudio = (opts: any) => window.electronAPI.extractAudio(opts);
  const compressVideo = (opts: any) => window.electronAPI.compressVideo(opts);
  const trimVideo = (opts: any) => window.electronAPI.trimVideo(opts);
  const audioMerge = (opts: any) => window.electronAPI.audioMerge(opts);
  const convertDocument = (opts: any) => window.electronAPI.convertDocument(opts);
  const convertImage = (opts: any) => window.electronAPI.convertImage(opts);
  const pdfMerge = (opts: any) => window.electronAPI.pdfMerge(opts);
  const pdfSplit = (opts: any) => window.electronAPI.pdfSplit(opts);
  const batchConvert = (tasks: any[]) => window.electronAPI.batchConvert(tasks);
  const getEngines = () => window.electronAPI.getEngines();
  const cancelConvert = () => window.electronAPI.cancelConvert();

  return {
    startProgress,
    stopProgress,
    convertVideo,
    convertAudio,
    convertVideoToGif,
    extractAudio,
    compressVideo,
    trimVideo,
    audioMerge,
    convertDocument,
    convertImage,
    pdfMerge,
    pdfSplit,
    batchConvert,
    getEngines,
    cancelConvert,
  };
}
