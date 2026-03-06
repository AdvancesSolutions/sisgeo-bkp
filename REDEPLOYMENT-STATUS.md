# SIGEO API Redeployment - Status

## ✅ Completed Steps:

1. **Docker Image Built** ✓
   - Built sigeo-api:latest from apps/api/Dockerfile

2. **Pushed to ECR** ✓
   - Image: 320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest

3. **Restart Command Sent** ✓
   - Sent to EC2 instance (i-0f73ae1ae2361763e)
   - Container will pull new image and restart

## 🔄 What's Happening Now:

The EC2 instance is currently:
1. Stopping the old container
2. Pulling the new image from ECR
3. Starting the new container with updated database password

This typically takes 30-60 seconds.

## ✅ Expected Result:

Once complete, the API will:
- Connect to RDS with the new password: `SigeoNewPass123!`
- Authenticate users from the seeded database
- Allow login to https://sigeo.advances.com.br

## 🔗 Test Instructions:

**Immediate Test** (now):
```bash
curl http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/health
```

**Login Test** (if health check passes):
```bash
curl -X POST http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"admin123"}'
```

**Web UI Test**:
- Open https://sigeo.advances.com.br
- Login: admin@empresa.com / admin123

## 🆘 If Still Getting "Erro interno":

1. Wait additional 30 seconds (container may still be starting)
2. Check EC2 container status:
   ```bash
   aws ssm send-command \
     --instance-ids i-0f73ae1ae2361763e \
     --document-name AWS-RunShellScript \
     --parameters commands=['docker ps -a'] \
     --region sa-east-1
   ```
3. Check logs:
   ```bash
   aws logs tail /ecs/sigeo-api --region sa-east-1 --follow
   ```

## 📊 Database Status:

- **Host**: sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com
- **Port**: 5432
- **User**: postgres
- **Password**: SigeoNewPass123! (stored in SSM: /sigeo/db-password)
- **Database**: sigeo
- **Users seeded**: 4 (admin@empresa.com, joao.ti@empresa.com, maria.vendas@empresa.com, carlos.funcionario@empresa.com)

## 📝 Files Modified:

- apps/api/Dockerfile - Redeployed
- apps/api/src/db/seed.ts - Fixed SSL config
- apps/api/src/db/migrations/01-sla-organization-incidents.sql - Migration order fixed

---

**Next Action**: Wait 30 seconds, then test the health endpoint to confirm the redeployment is complete.
