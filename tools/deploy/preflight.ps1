param(
  [switch]$SkipMobile,
  [switch]$SkipDocker
)

$ErrorActionPreference = "Stop"

function Run-Step {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [string]$Command
  )

  Write-Host "`n==> $Name" -ForegroundColor Cyan
  Push-Location $WorkingDirectory
  try {
    powershell -NoProfile -ExecutionPolicy Bypass -Command $Command
  }
  finally {
    Pop-Location
  }
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")

Run-Step "Prisma validate" "$root\Be" "npx prisma validate"
Run-Step "Backend build" "$root\Be" "npm run build"
Run-Step "Backend unit tests" "$root\Be" "npm test -- --runInBand"
Run-Step "Backend e2e" "$root\Be" "npm run test:e2e"
Run-Step "Backend lint" "$root\Be" "npm run lint"

Run-Step "Web build" "$root\fe\wed" "npm run build"
Run-Step "Web lint" "$root\fe\wed" "npm run lint"

if (-not $SkipMobile) {
  Run-Step "Mobile typecheck" "$root\fe\mobile" "npx tsc --noEmit"
}

if (-not $SkipDocker) {
  Run-Step "Docker compose config" "$root" "docker compose config --quiet"
}

Write-Host "`nPreflight completed. Review warnings before deploy." -ForegroundColor Green
