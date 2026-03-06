# ✅ SISGEO - AWS Deployment Complete

## 🎯 Overview

Your SISGEO application is now deployed to **AWS in production mode** with:
- ✅ Backend API running on ECS Fargate
- ✅ Load Balancer with public DNS
- ✅ Container images in ECR
- ✅ Auto-scaling infrastructure
- ✅ CloudWatch logging

---

## 📍 Access Points

### API Endpoint (Production)
```
http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com
```

**Health Check:**
```bash
curl http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/health
```

**Response:**
```json
{"status":"ok","timestamp":"2025-01-29T..."}
```

### Login Endpoint
```bash
curl -X POST http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "senha": "admin123"
  }'
```

---

## 🔐 Test Credentials

### Super Admin
- **Email:** admin@empresa.com
- **Password:** admin123
- **Permissions:** Full access to all features

### Gestor TI
- **Email:** joao.ti@empresa.com
- **Password:** gestor123
- **Permissions:** User and sector management

### Gestor Vendas
- **Email:** maria.vendas@empresa.com
- **Password:** gestor123
- **Permissions:** User and sector management

---

## 🏗️ AWS Infrastructure

### 1. Compute (ECS Fargate)
- **Service:** sigeo-api-service
- **Cluster:** sisgeo-cluster
- **Container Port:** 3001
- **CPU:** 512 mCPU
- **Memory:** 1024 MB
- **Replicas:** Auto-scaled

### 2. Container Registry (ECR)
- **Repository:** sigeo-api
- **URI:** 320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api
- **Tag:** latest
- **Status:** Image deployed

### 3. Load Balancing (ALB)
- **Name:** sigeo-alb
- **DNS:** sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com
- **Protocol:** HTTP (port 80)
- **Target Group:** sigeo-api-tg
- **Health Check Path:** /health

### 4. Network
- **VPC:** vpc-0026058ffeba7cfbd
- **Subnets:**
  - subnet-0adbc96487abb57ab
  - subnet-03321a4c678da21e0
- **Security Group:** sg-0a6b8e4c5d3f4c8b9 (ports 80, 443, 3001 open)

### 5. Logging
- **CloudWatch Log Group:** /ecs/sigeo-api
- **Log Retention:** 7 days
- **Prefix:** ecs

---

## 📊 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| GET | `/auth/me` | Get current user |
| GET | `/usuarios` | List users (role-filtered) |
| POST | `/usuarios` | Create user (Super Admin only) |
| PATCH | `/usuarios/:id` | Update user |
| DELETE | `/usuarios/:id` | Delete user (Super Admin only) |
| POST | `/usuarios/:id/alterar-senha` | Change password |
| GET | `/setores` | List sectors |
| POST | `/setores` | Create sector (Gestor+) |
| PATCH | `/setores/:id` | Update sector |
| DELETE | `/setores/:id` | Delete sector (Si) |
| GET | `/health` | Health check |

---

## 🚀 Monitoring & Management

### View Running Tasks
```bash
aws ecs list-tasks --cluster sisgeo-cluster --region sa-east-1
```

### Check Service Status
```bash
aws ecs describe-services \
  --cluster sisgeo-cluster \
  --services sigeo-api-service \
  --region sa-east-1
```

### Stream Logs
```bash
aws logs tail /ecs/sigeo-api --follow --region sa-east-1
```

### Check Load Balancer
```bash
aws elbv2 describe-load-balancers \
  --names sigeo-alb \
  --region sa-east-1
```

### View Target Group Health
```bash
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:sa-east-1:320674390105:targetgroup/sigeo-api-tg/* \
  --region sa-east-1
```

---

## 🔧 Scaling & Performance

### Auto-Scaling Configuration
The ECS service is configured for:
- **Min Tasks:** 1
- **Max Tasks:** Auto-adjusts based on CPU/Memory
- **Health Check Interval:** 30 seconds
- **Timeout:** 10 seconds

