param (
    [string]$Version = ""
)

$ErrorActionPreference = "Stop"

if (-not $Version) {
    $PkgJson = Get-Content package.json | ConvertFrom-Json
    $Version = $PkgJson.version
}

# Strip leading 'v' if user passed v0.2.0
$Version = $Version.TrimStart('v')
$Tag = "v$Version"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " 🚀 Tagging and Triggering GitHub Automated Release" -ForegroundColor Cyan
Write-Host "    Target Version: $Version (Tag: $Tag)" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Sync package.json version
$PkgJsonPath = "package.json"
$Pkg = Get-Content $PkgJsonPath -Raw | ConvertFrom-Json
$Pkg.version = $Version
$PkgJsonFormatted = $Pkg | ConvertTo-Json -Depth 10
Set-Content -Path $PkgJsonPath -Value $PkgJsonFormatted
Write-Host " [1/3] Updated package.json to $Version" -ForegroundColor Green

# 2. Sync src-tauri/tauri.conf.json version
$TauriConfPath = "src-tauri/tauri.conf.json"
if (Test-Path $TauriConfPath) {
    $TauriConf = Get-Content $TauriConfPath -Raw | ConvertFrom-Json
    $TauriConf.version = $Version
    $TauriConfFormatted = $TauriConf | ConvertTo-Json -Depth 10
    Set-Content -Path $TauriConfPath -Value $TauriConfFormatted
    Write-Host " [2/3] Updated src-tauri/tauri.conf.json to $Version" -ForegroundColor Green
}

# 3. Commit version files and push tag to GitHub
Write-Host " [3/3] Committing files and pushing tag $Tag to GitHub..." -ForegroundColor Yellow
git add package.json src-tauri/tauri.conf.json
git commit -m "release: bump version to $Tag" --allow-empty
git tag -a $Tag -m "Release $Tag"
git push origin --tags

Write-Host "`n======================================================" -ForegroundColor Green
Write-Host " 🎉 SUCCESS! Tag $Tag pushed to GitHub." -ForegroundColor Green
Write-Host " GitHub Actions is now compiling the Windows .exe & .msi installers." -ForegroundColor Green
Write-Host " Watch build progress under your Repo -> Actions tab." -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
