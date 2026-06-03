param(
  [int]$Port = 8080
)

$ScriptPath = Join-Path $PSScriptRoot "tools\local-hub-server.mjs"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required to run the local hub server."
  exit 1
}

node $ScriptPath $Port
