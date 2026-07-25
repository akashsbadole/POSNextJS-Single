# ponytail: daily backup script. Run via Task Scheduler or cron.
param(
  [string]$PgHost = "localhost",
  [string]$PgUser = "postgres",
  [string]$PgPassword = "postgres",
  [string]$PgDb = "pharmacy_db",
  [string]$OutDir = "$PSScriptRoot\..\backups"
)

$env:PGPASSWORD = $PgPassword
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outFile = Join-Path $OutDir "pharmacy_$timestamp.sql"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
& "pg_dump" "-h", $PgHost, "-U", $PgUser, "-d", $PgDb, "-f", $outFile

if ($LASTEXITCODE -eq 0) {
  Write-Host "Backup saved: $outFile"
  # Keep last 30 backups
  Get-ChildItem $OutDir -Filter "*.sql" | Sort-Object Name -Descending | Select-Object -Skip 30 | Remove-Item -Force
} else {
  Write-Error "Backup failed"
  exit 1
}
