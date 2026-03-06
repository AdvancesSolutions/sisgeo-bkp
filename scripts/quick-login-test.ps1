# Quick seed via curl to production API running on EC2

$API_IP = "18.228.206.86"
$API_PORT = 3000

Write-Host "========================================="
Write-Host "SISGEO Production Database Seed"
Write-Host "========================================="
Write-Host "API: http://$API_IP`:$API_PORT"
Write-Host ""

# First check if API is responsive
Write-Host "Checking API health..."
try {
    $health = Invoke-WebRequest -Uri "http://$API_IP`:$API_PORT/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ API is responsive"
    Write-Host ""
} catch {
    Write-Host "❌ API not accessible at http://$API_IP`:$API_PORT"
    Write-Host "Trying port 3001..."
    $API_PORT = 3001
    try {
        $health = Invoke-WebRequest -Uri "http://$API_IP`:$API_PORT/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ API found at port $API_PORT"
    } catch {
        Write-Host "❌ API not found"
        exit 1
    }
}

# Try seed endpoint
Write-Host "Calling seed endpoint..."
try {
    $seed_response = Invoke-WebRequest -Uri "http://$API_IP`:$API_PORT/auth/seed" `
      -Method POST `
      -UseBasicParsing `
      -TimeoutSec 10
    
    $seed_data = $seed_response.Content | ConvertFrom-Json
    Write-Host "✅ Seed successful!"
    Write-Host ""
    Write-Host "Response:"
    Write-Host ($seed_data | ConvertTo-Json)
    
} catch {
    Write-Host "❌ Seed endpoint not available"
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Trying direct login test..."
    
    # Try to login to see current status
    $loginData = '{"email":"admin@empresa.com","password":"admin123"}' 
    try {
        $loginResponse = Invoke-WebRequest -Uri "http://$API_IP`:$API_PORT/auth/login" `
          -Method POST `
          -ContentType "application/json" `
          -Body $loginData `
          -UseBasicParsing `
          -TimeoutSec 10 `
          -ErrorAction Continue
        
        if ($loginResponse.StatusCode -eq 200) {
            Write-Host "✅ Login successful! Database is already seeded."
            $userInfo = $loginResponse.Content | ConvertFrom-Json
            Write-Host "User: $($userInfo.user.name)"
            Write-Host "Email: $($userInfo.user.email)"
            Write-Host "Role: $($userInfo.user.role)"
        }
    } catch {
        Write-Host "❌ Login failed: $($_.Exception.Message)"
    }
}
