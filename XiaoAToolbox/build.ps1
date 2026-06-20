# XiaoAToolbox Build Script
# Run from project root (D:\cx\2\XiaoAToolbox)

param(
    [switch]$Restore,
    [switch]$Build,
    [switch]$Publish,
    [switch]$Clean
)

$ErrorActionPreference = ""Stop""
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host ""=== XiaoAToolbox 3.0 Build ==="" -ForegroundColor Cyan

if ($Clean) {
    Write-Host ""Cleaning...""
    Remove-Item -Recurse -Force "$ProjectDir\bin" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "$ProjectDir\obj" -ErrorAction SilentlyContinue
    Write-Host ""Clean complete.""
}

if ($Restore -or $Build -or $Publish) {
    Write-Host ""Restoring NuGet packages...""
    dotnet restore "$ProjectDir\XiaoAToolbox.csproj"
}

if ($Build) {
    Write-Host ""Building...""
    dotnet build "$ProjectDir\XiaoAToolbox.csproj" -c Release
    Write-Host ""Build successful!""
}

if ($Publish) {
    Write-Host ""Publishing self-contained single-file...""
    dotnet publish "$ProjectDir\XiaoAToolbox.csproj" -c Release 
        -p:PublishSingleFile=true 
        -p:SelfContained=true 
        -p:RuntimeIdentifier=win-x64 
        -p:IncludeNativeLibrariesForSelfExtract=true 
        -o "$ProjectDir\publish"
    Write-Host ""Published to: $ProjectDir\publish\XiaoAToolbox.exe""
    Write-Host ""App size: "" -NoNewline
    Get-Item "$ProjectDir\publish\XiaoAToolbox.exe" | ForEach-Object { Write-Host (""{0:N1} MB"" -f ($_.Length / 1MB)) }
}

# Default: restore + build
if (-not ($Restore -or $Build -or $Publish -or $Clean)) {
    Write-Host ""Restoring...""
    dotnet restore "$ProjectDir\XiaoAToolbox.csproj"
    Write-Host ""Building...""
    dotnet build "$ProjectDir\XiaoAToolbox.csproj" -c Release
    Write-Host ""Build complete! Run: dotnet run --project $ProjectDir\XiaoAToolbox.csproj""
    Write-Host """"
    Write-Host ""To publish: .\build.ps1 -Publish""
}
