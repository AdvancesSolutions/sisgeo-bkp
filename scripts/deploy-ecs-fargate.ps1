# Deploy SISGEO API to AWS ECS Fargate (sa-east-1)

$AWS_ACCOUNT = "320674390105"
$AWS_REGION = "sa-east-1"
$CLUSTER_NAME = "sisgeo-cluster"
$TASK_DEF_FAMILY = "sigeo-api"
$SERVICE_NAME = "sigeo-api-service"
$IMAGE_URI = "${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/sigeo-api:latest"
$CONTAINER_PORT = 3001

Write-Host "========================================="
Write-Host "AWS ECS Fargate Deployment for SISGEO API"
Write-Host "========================================="
Write-Host "Account: $AWS_ACCOUNT"
Write-Host "Region: $AWS_REGION"
Write-Host "Image: $IMAGE_URI"
Write-Host ""

# Step 1: Check/Create VPC and Subnets
Write-Host "Step 1: Checking VPC and networking..."
$vpcs = aws ec2 describe-vpcs --region $AWS_REGION --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text
if ($vpcs -eq "None" -or [string]::IsNullOrWhiteSpace($vpcs)) {
    Write-Host "ERROR: No default VPC found. Please create a VPC first."
    exit 1
}
$VPC_ID = $vpcs
Write-Host "✓ Using VPC: $VPC_ID"

# Get default subnets
$subnets = aws ec2 describe-subnets --region $AWS_REGION --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text
$SUBNET_IDS = $subnets -split '\s+' | Select-Object -First 2
Write-Host "✓ Using Subnets: $($SUBNET_IDS -join ', ')"

# Step 2: Create/Check ECS Cluster
Write-Host ""
Write-Host "Step 2: Checking ECS Cluster..."
$clusterCheck = aws ecs describe-clusters --clusters $CLUSTER_NAME --region $AWS_REGION --query "clusters[0].clusterName" --output text 2>$null
if ($clusterCheck -ne $CLUSTER_NAME) {
    Write-Host "Creating ECS cluster: $CLUSTER_NAME..."
    aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION
}
Write-Host "✓ ECS Cluster ready: $CLUSTER_NAME"

# Step 3: Create IAM Role for Fargate Task
Write-Host ""
Write-Host "Step 3: Setting up IAM roles..."
$taskRoleName = "ecsTaskExecutionRole-sisgeo"
$taskRoleArn = aws iam list-roles --query "Roles[?RoleName=='$taskRoleName'].Arn" --output text

if ([string]::IsNullOrWhiteSpace($taskRoleArn)) {
    Write-Host "Creating IAM role: $taskRoleName..."
    $trustPolicyDocument = @{
        Version = "2012-10-17"
        Statement = @(
            @{
                Effect = "Allow"
                Principal = @{
                    Service = "ecs-tasks.amazonaws.com"
                }
                Action = "sts:AssumeRole"
            }
        )
    } | ConvertTo-Json -Compress
    
    aws iam create-role `
        --role-name $taskRoleName `
        --assume-role-policy-document $trustPolicyDocument
    
    # Attach policy for ECR access
    aws iam attach-role-policy `
        --role-name $taskRoleName `
        --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    
    $taskRoleArn = aws iam get-role --role-name $taskRoleName --query "Role.Arn" --output text
}
Write-Host "✓ IAM Role: $taskRoleArn"

# Step 4: Create/Update Task Definition
Write-Host ""
Write-Host "Step 4: Creating ECS Task Definition..."
$taskDef = @{
    family = $TASK_DEF_FAMILY
    networkMode = "awsvpc"
    requiresCompatibilities = @("FARGATE")
    cpu = "512"
    memory = "1024"
    executionRoleArn = $taskRoleArn
    containerDefinitions = @(
        @{
            name = $TASK_DEF_FAMILY
            image = $IMAGE_URI
            portMappings = @(
                @{
                    containerPort = $CONTAINER_PORT
                    hostPort = $CONTAINER_PORT
                    protocol = "tcp"
                }
            )
            logConfiguration = @{
                logDriver = "awslogs"
                options = @{
                    "awslogs-group" = "/ecs/sigeo-api"
                    "awslogs-region" = $AWS_REGION
                    "awslogs-stream-prefix" = "ecs"
                }
            }
            environment = @(
                @{ name = "NODE_ENV"; value = "production" }
                @{ name = "PORT"; value = "3001" }
            )
        }
    )
} | ConvertTo-Json -Depth 10

