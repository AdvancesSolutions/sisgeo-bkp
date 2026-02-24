# Sincronização de Ambientes - SISGEO

Scripts para sincronizar dados entre ambiente local (desenvolvimento) e AWS (produção).

## 📋 Pré-requisitos

- Docker Desktop rodando
- PostgreSQL local (via `docker compose up -d postgres`)
- Acesso ao RDS da AWS (senha do banco)
- PowerShell 5.1+ (Windows)

## 🚀 Scripts Disponíveis

### 1. Menu Interativo (Recomendado)

```powershell
cd d:\SERVIDOR\SISGEO\scripts
.\sync-environment.ps1
```

Menu com opções:
- **AWS → Local**: Baixa dados de produção para desenvolvimento
- **Local → AWS**: Envia dados locais para produção (⚠️ cuidado!)
- **Status**: Mostra estado dos ambientes e backups

### 2. AWS → Local (Download)

Baixa dados do RDS para PostgreSQL local:

```powershell
.\sync-aws-to-local.ps1
```

**O que faz:**
1. Verifica Docker e PostgreSQL local
2. Faz backup do banco local (segurança)
3. Baixa dump do RDS (produção)
4. Limpa e recria banco local
5. Restaura dados de produção localmente
6. Atualiza arquivos `.env`

**Opções:**
```powershell
# Pular backup local
.\sync-aws-to-local.ps1 -SkipBackup

# Não atualizar .env
.\sync-aws-to-local.ps1 -SkipEnvUpdate

# Passar senha via parâmetro (não recomendado)
.\sync-aws-to-local.ps1 -RDSPassword "sua-senha"
```

### 3. Local → AWS (Upload)

⚠️ **CUIDADO**: Sobrescreve dados de produção!

```powershell
.\sync-local-to-aws.ps1
```

**O que faz:**
1. Pede confirmação (digite "CONFIRMO")
2. Faz backup do RDS (segurança)
3. Exporta banco local
4. Limpa banco RDS
5. Restaura dados locais no RDS

**Opções:**
```powershell
# Forçar sem confirmação (use com cuidado!)
.\sync-local-to-aws.ps1 -Force
```

## 📁 Estrutura de Backups

Todos os backups são salvos em `SISGEO/backups/`:

```
backups/
├── backup-local-20240115-143022.sql    # Backup local antes de sync
├── rds-dump-20240115-143045.sql        # Dump do RDS baixado
├── rds-backup-20240115-150012.sql      # Backup RDS antes de upload
└── local-dump-20240115-150030.sql      # Dump local para upload
```

## 🔄 Fluxos Comuns

### Desenvolvimento com Dados de Produção

```powershell
# 1. Sincronizar AWS → Local
cd d:\SERVIDOR\SISGEO\scripts
.\sync-aws-to-local.ps1

# 2. Iniciar ambiente local
cd d:\SERVIDOR\SISGEO
pnpm run dev

# 3. Acessar http://localhost:5173
# Login com credenciais de produção (ex: admin@empresa.com)
```

### Testar Mudanças Localmente e Enviar para Produção

```powershell
# 1. Desenvolver e testar localmente
pnpm run dev

# 2. Quando estiver pronto, sincronizar Local → AWS
cd scripts
.\sync-local-to-aws.ps1

# 3. Reiniciar API em produção (App Runner/ECS)
```

### Restaurar Backup

```powershell
# Listar backups
cd d:\SERVIDOR\SISGEO\backups
dir *.sql

# Restaurar backup específico no local
docker exec -i -e PGPASSWORD=postgres postgres psql -h localhost -U postgres -d sigeo < backup-local-20240115-143022.sql

# Restaurar backup no RDS
Get-Content backup-local-20240115-143022.sql | docker run --rm -i -e PGPASSWORD="sua-senha" postgres:15-alpine psql -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -U postgres -d sigeo -p 5432
```

## 🔐 Segurança

- **Nunca** commite arquivos `.sql` no Git (já está no `.gitignore`)
- Senha do RDS é solicitada via prompt seguro
- Backups automáticos antes de qualquer operação destrutiva
- Confirmação obrigatória para operações em produção

## ⚠️ Troubleshooting

### Erro: "Docker não está rodando"
```powershell
# Inicie o Docker Desktop e aguarde
# Verifique: docker ps
```

### Erro: "PostgreSQL local não encontrado"
```powershell
cd d:\SERVIDOR\SISGEO
docker compose up -d postgres
```

### Erro: "Erro ao baixar dados do RDS"
Verifique:
1. Senha RDS está correta
2. Security Group do RDS permite seu IP público
3. Conexão com internet está OK

```powershell
# Testar conexão
docker run --rm -e PGPASSWORD="sua-senha" postgres:15-alpine psql -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -U postgres -d sigeo -p 5432 -c "SELECT 1;"
```

### Erro: "Restauração com avisos"
Avisos são normais (extensões, permissões). Verifique se os dados foram restaurados:

```powershell
# Local
docker exec -e PGPASSWORD=postgres postgres psql -h localhost -U postgres -d sigeo -c "SELECT COUNT(*) FROM users;"

# RDS
docker run --rm -e PGPASSWORD="sua-senha" postgres:15-alpine psql -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -U postgres -d sigeo -p 5432 -c "SELECT COUNT(*) FROM users;"
```

## 📊 Verificar Status

```powershell
# Via menu
.\sync-environment.ps1
# Escolha opção 3 (Status)

# Ou direto
.\sync-environment.ps1 -Action status
```

## 🔗 Configurações

### RDS (Produção)
- Host: `sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com`
- Porta: `5432`
- Database: `sigeo`
- User: `postgres`

### Local (Desenvolvimento)
- Host: `localhost`
- Porta: `5432`
- Database: `sigeo`
- User: `postgres`
- Password: `postgres`

## 📝 Notas

- Scripts criam diretório `backups/` automaticamente
- Backups são mantidos indefinidamente (limpe manualmente se necessário)
- Sincronização não afeta uploads (S3) ou logs
- Apenas dados do PostgreSQL são sincronizados

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs em `backups/`
2. Consulte [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)
3. Restaure backup se necessário
