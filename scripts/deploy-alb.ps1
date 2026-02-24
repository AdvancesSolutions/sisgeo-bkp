# Deploy Application Load Balancer for SISGEO API

$AWS_ACCOUNT = "320674390105"
$AWS_REGION = "sa-east-1"
$CLUSTER_NAME = "sisgeo-cluster"
$SERVICE_NAME = "sigeo-api-service"
$TARGET_GROUP_NAME = "sigeo-api-tg"
$LB_NAME = "sigeo-api-lb"

Write-Host "===== AWS Application Load Balancer Setup ====="
Write-Host "Region: $AWS_REGION"
Write-Host ""

# Get VPC and Subnets
Write-Host "Step 1: Getting network configuration..."
$VPC_ID = aws ec2 describe-vpcs --region $AWS_REGION --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text
$subnets = aws ec2 describe-subnets --region $AWS_REGION --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text
$SUBNET_ARRAY = $subnets -split '\s+' | Select-Object -First 2
$SUBNET_STRING = ($SUBNET_ARRAY | ForEach-Object { "`"$_`"" }) -join ","
$SG_ID = aws ec2 describe-security-groups --region $AWS_REGION --filters "Name=vpc-id,Values=$VPC_ID,Name=group-name,Values=default" --query "SecurityGroups[0].GroupId" --output text

Write-Host "VPC: $VPC_ID"
Write-Host "Subnets: $($SUBNET_ARRAY -join ', ')"
Write-Host "Security Group: $SG_ID"
Write-Host ""

# Allow port 80 and 443 on Security Group
Write-Host "Step 2: Configuring security group..."
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION 2>$null
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION 2>$null
Write-Host "✓ Ports 80 and 443 allowed"
Write-Host ""

# Create Load Balancer
Write-Host "Step 3: Creating Application Load Balancer..."
$LB_JSON = aws elbv2 create-load-balancer `
    --name $LB_NAME `
    --subnets $SUBNET_ARRAY `
    --security-groups $SG_ID `
    --scheme internet-facing `
    --type application `
    --region $AWS_REGION `
    --output json | ConvertFrom-Json

$LB_ARN = $LB_JSON.LoadBalancers[0].LoadBalancerArn
$LB_DNS = $LB_JSON.LoadBalancers[0].DNSName

Write-Host "✓ Load Balancer: $LB_DNS"
Write-Host "ARN: $LB_ARN"
Write-Host ""

# Create Target Group
Write-Host "Step 4: Creating Target Group..."
$TG_JSON = aws elbv2 create-target-group `
    --name $TARGET_GROUP_NAME `
    --protocol HTTP `
    --port 3001 `
    --vpc-id $VPC_ID `
    --target-type ip `
    --health-check-enabled `
    --health-check-protocol HTTP `
    --health-check-path /health `
    --health-check-interval-seconds 30 `
    --health-check-timeout-seconds 5 `
    --healthy-threshold-count 2 `
    --unhealthy-threshold-count 2 `
    --matcher HttpCode=200 `
    --region $AWS_REGION `
    --output json | ConvertFrom-Json

$TG_ARN = $TG_JSON.TargetGroups[0].TargetGroupArn

Write-Host "✓ Target Group: $TARGET_GROUP_NAME"
Write-Host "ARN: $TG_ARN"
Write-Host ""

# Create Listener
Write-Host "Step 5: Creating Listener..."
aws elbv2 create-listener `
    --load-balancer-arn $LB_ARN `
    --protocol HTTP `
    --port 80 `
    --default-actions "Type=forward,TargetGroupArn=$TG_ARN" `
    --region $AWS_REGION 2>$null

Write-Host "✓ Listener created on port 80"
Write-Host ""

# Update ECS Service to use Target Group
Write-Host "Step 6: Updating ECS Service with Load Balancer..."

# Get ECS Service current settings
$SERVICE_JSON = aws ecs describe-services `
    --cluster $CLUSTER_NAME `
    --services $SERVICE_NAME `
    --region $AWS_REGION `
    --output json | ConvertFrom-Json

$TASK_DEF = $SERVICE_JSON.services[0].taskDefinition

# Update service with load balancer
aws ecs update-service `
    --cluster $CLUSTER_NAME `
    --service $SERVICE_NAME `
    --load-balancers "targetGroupArn=$TG_ARN,containerName=sigeo-api,containerPort=3001" `
    --force-new-deployment `
    --region $AWS_REGION | Out-Null

Write-Host "✓ Service updated"
Write-Host ""

Write-Host "===== Load Balancer Ready ====="
Write-Host "Public DNS: http://$LB_DNS:80"
Write-Host ""
Write-Host "API Endpoint: http://$LB_DNS/health"