# Create log group first
Write-Host "Creating CloudWatch log group..."
aws logs create-log-group --log-group-name "/ecs/sigeo-api" --region $AWS_REGION 2>$null
aws logs put-retention-policy --log-group-name "/ecs/sigeo-api" --retention-in-days 7 --region $AWS_REGION

# Register task definition
$taskDefFile = New-TemporaryFile
$taskDef | Set-Content $taskDefFile
$taskDefArn = aws ecs register-task-definition --cli-input-json "file://$taskDefFile" --region $AWS_REGION --query "taskDefinition.taskDefinitionArn" --output text
Remove-Item $taskDefFile
Write-Host "✓ Task Definition: $taskDefArn"

# Step 5: Get Security Group
Write-Host ""
Write-Host "Step 5: Setting up Security Group..."
$securityGroups = aws ec2 describe-security-groups --region $AWS_REGION --filters "Name=vpc-id,Values=$VPC_ID,Name=group-name,Values=default" --query "SecurityGroups[0].GroupId" --output text
$SG_ID = $securityGroups
Write-Host "✓ Security Group: $SG_ID"

# Ensure port 3001 is open
Write-Host "Allowing inbound traffic on port $CONTAINER_PORT..."
aws ec2 authorize-security-group-ingress `
    --group-id $SG_ID `
    --protocol tcp `
    --port $CONTAINER_PORT `
    --cidr 0.0.0.0/0 `
    --region $AWS_REGION 2>$null

# Step 6: Create/Update ECS Service
Write-Host ""
Write-Host "Step 6: Creating ECS Service..."
$serviceCheck = aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query "services[0].serviceName" --output text 2>$null

if ($serviceCheck -eq $SERVICE_NAME) {
    Write-Host "Service exists, updating..."
    aws ecs update-service `
        --cluster $CLUSTER_NAME `
        --service $SERVICE_NAME `
        --task-definition $taskDefArn `
        --force-new-deployment `
        --region $AWS_REGION
} else {
    Write-Host "Creating service..."
    aws ecs create-service `
        --cluster $CLUSTER_NAME `
        --service-name $SERVICE_NAME `
        --task-definition $taskDefArn `
        --desired-count 2 `
        --launch-type FARGATE `
        --network-configuration "awsvpcConfiguration={subnets=[$($SUBNET_IDS -join ',')],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" `
        --region $AWS_REGION
}
Write-Host "✓ ECS Service: $SERVICE_NAME"

# Step 7: Wait for service stability
Write-Host ""
Write-Host "Step 7: Waiting for service to stabilize (this may take 2-3 minutes)..."
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION

# Step 8: Get Service Details
Write-Host ""
Write-Host "Step 8: Getting service details..."
$serviceDetails = aws ecs describe-services `
    --cluster $CLUSTER_NAME `
    --services $SERVICE_NAME `
    --region $AWS_REGION `
    --query "services[0]" `
    --output json | ConvertFrom-Json

Write-Host ""
Write-Host "========================================="
Write-Host "✅ Deployment Complete!"
Write-Host "========================================="
Write-Host "Cluster: $CLUSTER_NAME"
Write-Host "Service: $SERVICE_NAME"
Write-Host "Task Definition: $taskDefArn"
Write-Host "Status: $($serviceDetails.status)"
Write-Host "Running Tasks: $($serviceDetails.runningCount)/$($serviceDetails.desiredCount)"
Write-Host ""
Write-Host "To get the public IP/DNS of your service:"
Write-Host "aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION"
Write-Host ""
Write-Host "To view logs:"
Write-Host 'aws logs tail /ecs/sigeo-api --region $AWS_REGION --follow'
