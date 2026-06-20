# XiaoA Toolbox 2.1.1

> A 100% local desktop file format conversion tool — drag, drop, convert. Privacy first.
> Built with .NET 8 WPF, lightweight and efficient.

---

## Features

- **Video**: format convert / compress / trim / to GIF / screenshot
- **Audio**: format convert / merge / trim
- **Document**: convert between DOCX, PDF, MD, HTML, TXT, RTF, EPUB
- **Image**: convert between PNG, JPG, WebP, BMP, TIFF
- **PDF**: merge / split
- **Batch**: multi-file batch conversion
- **UI**: Chinese / English bilingual

---

## Installation

### Option 1: Download Release
1. Install [.NET 8 Runtime](https://dotnet.microsoft.com/download/dotnet/8.0)
2. Download `XiaoAToolbox-v*-portable.zip` from [Releases](https://github.com/Ahjol-XDN/xiao-a-toolbox/releases)
3. Extract and run `install.ps1` in PowerShell
4. Launch from desktop shortcut

### Option 2: Build from Source
```powershell
cd XiaoAToolbox
dotnet restore
dotnet build -c Release
dotnet publish -c Release -o publish --self-contained false -p:RuntimeIdentifier=win-x64 -p:PublishSingleFile=false
# Place ffmpeg.exe and pandoc.exe in publish\engines\ or run install.ps1
```

---

## Tech Stack

| Component | Details |
|---|---|
| Framework | .NET 8 WPF (Windows native) |
| Video/Audio | FFmpeg |
| Document | Pandoc + native .NET docx converter |
| PDF | PdfSharpCore + Edge headless |
| Image | SixLabors.ImageSharp |

---

## License

MIT
