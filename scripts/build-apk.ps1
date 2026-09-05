# Set Android SDK location
$env:ANDROID_HOME = "C:\Users\ruby\AppData\Local\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:PATH"

# Export all environment variables from .env
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
            Write-Host "Injected env: $key"
        }
    }
}

Write-Host "Building standalone Release APK..."
Set-Location -Path "android"
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! APK built successfully."
    $apkPath = (Resolve-Path "app\build\outputs\apk\release\app-release.apk" -ErrorAction SilentlyContinue).Path
    if ($apkPath) {
        Write-Host "APK Location: $apkPath"
        $fileSizeMB = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
        Write-Host "APK Size: $fileSizeMB MB"
    }
} else {
    Write-Host "Build failed with exit code $LASTEXITCODE"
}
