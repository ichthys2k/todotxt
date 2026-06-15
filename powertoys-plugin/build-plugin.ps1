$ErrorActionPreference = "Stop"

$pluginDir = $PSScriptRoot
$targetDir = "$env:LOCALAPPDATA\Microsoft\PowerToys\PowerToys Run\Plugins\Todo.txt"

Write-Host "Building Todo.txt PowerToys Run Plugin..." -ForegroundColor Cyan

# Create target directories
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
New-Item -ItemType Directory -Force -Path "$targetDir\Images" | Out-Null

# Compile C# project
dotnet build "$pluginDir\TodoTxtPowerToysPlugin.csproj" -c Release

# Stop PowerToys if running to release file locks
$ptProcess = Get-Process -Name "PowerToys" -ErrorAction SilentlyContinue
if ($ptProcess) {
    Write-Host "Stopping PowerToys to unlock plugin directory..." -ForegroundColor Yellow
    Stop-Process -Name "PowerToys" -Force
    Stop-Process -Name "PowerToys.PowerLauncher" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Create target directories
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
New-Item -ItemType Directory -Force -Path "$targetDir\Images" | Out-Null

# Copy compiled files (only our plugin DLL, not the Wox.Plugin stub)
$binDir = "$pluginDir\bin\Release"
Copy-Item "$binDir\TodoTxtPowerToysPlugin.dll" -Destination "$targetDir\" -Force

# Copy metadata and icon
Copy-Item "$pluginDir\plugin.json" -Destination "$targetDir\" -Force
if (Test-Path "$pluginDir\..\public\icon.png") {
    Copy-Item "$pluginDir\..\public\icon.png" -Destination "$targetDir\Images\icon.png" -Force
}

Write-Host "Plugin successfully deployed to: $targetDir" -ForegroundColor Green

# Restart PowerToys if it was running
if ($ptProcess) {
    Write-Host "Restarting PowerToys..." -ForegroundColor Cyan
    $ptPath = "$env:LOCALAPPDATA\PowerToys\PowerToys.exe"
    if (!(Test-Path $ptPath)) {
        $ptPath = "C:\Program Files\PowerToys\PowerToys.exe"
    }
    if (Test-Path $ptPath) {
        Start-Process -FilePath $ptPath
    } else {
        Write-Host "PowerToys executable not found. Please start PowerToys manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "Please start PowerToys manually to load the plugin." -ForegroundColor Yellow
}

