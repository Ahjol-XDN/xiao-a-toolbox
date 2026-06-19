import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

const navItems = [
  { to: "/video", label: "视频转换", icon: "🎬" },
  { to: "/audio", label: "音频转换", icon: "🎵" },
  { to: "/document", label: "文档转换", icon: "📄" },
  { to: "/image", label: "图片转换", icon: "🖼️" },
  { to: "/pdf", label: "PDF 工具", icon: "📑" },
  { to: "/batch", label: "批量转换", icon: "📦" },
  { to: "/settings", label: "设置", icon: "⚙️" },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen" style={{ background: "var(--bg-primary)" }}>
      <aside
        className="w-60 flex-shrink-0 flex flex-col border-r select-none"
        style={{ background: "var(--sidebar-bg)", borderColor: "var(--border-subtle)" }}
      >
        <div className="px-5 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
              style={{ background: "linear-gradient(135deg, #0078d4, #60cdff)" }}>A</div>
            <div>
              <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>小A工具箱</h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>万能转换 2.0</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${isActive ? "font-medium" : ""}`}
              style={({ isActive }) => ({
                background: isActive ? "var(--sidebar-active)" : "transparent",
                color: isActive ? "var(--sidebar-accent)" : "var(--text-secondary)",
              })}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>v2.0.0 · Windows</p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-4xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}