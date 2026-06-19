import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [engines, setEngines] = useState<any>({ ffmpeg: false, pandoc: false, paths: {} });
  useEffect(() => { window.electronAPI.getEngines().then(setEngines); }, []);
  const enginesList = [
    { key: "ffmpeg", name: "FFmpeg", desc: "音视频 / 图片转换引擎" },
    { key: "pandoc", name: "Pandoc", desc: "文档格式互转引擎" },
  ];
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>设置</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-tertiary)" }}>引擎状态和关于信息</p>
      <div className="space-y-4">
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>转换引擎</h3>
          <div className="space-y-2">
            {enginesList.map((e) => (
              <div key={e.key} className="flex items-center gap-3 py-2.5 px-4 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: engines[e.key] ? "#107c10" : "#c42b1c" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{e.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{e.desc}</p>
                </div>
                <span className="ml-auto text-xs" style={{ color: engines[e.key] ? "#107c10" : "var(--text-tertiary)" }}>
                  {engines[e.key] ? "已就绪" : "未检测到"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
            {Object.entries(engines.paths || {}).map(([k, v]) => (
              <p key={k} className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{k}: {v as string}</p>
            ))}
          </div>
        </div>
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>关于</h3>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>小A万能转换工具箱 2.0</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>基于 Electron · FFmpeg · Pandoc 构建</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>所有转换均在本地完成，保护文件隐私</p>
        </div>
      </div>
    </div>
  );
}