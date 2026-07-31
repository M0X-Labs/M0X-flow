# Script to fix Cloudflared Windows Service by pointing it to the valid m0x-dashboard configuration
$configPath = "C:\Users\xlyre_bk3u4vp\.cloudflared\config.yml"
$exePath = "C:\Program Files (x86)\cloudflared\cloudflared.exe"

Write-Host "Stopping existing Cloudflared Windows service..." -ForegroundColor Yellow
Stop-Service -Name Cloudflared -Force -ErrorAction SilentlyContinue

Write-Host "Updating service binary path to use valid configuration..." -ForegroundColor Yellow
$newBinPath = "`"$exePath`" --config `"$configPath`" tunnel run"
sc.exe config Cloudflared binPath= $newBinPath

Write-Host "Starting Cloudflared service..." -ForegroundColor Yellow
Start-Service -Name Cloudflared

Write-Host "Checking service status..." -ForegroundColor Green
Get-Service -Name Cloudflared | Select-Object Name, DisplayName, Status