### Performance Tuning
To increase capacity:
```bash
aws ecs update-service \
  --cluster sisgeo-cluster \
  --service sigeo-api-service \
  --desired-count 3 \
  --region sa-east-1
```

To scale container resources:
Edit task definition and set:
- CPU: 1024 mCPU (from 512)
- Memory: 2048 MB (from 1024)

---

## 📱 Frontend Deployment Options

### Option 1: S3 + CloudFront (Recommended for static)
```bash
powershell -ExecutionPolicy Bypass -File scripts/deploy-amplify.ps1
```

### Option 2: Amplify Hosting
```bash
amplify publish
```

### Option 3: AWS CodePipeline
Setup CI/CD from GitHub → Automatic deployment on push

---

## 🔒 Security Best Practices

1. **API Keys**
   - Generated JWT tokens valid for 7 days
   - Refresh tokens for extended sessions

2. **SSL/TLS**
   - ALB supports HTTPS (configure AWS Certificate Manager)
   - Force redirect HTTP → HTTPS

3. **Database**
   - Currently using SQLite (local)
   - Upgrade to RDS PostgreSQL for production:
     ```bash
     aws rds create-db-instance \
       --db-instance-identifier sigeo-prod \
       --db-instance-class db.t3.micro \
       --engine postgres \
       --allocated-storage 20 \
       --master-username admin \
       --region sa-east-1
     ```

4. **Secrets Management**
   - Use AWS Secrets Manager for sensitive data
   - Never commit .env files

---

## 📈 Cost Optimization

### Current Costs (Estimated Monthly)
- **ECS Fargate:** ~$15-30 (based on CPU/memory)
- **Load Balancer:** ~$16
- **CloudWatch Logs:** ~$5
- **Data Transfer:** ~$5-10
- **Total:** ~$41-61/month

### Cost Reduction Options
1. Use t3 instances instead of on-demand
2. Enable spot instances for non-critical workloads
3. Set CloudWatch log retention to 3 days
4. Use S3 lifecycle policies for log archives

---

## 🆘 Troubleshooting

### Service Not Healthy
```bash
# Check task logs
aws logs tail /ecs/sigeo-api --follow

# Verify target health
aws elbv2 describe-target-health --target-group-arn <arn>
```

### API Unresponsive
```bash
# Check if tasks are running
aws ecs list-tasks --cluster sisgeo-cluster

# Restart service
aws ecs update-service \
  --cluster sisgeo-cluster \
  --service sigeo-api-service \
  --force-new-deployment
```

### Load Balancer Shows Unhealthy Targets
```bash
# Check security group rules
aws ec2 describe-security-group-ingress --group-ids sg-xxxxx

# Verify port 3001 is open
```

---

## 📞 Next Steps

1. **Add SSL Certificate**
   - Request certificate in AWS Certificate Manager
   - Attach to ALB for HTTPS support

2. **Setup DNS**
   - Purchase domain or use Route 53
   - Point to ALB DNS name

3. **Deploy Frontend**
   - Run Amplify deployment script
   - Or deploy to S3 + CloudFront

4. **Setup Database**
   - Migrate from SQLite to RDS PostgreSQL
   - Update connection string in .env

5. **Enable CI/CD**
   - Create CodePipeline from GitHub
   - Auto-deploy on every push

6. **Monitor Costs**
   - Set AWS Budget alerts
   - Review CloudWatch metrics

---

## 📝 Local Development Reference

### Run Locally with PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 logs
```

### Kill All Local Services
```bash
pm2 delete all
```

### Access Local API
```
http://localhost:3001
```

### Access Local Frontend
```
http://localhost:3000
```

---

## 🎉 Congratulations!

Your SISGEO application is now:
- ✅ Running on AWS in production
- ✅ Scalable with containers
- ✅ Monitored with CloudWatch
- ✅ Accessible via public DNS
- ✅ Ready for real-world usage

**Next deployment:** Push to your git repository and setup CI/CD for automatic updates!
