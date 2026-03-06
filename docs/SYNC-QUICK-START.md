# Guia Rápido - Sincronização de Ambientes

## 🎯 Cenários Comuns

### 1. Começar a desenvolver com dados reais

```powershell
# Passo 1: Baixar dados de produção
cd d:\SERVIDOR\SISGEO\scripts
.\sync-aws-to-local.ps1

# Passo 2: Iniciar ambiente local
cd d:\SERVIDOR\SISGEO
pnpm run dev

# Passo 3: Acessar http://localhost:5173
# Login: admin@empresa.com / admin123
```

### 2. Testar funcionalidade com dados de produção

```powershell
# Sincronizar dados
cd d:\SERVIDOR\SISGEO\scripts
.\sync-aws-to-local.ps1

# Desenvolver e testar
cd ..
pnpm run dev

# Dados de produção estão disponíveis localmente
# Mudanças no código não afetam produção
```

### 3. Criar dados de teste e enviar para produção

⚠️ **Use com cuidado! Sobrescreve produção!**

```powershell
# Passo 1: Criar dados localmente
cd d:\SERVIDOR\SISGEO
pnpm run dev
# Criar usuários, locais, tarefas, etc.

# Passo 2: Enviar para produção
cd scripts
.\sync-local-to-aws.ps1
# Digite "CONFIRMO" quando solicitado

# Passo 3: Verificar em produção
# https://sigeo.advances.com.br
```

### 4. Restaurar backup

```powershell
# Listar backups disponíveis
cd d:\SERVIDOR\SISGEO\backups
dir *.sql | Sort-Object LastWriteTime -Descending

# Restaurar no local
docker exec -i -e PGPASSWORD=postgres postgres psql -h localhost -U postgres -d sigeo < backup-local-20240115-143022.sql

# Restaurar no RDS (produção)
Get-Content rds-backup-20240115-150012.sql | docker run --rm -i -e PGPASSWORD="SUA_SENHA" postgres:15-alpine psql -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -U postgres -d sigeo -p 5432
```

## 🔧 Comandos Úteis

### Verificar dados locais

```powershell
# Contar usuários
docker exec -e PGPASSWORD=postgres postgres psql -h localhost -U postgres -d sigeo -c "SELECT COUNT(*) FROM users;"

# Listar usuários
docker exec -e PGPASSWORD=postgres postgres psql -h localhost -U postgres -d sigeo -c "SELECT email, role FROM users;"

# Ver todas as tabelas
docker exec -e PGPASSWORD=postgres postgres psql -h localhost -U postgres -d sigeo -c "\dt"
```

### Verificar dados no RDS

```powershell
# Contar usuários (substitua SUA_SENHA)
docker run --rm -e PGPASSWORD="SUA_SENHA" postgres:15-alpine psql -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -U postgres -d sigeo -p 5432 -c "SELECT COUNT(*) FROM users;"

# Listar usuários
docker run --rm -e PGPASSWORD="SUA_SENHA" postgres:15-alpine psql -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -U postgres -d sigeo -p 5432 -c "SELECT email, role FROM users;"
```

### Limpar banco local

```powershell
# Dropar e recriar
docker exec -e PGPASSWORD=postgres postgres psql -h localhost -U postgres -d postgres -c "DROP DATABASE IF EXISTS sigeo;"
docker exec -e PGPASSWORD=postgres postgres psql -h localhost -U postgres -d postgres -c "CREATE DATABASE sigeo;"

# Ou usar seed padrão
cd d:\SERVIDOR\SISGEO
pnpm run db:seed
```

### Status dos ambientes

```powershell
cd d:\SERVIDOR\SISGEO\scripts
.\sync-environment.ps1 -Action status
```

## 📊 Comparar Ambientes

