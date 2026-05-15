param(
  [switch]$SkipBuild,
  [switch]$SkipPerf,
  [string]$DockerNetwork = "service-marketplace_app-network"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Push-Location $root

try {
  if (-not (Test-Path "Be\.env")) {
    throw "Missing Be\.env. Copy Be\.env.docker.example to Be\.env and fill required secrets first."
  }

  docker compose config --quiet

  if (-not $SkipBuild) {
    docker compose build backend frontend
  }

  docker compose up -d postgres redis backend frontend
  docker compose ps

  Write-Host "`n==> Backend logs" -ForegroundColor Cyan
  docker compose logs backend --tail 120

  Write-Host "`n==> Health checks" -ForegroundColor Cyan
  Invoke-WebRequest http://localhost:3001/health | Select-Object StatusCode, Content
  Invoke-WebRequest http://localhost:3000 | Select-Object StatusCode

  if (-not $SkipPerf) {
    New-Item -ItemType Directory -Force reports/perf | Out-Null
    docker run --rm -i `
      --network $DockerNetwork `
      -e BASE_URL=http://backend:3001 `
      -v ${PWD}:/workspace `
      -w /workspace `
      grafana/k6 run tools/perf/smoke.js
  }
}
finally {
  Pop-Location
}
