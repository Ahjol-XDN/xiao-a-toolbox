# 小A万能转换工具箱 🔄

> 完全本地运行的桌面文件格式转换工具 — 拖拽即用，隐私无忧。
> 本项目基于 FFmpeg 和 Pandoc，使用 .NET 8 WPF 原生构建，轻量高效。

<p align="left">
  <img src="https://img.shields.io/badge/version-2.1.2-blue" alt="version" />
  <img src="https://img.shields.io/badge/.NET-8.0-purple" alt=".NET" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license" />
  <img src="https://img.shields.io/badge/platform-Windows%2010%2B-lightgrey" alt="platform" />
</p>

---

## ✨ 功能特性

### 🎬 视频处理
- 格式转换 — MP4 / MKV / AVI / MOV / WebM / FLV 互转
- 视频压缩 — 智能调整码率与分辨率
- 视频裁剪 — 按时间范围截取片段
- 转 GIF — 视频片段一键生成 GIF 动图
- 视频截图 — 按时间点或间隔批量截图

### 🎵 音频处理
- 格式转换 — MP3 / WAV / AAC / FLAC / OGG / M4A 互转
- 音频合并 — 多段音频拼接为完整文件
- 音频裁剪 — 按时间范围精确定位裁剪

### 📄 文档转换
- DOCX / PDF / Markdown / HTML / TXT / RTF / EPUB 互转
- 基于 Pandoc + 纯 .NET 原生转换器，排版保留完好

### 🖼️ 图片转换
- PNG / JPG / WebP / BMP / TIFF 格式互转
- 高质量图像处理，支持批量缩放

### 📑 PDF 工具
- PDF 合并 — 多个 PDF 合成为一个
- PDF 拆分 — 按页码范围抽取子文档

### 🚀 批量处理
- 多文件拖拽批量转换，一键完成

### 🌐 双语界面
- 中文 / English 自由切换，自动跟随系统语言

---

## 📦 安装

### 方式一：下载便携版（推荐）

1. 安装 [.NET 8 桌面运行时](https://dotnet.microsoft.com/download/dotnet/8.0)
2. 从 [Releases](https://github.com/Ahjol-XDN/xiao-a-toolbox/releases) 下载 `XiaoAToolbox-v*-portable.zip`
3. 解压后右键 `install.ps1` → **使用 PowerShell 运行**
4. 从桌面快捷方式启动

### 方式二：从源码构建

```powershell
# 克隆仓库
git clone https://github.com/Ahjol-XDN/xiao-a-toolbox.git
cd xiao-a-toolbox\XiaoAToolbox

# 构建与发布
.\build.ps1 -Publish

# 单文件输出位于 publish\XiaoAToolbox.exe
```

---

## 🚀 使用方式

1. 启动后选择功能标签页（视频 / 音频 / 文档 / 图片 / PDF / 批量）
2. 将文件拖拽到窗口，或点击选择文件
3. 设置输出格式及相关参数
4. 点击转换，输出文件将保存在源文件同目录

> 💡 所有处理均在本地完成，文件不会上传到任何服务器。

---

## 🛠️ 技术栈

| 组件 | 技术 | 用途 |
|------|------|------|
| 框架 | .NET 8 WPF | Windows 原生桌面 UI |
| 架构 | CommunityToolkit.Mvvm | MVVM 数据绑定 |
| 视频/音频 | FFmpeg | 音视频编解码核心 |
| 文档 | Pandoc + 原生转换器 | 文档格式互转 |
| PDF | PdfSharpCore | PDF 合并/拆分 |
| 图片 | SixLabors.ImageSharp | 跨平台图像处理 |
| 压缩 | SharpZipLib | 归档文件支持 |
| 主题 | 明/暗/自动三种模式 | 自适应系统主题 |

---

## 🧑‍💻 开发

```powershell
# 还原依赖
dotnet restore

# 构建并运行
dotnet build -c Release
dotnet run

# 发布单文件
.\build.ps1 -Publish
```

> 项目内置 FFmpeg 和 Pandoc 引擎资源，运行时自动解压至缓存目录，无需手动配置。

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

<p align="center">
  <sub>Made with ❤️ by XiaoA</sub>
</p>
