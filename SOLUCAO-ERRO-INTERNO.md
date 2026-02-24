# SOLUÇÃO PARA ERRO "Erro interno. Tente novamente"

## 🔍 DIAGNÓSTICO

O erro ocorre porque o **container da API no EC2 ainda usa a senha antiga do banco de dados**.

### Status Atual:
- ✅ Banco de dados RDS: funcionando (`sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com`)
- ✅ Nova senha RDS: `SigeoNewPass123!` (armazenada em SSM `/sigeo/db-password`)
- ✅ Migrations: 20 arquivos executados com sucesso
- ✅ Usuários: 4 contas criadas (admin@empresa.com, etc.)
- ❌ Container API: usando senha antiga → erro de conexão → "Erro interno"

## 🔧 SOLUÇÃO RÁPIDA (5 minutos)

### Método 1: SSH Direto (Mais Rápido)

**1. Conecte ao EC2:**
```bash
ssh ec2-user@18.228.206.86
```

**2. Execute este comando único:**
```bash
docker stop $(docker ps -q) && docker rm $(docker ps -aq) && docker run -d --name sigeo-api --restart always -p 3000:3000 -e NODE_ENV=production -e PORT=3000 -e DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com -e DB_PORT=5432 -e DB_USER=postgres -e DB_PASSWORD=SigeoNewPass123! -e DB_NAME=sigeo -e JWT_SECRET=a6fccbc898f47e21d2723efc2b776ad0785486b7a0d746cc6c086f640f2ede -e JWT_REFRESH_SECRET=657c436814463e82fba56e0767166c75420ee3c8ee070f80f514fa7fb3fa07e5 -e CORS_ORIGIN=https://sigeo.advances.com.br 320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest
```

**3. Aguarde 10 segundos e teste:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"admin123"}'
```

Se retornar um `accessToken`, está funcionando! ✅

### Método 2: AWS Console

**1. Acesse EC2 Console:**
https://console.aws.amazon.com/ec2/v2/home?region=sa-east-1

**2. Selecione instância:** `i-0f73ae1ae2361763e`

**3. Actions → Instance State → Reboot**

Aguarde 3 minutos e teste em https://sigeo.advances.com.br

### Método 3: Session Manager

**1. Acesse Systems Manager Console:**
https://console.aws.amazon.com/systems-manager/session-manager

**2. Start Session** na instância `i-0f73ae1ae2361763e`

**3. Execute:**
```bash
sudo su ec2-user
cd ~
docker stop $(docker ps -q)
docker run -d --name sigeo-api --restart always -p 3000:3000 \
  -e DB_PASSWORD=SigeoNewPass123! \
  -e DB_HOST=sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com \
  -e DB_USER=postgres -e DB_NAME=sigeo -e DB_PORT=5432 \
  -e NODE_ENV=production -e PORT=3000 \
  -e JWT_SECRET=a6fccbc898f47e21d2723efc2b776ad0785486b7a0d746cc6c086f640f2ede \
  -e CORS_ORIGIN=https://sigeo.advances.com.br \
  320674390105.dkr.ecr.sa-east-1.amazonaws.com/sigeo-api:latest
```

## 🧪 VERIFICAÇÃO

Após executar a solução, teste em:

**URL:** https://sigeo.advances.com.br  
**Email:** admin@empresa.com  
**Senha:** admin123

**Ou via curl:**
```bash
curl -X POST http://sigeo-alb-1251114240.sa-east-1.elb.amazonaws.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"admin123"}'
```

Se retornar algo como:
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": { "id": "...", "email": "admin@empresa.com", "name": "Admin Super", "role": "Super Admin" }
}
```

**Está funcionando! ✅**

## 📝 CONTAS DISPONÍVEIS

| Email | Senha | Papel |
|-------|-------|-------|
| admin@empresa.com | admin123 | Super Admin |
| joao.ti@empresa.com | gestor123 | Gestor |
| maria.vendas@empresa.com | gestor123 | Gestor |
| carlos.funcionario@empresa.com | senha123 | Funcionário |

## 🔍 COMANDOS DE DIAGNÓSTICO

### Ver logs do container:
```bash
docker logs sigeo-api --tail 50
```

### Ver containers rodando:
```bash
docker ps -a
```

### Testar conexão com banco:
```bash
docker run --rm -e PGPASSWORD=SigeoNewPass123! postgres:15-alpine \
  psql -h sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com \
  -U postgres -d sigeo -c "SELECT email, role FROM users LIMIT 5;"
```

### Verificar variáveis do container:
```bash
docker inspect sigeo-api | grep -A 20 "Env"
```

## 💡 POR QUE ISSO ACONTECEU?

1. RDS foi criado com senha padrão (`postgres`)
2. Alteramos a senha para `SigeoNewPass123!`
3. Container continuou rodando com a senha antiga
4. Toda tentativa de conectar ao banco falha
5. NestJS retorna erro genérico 500 "Erro interno"

## ✅ CHECKLIST PÓS-CORREÇÃO

- [ ] Container reiniciado com senha nova
- [ ] Login funcionando em https://sigeo.advances.com.br
- [ ] API retorna token JWT válido
- [ ] Sem erros nos logs do Docker
- [ ] Health check retorna 200 OK

---

**Tempo estimado:** 2-5 minutos  
**Dificuldade:** Baixa (apenas copiar/colar comando)  
**Impacto:** Resolução definitiva do erro
