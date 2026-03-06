# SIGEO - Infraestrutura AWS (Terraform)

Infraestrutura como código para o sistema de gestão de limpeza.

## Arquitetura

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                        AWS Cloud                         │
                    │                                                          │
  Internet          │   ┌──────────────┐     ┌─────────────────────────────┐   │
  ───────────────►  │   │  CloudFront  │────►│  Amplify (Web SPA)          │   │
                    │   │  (HTTPS)     │     │  ou S3 + CloudFront          │   │
                    │   └──────────────┘     └─────────────────────────────┘   │
                    │                                                          │
                    │   ┌──────────────┐     ┌─────────────────────────────┐   │
                    │   │  ALB (HTTPS) │────►│  ECS Fargate (API NestJS)   │   │
                    │   │  :443        │     │  + Migrações automáticas    │   │
                    │   └──────────────┘     └──────────────┬──────────────┘   │
                    │            │                          │                  │
                    │            │                          │                  │
                    │   ┌────────┴────────┐    ┌───────────▼───────────┐      │
                    │   │  ACM (SSL)      │    │  RDS PostgreSQL       │      │
                    │   │  *.sigeo.xxx   │    │  t3.micro/small       │      │
                    │   └────────────────┘    │  Backups diários       │      │
                    │                         └───────────────────────┘      │
                    │                                                          │
                    │   ┌──────────────────────────────────────────────────┐ │
                    │   │  S3: sistema-limpeza-evidencias                   │ │
                    │   │  - Acesso privado (IAM role ECS)                   │ │
                    │   │  - Lifecycle: transição logs → Glacier            │ │
                    │   └──────────────────────────────────────────────────┘ │
                    │                                                          │
                    └─────────────────────────────────────────────────────────┘
```

## Pré-requisitos

- Terraform >= 1.5
- AWS CLI configurado (`aws configure`)
- Conta AWS com permissões para: RDS, S3, ECS, ECR, VPC, IAM, ACM, ALB

## Uso

```bash
cd infra/terraform

# Inicializar
terraform init

# Planejar (visualizar mudanças)
terraform plan -var-file=terraform.tfvars

# Aplicar
terraform apply -var-file=terraform.tfvars
```

## Variáveis

| Variável | Descrição | Default |
|----------|-----------|---------|
| `project_name` | Nome do projeto | sigeo |
| `environment` | Ambiente (prod, staging) | prod |
| `aws_region` | Região AWS | sa-east-1 |
| `db_instance_class` | Classe RDS (t3.micro, t3.small) | db.t3.micro |
| `db_allocated_storage` | Storage RDS (GB) | 20 |
| `domain_name` | Domínio para certificado ACM | (opcional) |

## Estrutura

```
infra/terraform/
├── main.tf           # Orquestração principal
├── variables.tf      # Variáveis
├── outputs.tf        # Outputs (endpoints, ARNs)
├── terraform.tfvars.example  # Exemplo de valores
├── modules/
│   ├── vpc/          # VPC, subnets, security groups
│   ├── rds/          # RDS PostgreSQL
│   ├── s3/           # Bucket evidências
│   ├── ecs/          # ECS cluster, task, service
│   ├── alb/          # Application Load Balancer
│   └── iam/          # Roles para ECS e S3
└── README.md
```
