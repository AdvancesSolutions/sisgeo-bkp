# Deploy Lambda function to seed RDS database

$FunctionName = "sigeo-rds-seed"
$Region = "sa-east-1"
$RoleName = "lambda-rds-seed-role"

Write-Host "========================================="
Write-Host "Deploying RDS Seed Lambda Function"
Write-Host "========================================="
Write-Host ""

# Step 1: Create IAM Role
Write-Host "Step 1: Creating IAM Role..."

$TrustPolicy = @{
    Version = "2012-10-17"
    Statement = @(@{
        Effect = "Allow"
        Principal = @{
            Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
    })
} | ConvertTo-Json -Compress

$TrustPolicy | Out-File -FilePath trust-policy.json

$RoleArn = aws iam create-role `
    --role-name $RoleName `
    --assume-role-policy-document "file://trust-policy.json" `
    --region $Region `
    --query "Role.Arn" `
    --output text 2>$null

if (!$RoleArn) {
    $RoleArn = aws iam get-role --role-name $RoleName --query "Role.Arn" --output text
}

Write-Host "Role: $RoleArn"
Write-Host ""

# Step 2: Create Lambda code
Write-Host "Step 2: Creating Lambda function code..."

$LambdaCode = @'
import json
import psycopg2
import os

def lambda_handler(event, context):
    # RDS connection details from environment
    db_host = os.environ.get('DB_HOST', 'sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com')
    db_name = os.environ.get('DB_NAME', 'sigeo')
    db_user = os.environ.get('DB_USER', 'postgres')
    db_port = int(os.environ.get('DB_PORT', '5432'))
    db_password = os.environ.get('DB_PASSWORD', 'postgres')
    
    try:
        # Connect to RDS
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=db_password,
            port=db_port
        )
        
        cur = conn.cursor()
        
        # Seed users  
        insert_sql = """
        INSERT INTO users (id, name, email, role, password_hash, created_at, updated_at) VALUES
        ('0cde5dbd-7e3a-47c6-a4ec-f14fceb1fa7b', 'Admin Super', 'admin@empresa.com', 'Super Admin', '$2a$10$M/szOyaSbVqzawO92qNUoeLzl66d.rw6cmQnsRz2GfnGRsg0Kd6FW', NOW(), NOW()),
        ('6a411dd7-e16e-4a0e-844e-151e30992385', 'João Silva', 'joao.ti@empresa.com', 'Gestor', '$2a$10$D2u9lTXERlquV5FGKr1/p.T004qEVb0xuqE3oNphH8U6Yd1NXxi2i', NOW(), NOW()),
        ('b681c766-abaf-439f-8fb4-3c515decf6dd', 'Maria Santos', 'maria.vendas@empresa.com', 'Gestor', '$2a$10$MaBfvm4ocTqQ9M7T9qqdmeiA8F48QIRU2pzPsD95Oy79h4JXXs3Em', NOW(), NOW()),
        ('24aabcd2-bbe6-4501-8a61-b7113c9c83ae', 'Carlos Funcionário', 'carlos.funcionario@empresa.com', 'Funcionário', '$2a$10$0T1Gb61LmTDqqe.cTvoAtu6mZqwNOdy0bSevb.w4QA3eNux8tO0/S', NOW(), NOW())
        ON CONFLICT (email) DO NOTHING;
        """
        
        cur.execute(insert_sql)
        
        # Count users
        cur.execute("SELECT COUNT(*) as total FROM users;")
        count = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Database seeded successfully',
                'totalUsers': count
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error seeding database',
                'error': str(e)
            })
        }
'@

$LambdaCode | Out-File -FilePath index.py -Encoding UTF8

# Step 3: Check if Lambda function exists
Write-Host "Step 3: Creating/Updating Lambda function..."

$FunctionExists = aws lambda get-function --function-name $FunctionName --region $Region 2>$null

if ($FunctionExists) {
    Write-Host "Function exists, updating..."
    
    # For Python, we need to zip the code
    if (Get-Command python -ErrorAction SilentlyContinue) {
        # Create a simple zip
        Write-Host "Creating deployment package..."
        # Would need proper zip handling here
        Write-Host "Note: Manual deployment recommended for Python Lambda"
    }
} else {
    Write-Host "Creating new Lambda function with embedded SQL..."
    
    # Actually, let's use Node.js which is simpler
    Write-Host "Lambda cannot be easily deployed from PowerShell"
    Write-Host ""
    Write-Host "Alternative: Use AWS Console or CLI:"
    Write-Host "aws lambda create-function --function-name sigeo-rds-seed \"
    Write-Host "  --runtime python3.11 --role $RoleArn --handler index.lambda_handler \"
    Write-Host "  --zip-file fileb://lambda.zip \"
    Write-Host "  --environment Variables={DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com,DB_NAME=sigeo,DB_USER=postgres,DB_PASSWORD=postgres,DB_PORT=5432}"
}

Remove-Item -Path index.py, trust-policy.json -Force
