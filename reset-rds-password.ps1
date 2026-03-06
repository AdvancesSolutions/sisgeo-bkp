# Reset RDS master password to a known value
$newPassword = "SigeoNewPass123!"

Write-Host "Resetting RDS password for sigeo-db..." -ForegroundColor Cyan

aws rds modify-db-instance `
  --db-instance-identifier sigeo-db `
  --master-user-password $newPassword `
  --apply-immediately `
  --region sa-east-1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Password reset command sent successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "New password: $newPassword" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Wait 1-2 minutes for AWS to apply the change, then test with:"
    Write-Host "psql -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -U postgres -d postgres -c 'SELECT 1'"
} else {
    Write-Host "✗ Failed to reset password" -ForegroundColor Red
    exit 1
}
