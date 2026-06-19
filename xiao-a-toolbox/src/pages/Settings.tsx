import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [engines, setEngines] = useState<any>({ ffmpeg: false, pandoc: false, paths: {} });
  const [outputDir, setOutputDir] = useState("");
  const [theme, setTheme] = useState("auto");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    window.electronAPI.getEngines().then(setEngines);
    window.electronAPI.getConfig().then((cfg: any) => {
      if (cfg?.outputDir) setOutputDir(cfg.outputDir);
      if (cfg?.theme) setTheme(cfg.theme);
    });
    window.electronAPI.getHistory().then(setHistory);
  }, []);

  const selectOutputDir = async () => {
    const dir = await window.electronAPI.openDirectory();
    if (dir) {
      setOutputDir(dir);
      window.electronAPI.setConfig("outputDir", dir);
    }
  };

  const handleThemeChange = (val: string) => {
    setTheme(val);
    document.documentElement.setAttribute("data-theme", val);
    window.electronAPI.setConfig("theme", val);
  };

  const handleClearHistory = async () => {
    await window.electronAPI.clearHistory();
    setHistory([]);
  };

  const enginesList = [
    { key: "ffmpeg", name: "FFmpeg", desc: "音视频 / 图片转换引擎" },
    { key: "pandoc", name: "Pandoc", desc: "文档格式互转引擎" },
  ];

  const is = {
    background: "var(--bg-secondary)",
    borderColor: "var(--border-subtle)",
    color: "var(--text-primary)",
  };

  function formatTime(ts: number) {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>设置</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-tertiary)" }}>引擎状态、保存目录与偏好设置</p>

      <div className="space-y-4">
        {/* 引擎状态 */}
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
        </div>

        {/* 默认保存目录 */}
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>默认保存目录</h3>
          <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>设置后将跳过保存对话框，文件自动保存到此目录</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={outputDir}
              className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
              style={is}
              placeholder="未设置（每次弹出保存对话框）"
            />
            <button
              onClick={selectOutputDir}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
            >
              选择目录
            </button>
          </div>
          {outputDir && (
            <button
              onClick={() => { setOutputDir(""); window.electronAPI.setConfig("outputDir", ""); }}
              className="mt-2 text-xs transition-colors hover:opacity-80"
              style={{ color: "#c42b1c" }}
            >
              清除默认目录
            </button>
          )}
        </div>

        {/* 主题切换 */}
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>主题</h3>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
            {[
              { value: "light", label: "亮色" },
              { value: "dark", label: "暗色" },
              { value: "auto", label: "跟随系统" },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => handleThemeChange(t.value)}
                className="px-4 py-1.5 text-sm rounded-lg transition-all duration-150 flex-1"
                style={{
                  background: theme === t.value ? "var(--bg-card)" : "transparent",
                  color: theme === t.value ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: theme === t.value ? "var(--shadow-sm)" : "none",
                  fontWeight: theme === t.value ? 500 : 400,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 转换历史 */}
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>转换历史</h3>
            {history.length > 0 && (
              <button onClick={handleClearHistory} className="text-xs transition-colors hover:opacity-80" style={{ color: "#c42b1c" }}>
                清空历史
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>暂无转换记录</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {history.map((entry: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg text-xs"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: entry.status === "success" ? "#107c10" : "#c42b1c" }}
                  />
                  <span className="truncate flex-1" style={{ color: "var(--text-primary)" }}>
                    {entry.input?.split("\\").pop()}
                  </span>
                  <span style={{ color: "var(--text-tertiary)" }}>→ {entry.format}</span>
                  <span style={{ color: "var(--text-tertiary)" }}>{formatTime(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 关于 */}
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
