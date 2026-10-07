# Baton installer (Windows PowerShell). Usage: irm <site>/install.ps1 | iex   or run from a clone.
$ErrorActionPreference = 'Stop'
$root = if ($PSScriptRoot) { $PSScriptRoot } else { $null }
$src  = if ($root -and (Test-Path "$root\skill\baton")) { "$root" } else { $null }
$home_ = $env:USERPROFILE
$skillDst = Join-Path $home_ '.claude\skills\baton'
$binDst   = Join-Path $home_ '.baton\bin'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 18+ is required: https://nodejs.org' }
if (-not $src) {
  $tmp = Join-Path $env:TEMP 'baton-dl'; Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory $tmp | Out-Null
  $zip = Join-Path $tmp 'baton.zip'
  Invoke-WebRequest 'https://BATON_SITE/baton.zip' -OutFile $zip
  Expand-Archive $zip $tmp -Force; $src = $tmp
}
New-Item -ItemType Directory -Force $skillDst, $binDst | Out-Null
Copy-Item "$src\skill\baton\*" $skillDst -Recurse -Force
Copy-Item "$src\skill\baton\scripts\baton.mjs" $binDst -Force
if (Test-Path "$src\overlay") {
  $ov = Join-Path $home_ '.baton\overlay'; New-Item -ItemType Directory -Force $ov | Out-Null
  Copy-Item "$src\overlay\*" $ov -Recurse -Force
}
Write-Host "Baton installed." -ForegroundColor Green
Write-Host " skill   : $skillDst"
Write-Host " engine  : $binDst\baton.mjs"
Write-Host " overlay : $(Join-Path $home_ '.baton\overlay')  (load with: claude --plugin-dir `"$(Join-Path $home_ '.baton\overlay')`")"
Write-Host "Optional auto-save without the overlay: node `"$binDst\baton.mjs`" install-hooks"
