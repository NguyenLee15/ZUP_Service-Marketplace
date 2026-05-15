Add-Type -AssemblyName System.Drawing

$assets = @("assets/adaptive-icon.png", "assets/icon.png", "assets/splash-icon.png", "assets/notification-icon.png")
foreach ($f in $assets) {
    $fullPath = Join-Path (Get-Location) $f
    $img = [System.Drawing.Image]::FromFile($fullPath)
    # Save as actual PNG, overwriting
    $tempPath = "$fullPath.tmp"
    $img.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    Move-Item -Path $tempPath -Destination $fullPath -Force
    Write-Host "Converted $f to real PNG"
}
Write-Host "Done!"
