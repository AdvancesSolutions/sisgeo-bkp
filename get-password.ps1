# Script to retrieve RDS password from SSM
$ErrorActionPreference = "Stop"

Write-Host "Retrieving RDS password from SSM..." -ForegroundColor Cyan

try {
    $dbPassword = aws ssm get-parameter `
      --name "/sigeo/db-password" `
      --with-decryption `
      --query "Parameter.Value" `
      --output text `
      --region sa-east-1
    
    if ($dbPassword) {
        Write-Host "SUCCESS: Password retrieved" -ForegroundColor Green
        Write-Host "Password length: $($dbPassword.Length) characters"
        Write-Host $dbPassword
    } else {
        Write-Host "ERROR: Empty password returned" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}
