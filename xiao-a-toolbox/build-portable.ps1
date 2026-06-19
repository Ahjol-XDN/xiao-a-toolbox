# build-portable.ps1 — 小A工具箱便携版打包脚本
# 用法: .\build-portable.ps1 [-Slim] [-Clean]

param(
    [switch]$Slim,     # 精简版（不含 pandoc 文档引擎）
    [switch]$Clean     # 打包前清理编译缓存
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   小A工具箱 便携版打包" -ForegroundColor Cyan
if ($Slim) { Write-Host "   [精简版模式]" -ForegroundColor Yellow }
Write-Host "========================================" -ForegroundColor Cyan

# --- 1. 清理旧产物 ---
if ($Clean) {
    Write-Host "[1/5] 清理缓存..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "$root\.vite" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "$root\dist" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "$root\dist-electron" -ErrorAction SilentlyContinue
}

# --- 2. 编译 ---
Write-Host "[2/5] TypeScript 编译 + Vite 构建..." -ForegroundColor Gray
cmd /c "npm run build:vite" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] 编译失败!" -ForegroundColor Red
    exit 1
}

# --- 3. Electron 打包 (portable) ---
Write-Host "[3/5] Electron-Builder 打包..." -ForegroundColor Gray
cmd /c "npx electron-builder --win portable --config electron-builder.yml" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] electron-builder 有警告，继续..." -ForegroundColor Yellow
}

# --- 4. 注入图标到 PE ---
Write-Host "[4/5] 注入应用图标..." -ForegroundColor Gray
$unpackedExe = Get-ChildItem "$root\dist\win-unpacked" -Filter "*.exe" | Select-Object -First 1
if ($unpackedExe) {
    # Copy to temp without Chinese path
    Copy-Item $unpackedExe.FullName -Destination "$env:TEMP\toolbox_tmp.exe" -Force
    # Use rcedit from cache
    $rcedit = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign" | 
        Get-ChildItem -Filter "rcedit-x64.exe" -Recurse | Select-Object -First 1
    if ($rcedit) {
        & $rcedit.FullName "$env:TEMP\toolbox_tmp.exe" --set-icon "$root\resources\icons\icon.png"
        Copy-Item "$env:TEMP\toolbox_tmp.exe" -Destination "$root\dist\win-unpacked\xiao-a-toolbox.exe" -Force
        Remove-Item "$env:TEMP\toolbox_tmp.exe" -Force
        Write-Host "  [OK] 图标已注入" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] rcedit 未找到" -ForegroundColor Yellow
    }
}

# --- 5. 精简版处理 ---
if ($Slim) {
    Write-Host "[5/5] 精简处理..." -ForegroundColor Gray
    
    # 移除 pandoc 文档引擎 (~80MB)
    $pandocDir = "$root\dist\win-unpacked\resources\engines\pandoc"
    if (Test-Path $pandocDir) {
        Remove-Item -Recurse -Force $pandocDir
        $saved = [math]::Round(80, 0)
        Write-Host "  - 移除 pandoc 引擎 (~${saved}MB)" -ForegroundColor Gray
    }
    
    # 清理 ffmpeg 非必要文件
    $ffmpegDir = "$root\dist\win-unpacked\resources\engines\ffmpeg\bin"
    if (Test-Path $ffmpegDir) {
        # 保留 ffmpeg.exe + ffprobe.exe，删 ffplay.exe
        Remove-Item "$ffmpegDir\ffplay.exe" -Force -ErrorAction SilentlyContinue
        Write-Host "  - 移除 ffplay (~20MB)" -ForegroundColor Gray
    }
    
    # 清理无用文件
    $localesDir = "$root\dist\win-unpacked\locales"
    if (Test-Path $localesDir) {
        Get-ChildItem $localesDir -Filter "*.pak" | Where-Object { $_.Name -notmatch "zh-CN|en-US" } | Remove-Item -Force
        Write-Host "  - 精简语言包" -ForegroundColor Gray
    }
}

# --- 6. 压缩为 zip ---
Write-Host "压缩打包..." -ForegroundColor Cyan
$pkg = Get-Content "$root\package.json" | ConvertFrom-Json
$ver = $pkg.version
$label = if ($Slim) { "slim" } else { "full" }
$zipName = "xiao-a-toolbox-v${ver}-${label}-portable.zip"
$zipPath = "$root\dist\$zipName"

# 删除 .icon-ico 临时目录
Remove-Item -Recurse -Force "$root\dist\.icon-ico" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$root\dist\builder-debug.yml" -ErrorAction SilentlyContinue

# 7-Zip 极限压缩
$sevenZip = "C:\Program Files\7-Zip\7z.exe"
if (Test-Path $sevenZip) {
    & $sevenZip a -tzip -mx9 "$zipPath" "$root\dist\win-unpacked\*" | Out-Null
}

$zipSize = if (Test-Path $zipPath) { [math]::Round((Get-Item $zipPath).Length / 1MB, 1) } else { 0 }

Write-Host "========================================" -ForegroundColor Green
Write-Host "   打包完成!" -ForegroundColor Green
Write-Host "   文件: dist\$zipName" -ForegroundColor White
Write-Host "   大小: ${zipSize} MB" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