```powershell
# Script para comparar contagens
$LOCAL_USERS = docker exec -e PGPASSWORD=postgres postgres psql -h localhost -U postgres -d sigeo -t -c "SELECT COUNT(*) FROM users;" 2>$null
$RDS_USERS = docker run --rm -e PGPASSWORD="SUA_SENHA" postgres:15-alpine psql -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -U postgres -d sigeo -p 5432 -t -c "SELECT COUNT(*) FROM users;" 2>$null

Write-Host "Local: $($LOCAL_USERS.Trim()) usuários"
Write-Host "RDS:   $($RDS_USERS.Trim()) usuários"
```

## 🚨 Troubleshooting Rápido

### Erro: "Docker não está rodando"
```powershell
# Abra Docker Desktop e aguarde iniciar
# Verifique: docker ps
```

### Erro: "PostgreSQL local não encontrado"
```powershell
cd d:\SERVIDOR\SISGEO
docker compose up -d postgres
# Aguarde 5 segundos
docker ps
```

### Erro: "Senha RDS incorreta"
```powershell
# Obter senha do Parameter Store (se configurado)
aws ssm get-parameter --name /sigeo/db/password --with-decryption --query Parameter.Value --output text

# Ou resetar senha no console AWS RDS
```

### Erro: "Não consegue conectar no RDS"
```powershell
# Verificar Security Group
# Deve permitir PostgreSQL (5432) do seu IP

# Obter seu IP público
curl ifconfig.me

# Adicionar no Security Group do RDS:
# Type: PostgreSQL
# Port: 5432
# Source: SEU_IP/32
```

## 📝 Boas Práticas

1. **Sempre faça backup antes de operações destrutivas**
   - Scripts fazem backup automático
   - Backups ficam em `SISGEO/backups/`

2. **Use dados de produção apenas para leitura/teste**
   - Não modifique dados sensíveis localmente
   - Crie dados de teste separados se necessário

3. **Confirme antes de enviar para produção**
   - `sync-local-to-aws.ps1` pede confirmação
   - Use `-Force` apenas em scripts automatizados

4. **Mantenha backups organizados**
   - Limpe backups antigos periodicamente
   - Mantenha pelo menos os últimos 5 backups

5. **Verifique após sincronização**
   - Compare contagens de registros
   - Teste login com usuários conhecidos
   - Verifique logs da API

## 🔗 Links Úteis

- [Documentação Completa](./SYNC-ENVIRONMENTS.md)
- [Troubleshooting](../TROUBLESHOOTING.md)
- [Deploy AWS](./DEPLOY-AWS-PASSO-A-PASSO.md)
- [README Principal](../README.md)

## 💡 Dicas

- Use `sync-environment.ps1` (menu) para operações interativas
- Use scripts individuais em automações/CI
- Backups são incrementais (não sobrescrevem)
- Senha RDS pode ser salva no Windows Credential Manager
- Scripts funcionam com PostgreSQL 12, 13, 14, 15

## 🎓 Exemplos Avançados

### Sincronizar apenas tabela específica

```powershell
# Exportar tabela do RDS
docker run --rm -e PGPASSWORD="SUA_SENHA" postgres:15-alpine pg_dump -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -U postgres -d sigeo -p 5432 -t users > users-only.sql

# Importar no local
Get-Content users-only.sql | docker exec -i -e PGPASSWORD=postgres postgres psql -h localhost -U postgres -d sigeo
```

### Agendar sincronização automática

```powershell
# Criar tarefa agendada (Task Scheduler)
# Executar diariamente às 2h da manhã
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File d:\SERVIDOR\SISGEO\scripts\sync-aws-to-local.ps1 -RDSPassword 'SUA_SENHA'"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "SISGEO-Sync" -Description "Sincroniza dados AWS para local"
```

### Sincronizar com notificação

```powershell
# Adicionar ao final do script
.\sync-aws-to-local.ps1
if ($LASTEXITCODE -eq 0) {
    # Enviar notificação (ex: Slack, email, etc.)
    Write-Host "✅ Sincronização concluída com sucesso!"
} else {
    Write-Host "❌ Erro na sincronização!"
}
```
