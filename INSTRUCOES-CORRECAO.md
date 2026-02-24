# Instruções de Correção da API SIGEO

## Problema Identificado

A API está retornando "Erro interno" devido a um problema de conexão com o banco de dados RDS.

## Solução: Reiniciar Container com Senha Correta

### Opção 1: Via SSH (Mais Rápido)

1. **Conecte ao EC2 via SSH:**
   ```bash
   ssh ec2-user@18.228.206.86
   ```

2. **Pare containers antigos:**
   ```bash
   docker stop $(docker ps -q)
   docker rm $(docker ps -aq)
   ```

3. **Inicie novo container com configuração correta:**
   ```bash
   docker run -d --restart always --name sigeo-api -p 3000:3000 \
     -e NODE_ENV=production \
     -e PORT=3000 \
     -e DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com \
     -e DB_PORT=5432 \
     -e DB_USER=postgres \
     -e DB_PASSWORD=SigeoNewPass123! \
     -e DB_NAME=sigeo \
     -e JWT_SECRET=a6fccbc898f47e21d2723efc2b776ad0785486b7a0d746cc6c086f640f2ede \
     -e JWT_REFRESH_SECRET=657c436814463e82fba56e0767166c75420ee3c8ee070f80f514fa7fb3fa07e5 \
     -e CORS_ORIGIN=https://sigeo.advances.com.br,https://main.da1hucc7ed5a9.amplifyapp.com \
     320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest
   ```

4. **Aguarde 10 segundos e verifique:**
   ```bash
   docker logs sigeo-api
   ```

5. **Teste a API:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@empresa.com","password":"admin123"}'
   ```

### Opção 2: Usando AWS Session Manager

Se SSH não estiver disponível, use AWS Session Manager Console:

1. Acesse: https://console.aws.amazon.com/systems-manager/session-manager
2. Selecione a instância `i-0f73ae1ae2361763e`
3. Clique em "Start session"
4. Execute os mesmos comandos da Opção 1

### Opção 3: Via Console AWS (Manual)

1. **EC2 Console** → Instâncias → `i-0f73ae1ae2361763e`
2. **Connect** → **Session Manager** → **Connect**
3. Execute os comandos docker da Opção 1

## Verificação

Após reiniciar, teste em:
- **URL**: https://sigeo.advances.com.br
- **Email**: admin@empresa.com
- **Senha**: admin123

## Status Atual

### ✅ Completado:
- Banco de dados RDS criado e populado
- Senha RDS atualizada: `SigeoNewPass123!`
- Migrations executadas (20 arquivos)
- Usuários de teste criados (4 contas)
- Docker image atualizada no ECR

### ⚠️ Pendente:
- Restart do container EC2 com senha correta (SSM não disponível)

## Variáveis de Ambiente Essenciais

```bash
NODE_ENV=production
PORT=3000
DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=SigeoNewPass123!
DB_NAME=sigeo
JWT_SECRET=a6fccbc898f47e21d2723efc2b776ad0785486b7a0d746cc6c086f640f2ede
JWT_REFRESH_SECRET=657c436814463e82fba56e0767166c75420ee3c8ee070f80f514fa7fb3fa07e5
CORS_ORIGIN=https://sigeo.advances.com.br,https://main.da1hucc7ed5a9.amplifyapp.com
```

## Comandos de Diagnóstico

### Ver containers rodando:
```bash
docker ps -a
```

### Ver logs do container:
```bash
docker logs sigeo-api
```

### Testar conexão com RDS:
```bash
docker run --rm postgres:15-alpine psql \
  -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com \
  -U postgres -d sigeo -p 5432 \
  -c "SELECT COUNT(*) FROM users;"
```
(Senha quando solicitar: `SigeoNewPass123!`)

---

**Nota**: O problema é que o container está usando a senha antiga do RDS. Uma vez reiniciado com a senha `SigeoNewPass123!`, o erro deve desaparecer imediatamente.
