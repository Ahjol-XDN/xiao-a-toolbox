# 小A万能转换工具箱 2.1.1

> 一款完全本地运行的桌面文件格式转换工具 — 拖拽即用，隐私无忧。
> 基于 .NET 8 WPF 原生构建，轻量高效。

---

## 功能特性

- **视频处理**：格式转换 / 压缩 / 裁剪 / 转GIF / 截图
- **音频处理**：格式转换 / 合并 / 裁剪
- **文档转换**：DOCX、PDF、MD、HTML、TXT、RTF、EPUB 互转
- **图片转换**：PNG、JPG、WebP、BMP、TIFF 互转
- **PDF工具**：合并 / 拆分
- **批量转换**：多文件批量处理
- **双语界面**：中文 / English 切换

---

## 安装方法

### 方式一：下载 Release
1. 安装 [.NET 8 运行时](https://dotnet.microsoft.com/download/dotnet/8.0)
2. 从 [Releases](https://github.com/Ahjol-XDN/xiao-a-toolbox/releases) 下载 `XiaoAToolbox-v*-portable.zip`
3. 解压后右键 `install.ps1` → 使用 PowerShell 运行
4. 从桌面快捷方式启动

### 方式二：从源码构建
```powershell
cd XiaoAToolbox
dotnet restore
dotnet build -c Release
dotnet publish -c Release -o publish --self-contained false -p:RuntimeIdentifier=win-x64 -p:PublishSingleFile=false
# 将 ffmpeg.exe 和 pandoc.exe 放入 publish\engines\ 目录，或运行 install.ps1
```

---

## 技术栈

| 组件 | 说明 |
|---|---|
| 框架 | .NET 8 WPF（Windows 原生） |
| 视频/音频 | FFmpeg |
| 文档 | Pandoc + 纯 .NET docx 转换器 |
| PDF | PdfSharpCore + Edge 无头模式 |
| 图片 | SixLabors.ImageSharp |

---

## 许可证

MIT
