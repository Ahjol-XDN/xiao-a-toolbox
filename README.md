# 小A万能转换工具箱 2.1

> 一款完全本地运行的桌面文件格式转换工具，拖拽即用，隐私无忧。
> 基于 .NET 8 WPF 原生构建，轻量高效。

---

## 🎯 2.1 新特性

- **纯 Windows 原生**：基于 .NET 8 WPF，无需 Electron 运行时，安装包从 ~300MB 缩小到 ~80MB
- **英文国际化**：支持中文/English 双语界面，设置页一键切换
- **深色/浅色主题**：自动跟随系统，也可手动切换
- **保留全部功能**：视频/音频/文档/图片/PDF 转换，一个都不少

## 功能模块

### 🎬 视频处理
- 格式互转（MP4 / MKV / AVI / MOV / WebM / FLV / WMV）
- 视频压缩（码率/分辨率/CRF/编码器）
- 视频裁剪（指定起止时间）
- 提取音频（MP3 / AAC / WAV / FLAC / OGG / WMA）
- 转 GIF（可调帧率和尺寸）
- 视频截图（指定时间点）

### 🎵 视频转音频
拖入视频，一键批量提取音频轨道

### 🎧 音频处理
- 格式互转（MP3 / WAV / AAC / FLAC / OGG / WMA）
- 多音频合并
- 音频裁剪

### 📄 文档转换
DOCX / PDF / MD / TXT / HTML / RTF / EPUB 互转（需 Pandoc 引擎）

### 🖼️ 图片转换
PNG / JPG / WebP / BMP / TIFF / ICO，可调质量和尺寸

### 📑 PDF 工具
- PDF 合并
- PDF 拆分（按页码范围）

### 📦 批量转换
统一格式批量处理不同类型文件

## 🔧 构建

### 环境要求
- .NET 8.0 SDK 或更高版本
- Windows 10 / 11 64 位

### 构建步骤

`powershell
# 进入项目目录
cd XiaoAToolbox

# 还原 + 构建
.\build.ps1

# 或手动步骤：
dotnet restore
dotnet build -c Release

# 发布单文件自包含
.\build.ps1 -Publish
# 输出：publish\XiaoAToolbox.exe
`

### 引擎部署

将 ffmpeg 和 pandoc 二进制文件放置在以下路径：

`
%LocalAppData%\XiaoAToolbox\engines\ffmpeg\bin\ffmpeg.exe
%LocalAppData%\XiaoAToolbox\engines\ffmpeg\bin\ffprobe.exe
%LocalAppData%\XiaoAToolbox\engines\pandoc\pandoc.exe
`

首次运行时会自动检测引擎可用性。

## 📁 项目结构

`
XiaoAToolbox/
├── App.xaml                 # 应用入口、主题加载
├── MainWindow.xaml          # 主窗口（侧边栏导航 + 内容区）
├── Models/                  # 数据模型
├── ViewModels/              # MVVM ViewModel 层
│   └── ObservableObject.cs  # MVVM 基类（无需 CommunityToolkit）
├── Views/                   # XAML 视图
├── Services/                # 业务逻辑
│   ├── FfmpegService.cs     # FFmpeg 引擎调用
│   ├── PandocService.cs     # Pandoc 引擎调用
│   ├── PdfService.cs        # PDF 合并/拆分
│   ├── ConfigService.cs     # 配置持久化
│   └── HistoryService.cs    # 转换历史
├── Converters/              # XAML 值转换器
├── Resources/
│   ├── Strings.resx         # 中文资源
│   ├── Strings.en-US.resx   # 英文资源
│   └── Themes/              # 主题资源字典
└── Engines/                 # 引擎二进制（构建时嵌入）
`

## License

MIT — 自由使用、修改、分发。
