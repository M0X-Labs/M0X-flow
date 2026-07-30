# =====================================================================
# m0x-flow Automated Production Builder
# Packages Frontend + Python Backend Sidecar + Tauri Native Installer into 1 Software
# =====================================================================

$ErrorActionPreference = "Stop"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " ⚡ Building m0x-flow: Single Unified Software Installer" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Build React Frontend
Write-Host "`n[1/4] Compiling React Frontend dist..." -ForegroundColor Yellow
npm run build

# 2. Freeze Python Sidecar into Standalone Binary
Write-Host "`n[2/4] Packaging Python Sidecar via PyInstaller..." -ForegroundColor Yellow
Set-Location backend-sidecar
pyinstaller pyinstaller.spec --clean -y
Set-Location ..

# 3. Detect Target Triple and Copy Sidecar Binary
Write-Host "`n[3/4] Positioning Sidecar Binary for Tauri..." -ForegroundColor Yellow
$TargetTriple = "x86_64-pc-windows-msvc"
$TargetDir = "src-tauri/binaries"

if (!(Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
}

$SourceExe = "backend-sidecar/dist/backend-sidecar.exe"
$DestExe = "$TargetDir/backend-sidecar-$TargetTriple.exe"

if (Test-Path $SourceExe) {
    Copy-Item $SourceExe $DestExe -Force
    Write-Host "  -> Bundled sidecar binary: $DestExe" -ForegroundColor Green
} else {
    Write-Error "PyInstaller build output not found at $SourceExe"
}

# 4. Compile Tauri App & Create Installer (.exe / .msi)
Write-Host "`n[4/4] Generating Standalone Application Installer..." -ForegroundColor Yellow
npm run tauri build

Write-Host "`n======================================================" -ForegroundColor Green
Write-Host " 🎉 BUILD COMPLETE! Your single standalone software installer is ready:" -ForegroundColor Green
Write-Host "    src-tauri/target/release/bundle/" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
