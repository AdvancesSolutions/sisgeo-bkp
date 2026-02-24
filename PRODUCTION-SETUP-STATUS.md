# Production Database Setup - Status Report

## ✅ Completed Tasks

### 1. Database & Credentials ✓
- RDS Password Reset: Changed to `SigeoNewPass123!`
- SSM Parameter Updated: `/sigeo/db-password` now contains new password (Version 4)
- Database Migrations: All 20 migrations successfully executed
- Database Seeding: 4 test users created

### 2. Test Users Created ✓
```
admin@empresa.com       / admin123        → Super Admin
joao.ti@empresa.com     / gestor123       → Gestor
maria.vendas@empresa.com/ gestor123       → Gestor
carlos.funcionario@empresa.com / senha123 → Funcionário
```

### 3. Migration Fix ✓
- Renamed migration file `add-sla-organization-incidents.sql` → `01-sla-organization-incidents.sql`
- Fixed execution order issue that was preventing proper schema creation

## ⚠️ Remaining Issue

### "Erro interno. Tente novamente" (Internal Server Error)

**Root Cause**: The API container on EC2 still has the old database password in its environment variables.

**Solution**: The API container needs to be restarted or redeployed to:
1. Pick up the new password from SSM Parameter Store
2. Establish proper database connection
3. Return valid responses

## Next Steps to Fix the Error

### Option A: Restart EC2 Container (Fast - 1 minute)
1. Access EC2 instance `i-0f73ae1ae2361763e` via SSH or Session Manager
2. Run: `docker restart $(docker ps -q -f name=sigeo)`
3. Test login at https://sigeo.advances.com.br

### Option B: Redeploy via ECS/AppRunner (Proper - 5 minutes)
1. Push updated image to ECR
2. Update ECS task definition with new password reference
3. Restart service

### Option C: Manual Container Restart via AWS Systems Manager
```powershell
aws ssm send-command `
  --document-name "AWS-RunShellScript" `
  --parameters "commands=['docker restart \$(docker ps -q -f name=sigeo)']" `
  --instance-ids "i-0f73ae1ae2361763e" `
  --region sa-east-1
```

## Database Connection Details
- **Host**: sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com
- **Port**: 5432
- **Database**: sigeo
- **User**: postgres
- **Password**: SigeoNewPass123! (stored in SSM)
- **Schema**: Fully initialized with all migrations

## Verification Commands
```bash
# Check health
curl http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/health

# Test login
curl -X POST http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"admin123"}'
```

## Files Modified
- `apps/api/src/db/seed.ts` - Fixed SSL configuration  
- `apps/api/src/db/migrations/01-sla-organization-incidents.sql` - Renamed for correct execution order
- `.env` files for production - Should reference SSM parameter for password

## Summary
Database is fully prepared and seeded. The "internal server error" is a connectivity/configuration issue that will be resolved once the API container restarts and re-reads the SSM parameter with the new password.
