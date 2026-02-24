# Arquitetura AWS - SIGEO

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud (sa-east-1)                          │
│                                                                             │
│  ┌─────────────┐         ┌─────────────────────────────────────────────┐   │
│  │ CloudFront  │────────►│ Amplify / S3 (Web SPA)                      │   │
│  │ (HTTPS)     │         │ - React/Vite                                │   │
│  └─────────────┘         └─────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────┐         ┌─────────────────────────────────────────────┐   │
│  │ ALB         │────────►│ ECS Fargate (API NestJS)                     │   │
│  │ :80 / :443  │         │ - Migrações automáticas na inicialização    │   │
│  └─────────────┘         │ - Task Role: S3 (evidências)                 │   │
│         │                └──────────────────┬──────────────────────────┘   │
│         │                                   │                              │
│         │                ┌──────────────────▼──────────────────────────┐│
│         │                │ RDS PostgreSQL 16                             ││
│         │                │ - t3.micro / t3.small                         ││
│         │                │ - Backups diários (7 dias)                    ││
│         │                │ - Multi-AZ (prod)                              ││
│         │                └───────────────────────────────────────────────┘│
│         │                                                                  │
│         │                ┌───────────────────────────────────────────────┐│
│         │                │ S3: sistema-limpeza-evidencias                 ││
│         │                │ - Acesso privado (IAM role)                   ││
│         │                │ - Lifecycle: logs → Glacier em 180 dias       ││
│         │                │ - Criptografia AES-256                        ││
│         │                └───────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Componentes

### RDS PostgreSQL
- **Engine:** PostgreSQL 16
- **Classe:** db.t3.micro (dev) / db.t3.small (prod)
- **Storage:** 20 GB gp3, criptografado
- **Backups:** Retenção 7 dias, janela 03:00-04:00
- **Segurança:** Apenas ECS pode conectar (security group)

### S3
- **Bucket:** sistema-limpeza-evidencias (ou prefixo project-env)
- **Acesso:** Privado, IAM role da task ECS
- **Lifecycle:** logs/ → STANDARD_IA (90d) → GLACIER (180d)
- **Versionamento:** Habilitado

### ECS Fargate
- **API:** NestJS na porta 3000
- **Health check:** GET /health
- **Secrets:** DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET via SSM
- **Logs:** CloudWatch (/ecs/sigeo-prod-api)

### ALB
- **HTTP:** 80 → API
- **HTTPS:** 443 (opcional, requer ACM)

## Segurança

- Senhas em SSM Parameter Store (SecureString)
- RDS em subnets privadas
- ECS em subnets privadas (NAT para egress)
- S3 block public access
- IAM least privilege (task role só S3)

## Custos Estimados (mensal)

| Recurso | Custo aprox. |
|---------|--------------|
| RDS t3.micro | ~$15 |
| ECS Fargate 0.25 vCPU, 0.5 GB | ~$10 |
| ALB | ~$20 |
| S3 (10 GB) | ~$0.25 |
| **Total** | **~$45/mês** |
