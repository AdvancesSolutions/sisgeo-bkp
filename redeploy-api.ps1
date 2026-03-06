#!/usr/bin/env pwsh
# SIGEO API Redeployment Script
# Rebuilds Docker image, pushes to ECR, and restarts the service

$ErrorActionPreference = "Stop"

$region = "sa-east-1"
$accountId = "320674390105"
$ecrRepo = "sigeo-api"
$ecrUri = "$accountId.dkr.ecr.$region.amazonaws.com/$ecrRepo"
$instanceId = "i-0f73ae1ae2361763e"

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   SIGEO API - REDEPLOYMENT PROCESS" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build Docker Image
Write-Host "📦 Step 1: Building Docker image..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Building from apps/api/Dockerfile..."
docker build -f apps/api/Dockerfile -t $ecrRepo`:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker image built successfully" -ForegroundColor Green

Write-Host ""

# Step 2: Login to ECR
Write-Host "🔐 Step 2: Logging into AWS ECR..." -ForegroundColor Yellow
Write-Host "Getting ECR login token..."
aws ecr get-login-password --region $region | docker login --username AWS --password-stdin $ecrUri
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ECR login failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ ECR login successful" -ForegroundColor Green

Write-Host ""

# Step 3: Tag and Push to ECR
Write-Host "📤 Step 3: Tagging and pushing to ECR..." -ForegroundColor Yellow
Write-Host "Tagging image as $ecrUri`:latest"
docker tag $ecrRepo`:latest $ecrUri`:latest

Write-Host "Pushing to ECR (this may take a minute)..."
docker push $ecrUri`:latest
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Push to ECR failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Image pushed to ECR" -ForegroundColor Green

Write-Host ""

# Step 4: Restart API Container
Write-Host "🔄 Step 4: Restarting API container on EC2..." -ForegroundColor Yellow
Write-Host "Sending restart command to EC2 instance..."

$restartCmd = 'echo Stopping old container; docker ps -q -f name=sigeo | xargs -r docker stop; echo Waiting 3 seconds; sleep 3; echo Pulling new image; docker pull ' + $ecrUri + ':latest; echo Starting new container; docker run -d --restart always -p 3000:3000 ' + $ecrUri + ':latest'

aws ssm send-command `
    --document-name "AWS-RunShellScript" `
    --instance-ids $instanceId `
    --region $region `
    --parameters "commands=['$restartCmd']" `
    --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to send restart command" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Restart command dispatched" -ForegroundColor Green
Write-Host ""
Write-Host "Waiting for container to restart (15 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host ""

# Step 5: Verify Deployment
Write-Host "✅ Step 5: Verifying deployment..." -ForegroundColor Yellow
Write-Host ""

$maxAttempts = 5
$attempt = 0
$healthOk = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "Health check attempt $attempt/$maxAttempts..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ API is healthy" -ForegroundColor Green
            $healthOk = $true
            break
        }
    } catch {
        Write-Host "  Health check failed, retrying in 5 seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }
}

if ($healthOk) {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "   ✅ REDEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your API has been successfully redeployed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test it at:" -ForegroundColor Cyan
    Write-Host "  🌐 https://sigeo.advances.com.br"
    Write-Host "  📧 admin@empresa.com"
    Write-Host "  🔑 admin123"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  API health check failed. Container may still be starting." -ForegroundColor Yellow
    Write-Host "Check logs with: aws logs tail /ecs/sigeo-api --region sa-east-1 --follow"
    Write-Host ""
}
