# init-git.ps1 — 一键 Git 环境初始化 & 推送脚本
# 用法: .\init-git.ps1 [commit message]
param(
    [string]$Message = "update"
)

$ErrorActionPreference = "Stop"
Write-Host "=== 小A工具箱 Git 初始化 ===" -ForegroundColor Cyan

# --- 1. 检查 Git 是否安装 ---
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Git 未安装，请从 https://git-scm.com 下载安装" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Git 已检测到" -ForegroundColor Green

# --- 2. 配置全局用户信息（如未设置） ---
$gitUser = git config --global user.name
$gitEmail = git config --global user.email
if (-not $gitUser) {
    $name = Read-Host "请输入你的 GitHub 用户名"
    git config --global user.name $name
    Write-Host "[OK] user.name 已设置为 $name" -ForegroundColor Green
}
if (-not $gitEmail) {
    $email = Read-Host "请输入你的 GitHub 邮箱"
    git config --global user.email $email
    Write-Host "[OK] user.email 已设置为 $email" -ForegroundColor Green
}

# --- 3. 启用凭证持久化 ---
git config --global credential.helper manager
Write-Host "[OK] 凭证持久化已启用" -ForegroundColor Green

# --- 4. 检查 GitHub CLI (gh) ---
if (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Host "[OK] GitHub CLI (gh) 已安装" -ForegroundColor Green
    $ghAuth = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[提示] gh 未登录，运行: gh auth login" -ForegroundColor Yellow
    }
} else {
    Write-Host "[提示] 建议安装 GitHub CLI: winget install GitHub.cli" -ForegroundColor Yellow
    Write-Host "  或从 https://cli.github.com 下载" -ForegroundColor Yellow
}

# --- 5. 检查 remote 配置 ---
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    $repoUrl = "https://github.com/Ahjol-XDN/xiao-a-toolbox.git"
    git remote add origin $repoUrl
    Write-Host "[OK] remote origin 已添加: $repoUrl" -ForegroundColor Green
} else {
    Write-Host "[OK] remote origin: $remote" -ForegroundColor Green
}

# --- 6. 一键提交 + 推送 ---
Write-Host "`n准备提交: $Message" -ForegroundColor Cyan
git add -A
git commit -m $Message
Write-Host "[OK] 已提交" -ForegroundColor Green

Write-Host "推送到 GitHub..." -ForegroundColor Cyan
git push -u origin master
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] 推送成功!" -ForegroundColor Green
} else {
    Write-Host "[提示] 推送可能需要 GitHub 登录认证" -ForegroundColor Yellow
    Write-Host "  如果失败，请先运行: gh auth login" -ForegroundColor Yellow
}
