# Build all ForgeCode packages in dependency order
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot

Write-Host "Building ForgeCode..." -ForegroundColor Cyan

$packages = @(
  'packages/tool-runtime',
  'packages/ai-provider',
  'packages/permission-engine',
  'packages/filesystem',
  'packages/shell',
  'packages/git',
  'packages/task-engine',
  'packages/context-engine',
  'packages/memory',
  'packages/telemetry',
  'packages/agent-manager',
  'packages/mcp',
  'packages/scheduler',
  'packages/orchestrator',
  'packages/docker',
  'packages/browser',
  'packages/agent-runtime',
  'apps/cli'
)

foreach ($pkg in $packages) {
  $pkgPath = Join-Path $root $pkg
  if (-not (Test-Path $pkgPath)) {
    Write-Host "  SKIP $pkg (not found)" -ForegroundColor Yellow
    continue
  }
  Write-Host "  Building $pkg..." -ForegroundColor Gray
  Push-Location $pkgPath
  try {
    $result = & pnpm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Host "  FAIL $pkg" -ForegroundColor Red
      Write-Host $result
    } else {
      Write-Host "  OK   $pkg" -ForegroundColor Green
    }
  } finally {
    Pop-Location
  }
}

Write-Host "`nBuild complete." -ForegroundColor Cyan
