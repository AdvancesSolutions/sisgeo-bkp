# Deploy SISGEO API to AWS ECS Fargate

$AWS_ACCOUNT = "320674390105"
$AWS_REGION = "sa-east-1"
$CLUSTER_NAME = "sisgeo-cluster"
$TASK_DEF_FAMILY = "sigeo-api"
$SERVICE_NAME = "sigeo-api-service"
$IMAGE_URI = "${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/sigeo-api:latest"

Write-Host "===== AWS ECS Fargate Deployment ====="
Write-Host "Account: $AWS_ACCOUNT"
Write-Host "Region: $AWS_REGION"
Write-Host "Image: $IMAGE_URI"
Write-Host ""

# Get VPC
Write-Host "Step 1: Getting VPC..."
$VPC_ID = aws ec2 describe-vpcs --region $AWS_REGION --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text
Write-Host "VPC: $VPC_ID"

# Get Subnets
Write-Host "Step 2: Getting Subnets..."
$subnets = aws ec2 describe-subnets --region $AWS_REGION --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text
$SUBNET_ARRAY = $subnets -split '\s+' | Select-Object -First 2
Write-Host "Subnets: $($SUBNET_ARRAY -join ', ')"

# Create Cluster
Write-Host "Step 3: Creating ECS Cluster..."
aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION 2>$null
Write-Host "Cluster ready: $CLUSTER_NAME"

# Get Security Group
Write-Host "Step 4: Getting Security Group..."
$SG_ID = aws ec2 describe-security-groups --region $AWS_REGION --filters "Name=vpc-id,Values=$VPC_ID,Name=group-name,Values=default" --query "SecurityGroups[0].GroupId" --output text
Write-Host "Security Group: $SG_ID"

# Open port 3001
Write-Host "Step 5: Opening port 3001..."
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 3001 --cidr 0.0.0.0/0 --region $AWS_REGION 2>$null

# Get IAM Role
Write-Host "Step 6: Setting up IAM Role..."
$ROLE_ARN = aws iam get-role --role-name "ecsTaskExecutionRole" --query "Role.Arn" --output text 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating IAM role..."
    $TRUST_POLICY = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ecs-tasks.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
'@
    $TRUST_POLICY | Out-File -FilePath trust-policy.json -Encoding UTF8
    aws iam create-role --role-name "ecsTaskExecutionRole" --assume-role-policy-document "file://trust-policy.json" --region $AWS_REGION
    aws iam attach-role-policy --role-name "ecsTaskExecutionRole" --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" --region $AWS_REGION
    $ROLE_ARN = aws iam get-role --role-name "ecsTaskExecutionRole" --query "Role.Arn" --output text
    Remove-Item trust-policy.json
}
Write-Host "Role: $ROLE_ARN"

# Create Task Definition
Write-Host "Step 7: Creating Task Definition..."
$TASK_DEF = @'
{
  "family": "sigeo-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "ROLE_ARN_PLACEHOLDER",
  "containerDefinitions": [
    {
      "name": "sigeo-api",
      "image": "IMAGE_URI_PLACEHOLDER",
      "portMappings": [
        {
          "containerPort": 3001,
          "hostPort": 3001,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/sigeo-api",
          "awslogs-region": "REGION_PLACEHOLDER",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3001" }
      ]
    }
  ]
}
'@

$TASK_DEF = $TASK_DEF -replace "ROLE_ARN_PLACEHOLDER", $ROLE_ARN
$TASK_DEF = $TASK_DEF -replace "IMAGE_URI_PLACEHOLDER", $IMAGE_URI
$TASK_DEF = $TASK_DEF -replace "REGION_PLACEHOLDER", $AWS_REGION

$TASK_DEF | Out-File -FilePath task-def.json -Encoding UTF8
aws ecs register-task-definition --cli-input-json "file://task-def.json" --region $AWS_REGION | Out-Null
Remove-Item task-def.json
Write-Host "Task Definition created"

# Format Subnets for ECS
$SUBNET_STRING = ($SUBNET_ARRAY | ForEach-Object { "`"$_`"" }) -join ","

# Create Service
Write-Host "Step 8: Creating ECS Service..."
$SERVICE_EXISTS = aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query "services[0].serviceName" --output text 2>$null

if ($SERVICE_EXISTS -eq $SERVICE_NAME) {
    Write-Host "Service exists, updating..."
    aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment --region $AWS_REGION | Out-Null
} else {
    Write-Host "Creating new service..."
    aws ecs create-service --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --task-definition $TASK_DEF_FAMILY --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_STRING],securityGroups=[`"$SG_ID`"],assignPublicIp=ENABLED}" --region $AWS_REGION | Out-Null
}

Write-Host ""
Write-Host "===== Deployment Complete ====="
Write-Host "Cluster: $CLUSTER_NAME"
Write-Host "Service: $SERVICE_NAME"
Write-Host ""
Write-Host "Monitor deployment:"
Write-Host "aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION"
