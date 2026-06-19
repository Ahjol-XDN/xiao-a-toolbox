declare global {
  interface Window {
    electronAPI: {
      openFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string[]>;
      openDirectory: () => Promise<string | null>;
      saveFile: (options?: { filters?: { name: string; extensions: string[] }[]; defaultPath?: string }) => Promise<string | null>;
      getConfig: (key?: string) => Promise<any>;
      setConfig: (key: string, value: any) => Promise<any>;
      getHistory: () => Promise<any[]>;
      addHistory: (entry: any) => Promise<any[]>;
      clearHistory: () => Promise<[]>;
      notify: (title: string, body: string) => Promise<void>;
      getMediaInfo: (path: string) => Promise<any>;
      convertVideo: (opts: any) => Promise<string>;
      convertAudio: (opts: any) => Promise<string>;
      convertVideoToGif: (opts: any) => Promise<string>;
      extractAudio: (opts: any) => Promise<string>;
      extractFrame: (opts: any) => Promise<string>;
      compressVideo: (opts: any) => Promise<string>;
      trimVideo: (opts: any) => Promise<string>;
      trimAudio: (opts: any) => Promise<string>;
      audioMerge: (opts: any) => Promise<string>;
      convertDocument: (opts: any) => Promise<string>;
      convertImage: (opts: any) => Promise<string>;
      pdfMerge: (opts: any) => Promise<string>;
      pdfSplit: (opts: any) => Promise<string>;
      batchConvert: (tasks: any[]) => Promise<string[]>;
      getEngines: () => Promise<any>;
      onProgress: (cb: (info: any) => void) => () => void;
      cancelConvert: () => void;
    };
  }
}

export {};
