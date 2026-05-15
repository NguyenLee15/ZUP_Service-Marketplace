$assets = @("assets/adaptive-icon.png", "assets/icon.png", "assets/splash-icon.png", "assets/notification-icon.png")
foreach ($f in $assets) {
    $bytes = [System.IO.File]::ReadAllBytes($f)
    $isJpg = ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8)
    $isPng = ($bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50)
    Write-Host "$f : isJPG=$isJpg isPNG=$isPng size=$($bytes.Length)"
}
