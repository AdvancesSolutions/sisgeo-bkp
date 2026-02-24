# AWS Lambda-based database seeding script

$AWS_REGION = "sa-east-1"
$AWS_ACCOUNT = "320674390105"
$FUNCTION_NAME = "sigeo-seed-database"
$ROLE_NAME = "lambda-rds-execution-role"

Write-Host "===== SISGEO Production Database Seeding via Lambda ====="
Write-Host ""

# Step 1: Create IAM Role for Lambda
Write-Host "Step 1: Setting up IAM rolle..."

$TRUST_POLICY = @{
  Version = "2012-10-17"
  Statement = @(
    @{
      Effect = "Allow"
      Principal = @{
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }
  )
} | ConvertTo-Json -Compress

$roleExists = aws iam get-role --role-name $ROLE_NAME --region $AWS_REGION 2>$null

if ($?) {
  Write-Host "✓ IAM Role exists"
} else {
  Write-Host "Creating IAM Role..."
  
  # Create trust policy file
  $TRUST_POLICY | Out-File -FilePath trust-policy.json
  
  aws iam create-role `
    --role-name $ROLE_NAME `
    --assume-role-policy-document "file://trust-policy.json" `
    --region $AWS_REGION
  
  # Attach basic execution policy
  aws iam attach-role-policy `
    --role-name $ROLE_NAME `
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" `
    --region $AWS_REGION
  
  # Attach VPC access policy  (if RDS is in VPC)
  aws iam attach-role-policy `
    --role-name $ROLE_NAME `
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole" `
    --region $AWS_REGION
  
  Remove-Item trust-policy.json
  
  Write-Host "✓ IAM Role created"
  
  # Wait for role to be ready
  Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "Step 2: Preparing Lambda function..."

# Get Lambda role ARN
$ROLE_ARN = aws iam get-role --role-name $ROLE_NAME --query "Role.Arn" --output text --region $AWS_REGION

# Zip the Lambda function
$LAMBDA_CODE = Get-Content -Path scripts/seed-lambda.js -Raw
$ZIP_FILE = "lambda-seed.zip"

# Create a simple zip (npm package.json + index.js)
$PACKAGE_JSON = @{
  name = "sigeo-seed"
  version = "1.0.0"
  dependencies = @{
    pg = "^8.0.0"
  }
} | ConvertTo-Json

# Create temp directory
$TEMP_DIR = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "lambda-$(Get-Random)")
New-Item -ItemType Directory -Path $TEMP_DIR -Force | Out-Null

# Write files
$LAMBDA_CODE | Out-File -FilePath "$TEMP_DIR/index.js"
$PACKAGE_JSON | Out-File -FilePath "$TEMP_DIR/package.json"

# Create ZIP
cd $TEMP_DIR
npm install --production 2>$null

# Compress
if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
  Compress-Archive -Path * -DestinationPath $ZIP_FILE -Force
} else {
  Write-Host "⚠️ Cannot create ZIP on this system"
  Write-Host "Manual steps:"
  Write-Host "1. cd $TEMP_DIR"
  Write-Host "2. npm install --production"
  Write-Host "3. Zip all files to lambda-seed.zip"
  exit 1
}

$ZIP_BYTES = [System.IO.File]::ReadAllBytes("$TEMP_DIR/$ZIP_FILE")
cd ..

Write-Host "✓ Lambda function packaged"
Write-Host ""

# Step 3: Create or Update Lambda function
Write-Host "Step 3: Deploying Lambda function..."

$FUNCTION_EXISTS = aws lambda get-function --function-name $FUNCTION_NAME --region $AWS_REGION 2>$null

if ($?) {
  Write-Host "Updating existing Lambda function..."
  aws lambda update-function-code `
    --function-name $FUNCTION_NAME `
    --zip-file "fileb://$ZIP_FILE" `
    --region $AWS_REGION
} else {
  Write-Host "Creating new Lambda function..."
  aws lambda create-function `
    --function-name $FUNCTION_NAME `
    --region $AWS_REGION `
    --zip-file "fileb://$ZIP_FILE" `
    --handler "index.handler" `
    --runtime nodejs20.x `
    --role $ROLE_ARN `
    --timeout 60 `
    --memory-size 256 `
    --environment "Variables={DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com,DB_NAME=sigeo,DB_USER=postgres,DB_PORT=5432}"
}

Write-Host "✓ Lambda function deployed"
Write-Host ""

# Step 4: Invoke Lambda
Write-Host "Step 4: Invoking Lambda to seed database..."
Write-Host "Enter RDS password when prompted:"

$RESPONSE_FILE = "lambda-response.json"

# Prompt for password and invoke
$password = Read-Host -AsSecureString "PostgreSQL password"
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($password))

$PAYLOAD = @{
  DB_PASSWORD = $plainPassword
} | ConvertTo-Json

aws lambda invoke `
  --function-name $FUNCTION_NAME `
  --region $AWS_REGION `
  --payload $PAYLOAD `
  --cli-binary-format raw-in-base64-out `
  $RESPONSE_FILE

$RESPONSE = Get-Content $RESPONSE_FILE -Raw | ConvertFrom-Json

Write-Host ""
Write-Host "Response:"
Write-Host ($RESPONSE | ConvertTo-Json)

Write-Host ""
Write-Host "✅ Database seeding complete!"
Write-Host ""
Write-Host "You can now login to https://sigeo.advances.com.br with:"
Write-Host "  Email: admin@empresa.com"
Write-Host "  Password: admin123"

# Cleanup
Remove-Item -Path $ZIP_FILE -Force -ErrorAction SilentlyContinue
Remove-Item -Path $RESPONSE_FILE -Force -ErrorAction SilentlyContinue
Remove-Item -Path $TEMP_DIR -Recurse -Force -ErrorAction SilentlyContinue
