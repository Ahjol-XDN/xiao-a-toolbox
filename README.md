# 小A万能转换工具箱 2.0

> 基于 Electron + FFmpeg + Pandoc 的本地全能文件格式转换桌面应用

## ✨ 功能

| 模块 | 能力 | 支持格式 |
|------|------|---------|
| 🎬 **视频转换** | 格式互转、压缩、裁剪、提取音频、GIF、截图 | MP4 / MKV / AVI / MOV / WebM / FLV |
| 🎵 **视频转音频** | 视频文件批量提取音频 | → MP3 / AAC / WAV / FLAC / OGG / WMA |
| 🎧 **音频转换** | 格式互转、多音频合并、裁剪 | MP3 / WAV / AAC / FLAC / OGG / WMA |
| 📄 **文档转换** | Pandoc 驱动格式互转 | DOCX / PDF / MD / TXT / HTML / RTF / EPUB |
| 🖼️ **图片转换** | 格式互转、质量/尺寸调整 | PNG / JPG / WebP / BMP / TIFF / ICO |
| 📑 **PDF 工具** | 合并、拆分 | PDF |
| 📦 **批量转换** | 统一格式批量处理混合文件 | 以上全部格式 |

### 特色

- **多文件拖拽** — 所有页面支持多文件批量处理
- **全局默认目录** — 设置一次，所有转换自动保存
- **拖拽排序** — 文件列表可直接拖拽调整顺序
- **深色/浅色主题** — 亮色、暗色、跟随系统三模式
- **快捷键** — `Ctrl+O` 选择文件 / `Ctrl+Enter` 开始转换 / `Esc` 取消
- **文件信息预览** — 点击「查看详情」显示视频/音频元数据
- **转换历史** — 自动记录每次转换，可在设置页查看
- **系统通知** — 转换完成桌面弹窗提醒
- **文件大小预估** — 转换前估算输出大小
- **完全本地** — 所有处理离线完成，保护隐私

## 🚀 快速开始

### 环境要求

- Windows 10/11 x64
- [Node.js](https://nodejs.org) ≥ 18
- 7-Zip（打包需要，[下载](https://7-zip.org)）

### 开发运行

```powershell
cd xiao-a-toolbox
npm install
npm run dev
```

### 打包发布

```powershell
# 完整版（~300MB，含所有引擎）
.\build-portable.ps1

# 精简版（~80MB，仅音视频 + 图片）
.\build-portable.ps1 -Slim

# 清理缓存后打包
.\build-portable.ps1 -Clean
```

输出在 `dist/` 目录下，解压即用。

### 一键 Git 推送

```powershell
.\init-git.ps1 "feat: 新增xxx功能"
```

## 🏗️ 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 35 |
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS |
| 路由 | React Router v7 |
| UI 组件 | Radix UI |
| 音视频引擎 | FFmpeg (ffmpeg + ffprobe) |
| 文档引擎 | Pandoc |
| PDF 处理 | pdf-lib |
| 打包 | electron-builder (portable) |
| CI/CD | GitHub Actions |

## 📁 项目结构

```
xiao-a-toolbox/
├── electron/           # Electron 主进程
│   ├── main.ts         # 入口 + IPC 注册
│   ├── preload.ts      # 安全的 API 桥接
│   ├── engines.ts      # 引擎检测
│   ├── utils.ts        # 工具函数
│   └── ipc/            # IPC 处理器
│       ├── ffmpeg.ts   # 音视频/图片转换
│       ├── pandoc.ts   # 文档转换
│       ├── pdf.ts      # PDF 操作
│       └── batch.ts    # 批量转换
├── src/                # 渲染进程
│   ├── pages/          # 页面组件
│   │   ├── Video.tsx       # 视频转换
│   │   ├── VideoToAudio.tsx # 视频转音频
│   │   ├── Audio.tsx       # 音频转换
│   │   ├── Document.tsx    # 文档转换
│   │   ├── Image.tsx       # 图片转换
│   │   ├── PDF.tsx         # PDF 工具
│   │   ├── Batch.tsx       # 批量转换
│   │   └── Settings.tsx    # 设置
│   ├── components/     # 通用组件
│   │   ├── DropZone.tsx      # 拖拽区域
│   │   ├── FileList.tsx      # 文件列表（可拖拽排序）
│   │   ├── FormatSelector.tsx # 格式选择器
│   │   ├── ProgressPanel.tsx  # 进度面板
│   │   ├── MediaInfo.tsx      # 文件信息预览
│   │   ├── EstimateSize.tsx   # 大小预估
│   │   ├── Layout.tsx         # 侧边栏布局
│   │   └── PresetManager.tsx  # 预设管理
│   ├── hooks/          # React Hooks
│   │   ├── useFiles.ts       # 文件管理
│   │   ├── useIPC.ts         # IPC 调用
│   │   └── useKeyboard.tsx   # 快捷键
│   └── styles/         # 样式
├── engines/            # 引擎二进制（须自行下载）
│   ├── ffmpeg/
│   └── pandoc/
├── resources/          # 打包资源
│   └── icons/
├── build-portable.ps1  # 打包脚本
└── electron-builder.yml # 打包配置
```

## 📝 提交规范

| 前缀 | 用途 |
|---|---|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `build` | 打包/构建脚本 |
| `docs` | 文档更新 |
| `perf` | 性能优化 |
| `chore` | 杂项维护 |

## 📄 License

MIT
