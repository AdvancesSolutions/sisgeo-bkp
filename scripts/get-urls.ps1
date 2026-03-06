# Exibe as URLs fixas do SIGEO na AWS (Amplify + CloudFront).
# Essas URLs NAO mudam a cada deploy; so mudam se voce criar um novo app ou nova distribuicao.
# Para usar uma URL sob seu controle (ex.: app.seudominio.com), veja docs/URL-FIXA-CUSTOM-DOMAIN.md

param(
    [string]$AwsRegion = "sa-east-1",
    [string]$AmplifyAppId = "da1hucc7ed5a9",
    [string]$CloudFrontDomain = "dapotha14ic3h.cloudfront.net"
)

$Awsexe = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

Write-Host ""
Write-Host "=== URLs fixas do SIGEO (nao mudam a cada deploy) ===" -ForegroundColor Cyan
Write-Host ""

# Amplify
$AmplifyUrl = "https://main.$AmplifyAppId.amplifyapp.com"
Write-Host "Web (Amplify):  $AmplifyUrl" -ForegroundColor White
Write-Host "  - Mesma URL para todos os deploys da branch main." -ForegroundColor Gray
Write-Host ""

# CloudFront (API)
$ApiUrl = "https://$CloudFrontDomain"
Write-Host "API (CloudFront): $ApiUrl" -ForegroundColor White
Write-Host "  - Mesma URL para todos os deploys da API." -ForegroundColor Gray
Write-Host ""

Write-Host "Para usar dominio customizado (ex.: app.seudominio.com):" -ForegroundColor Yellow
Write-Host "  docs/URL-FIXA-CUSTOM-DOMAIN.md" -ForegroundColor Gray
Write-Host ""
