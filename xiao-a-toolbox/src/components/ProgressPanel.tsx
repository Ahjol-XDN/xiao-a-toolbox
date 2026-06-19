import { useEffect, useState } from "react";

interface ProgressInfo { percent: number; time: string; speed?: string; raw: string; }
interface Props { running: boolean; progress: ProgressInfo | null; onCancel: () => void; }

export default function ProgressPanel({ running, progress, onCancel }: Props) {
  const [logs, setLogs] = useState<string[]>([]);
  useEffect(() => { if (progress?.raw) setLogs((prev) => [...prev.slice(-49), progress.raw.trim()]); }, [progress?.raw]);
  if (!running && !progress) return null;
  const pct = progress?.percent ?? 0;
  return (
    <div className="mt-4 rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-md)" }}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {running ? "转换中..." : pct === 100 ? "完成" : "等待中"}
        </span>
        <span className="text-sm font-mono" style={{ color: pct === 100 ? "#107c10" : "var(--accent-dark)" }}>{pct}%</span>
        {progress?.time && <span className="text-xs ml-auto" style={{ color: "var(--text-tertiary)" }}>{progress.time}</span>}
        {progress?.speed && <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{progress.speed}</span>}
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
        <div className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: pct + "%", background: pct === 100 ? "#107c10" : "linear-gradient(90deg, #0078d4, #60cdff)" }} />
      </div>
      {running && (
        <button onClick={onCancel} className="mt-3 text-sm font-medium transition-colors hover:opacity-80" style={{ color: "#c42b1c" }}>取消转换</button>
      )}
      {logs.length > 0 && (
        <div className="mt-3 rounded-lg p-3 max-h-24 overflow-y-auto" style={{ background: "var(--bg-secondary)" }}>
          {logs.map((log, i) => (
            <pre key={i} className="text-xs font-mono whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{log}</pre>
          ))}
        </div>
      )}
    </div>
  );
}