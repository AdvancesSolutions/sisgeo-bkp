# 🔧 Solução de Problemas - Task Management API

## ❌ "Credenciais Inválidas" ao fazer login

### Causas Comuns:

### 1️⃣ **Banco de dados não foi populado**

Você precisa executar o seed para criar os usuários padrão:

```bash
npm run migrate    # Cria as tabelas
npm run seed       # Popula com dados de teste
```

**Verifique se a pasta `task_management.db` foi criada:**
```bash
ls -la task_management.db
# ou no Windows
dir task_management.db
```

### 2️⃣ **Email ou senha incorretos**

Credenciais padrão após seed:

| Email | Senha | Role |
|-------|-------|------|
| `admin@empresa.com` | `admin123` | SUPER_ADMIN |
| `joao.ti@empresa.com` | `gestor123` | GESTOR |
| `carlos.dev@empresa.com` | `func123` | FUNCIONARIO |

**Importante:** Use exatamente como está (sem espaços, case-sensitive para email)

### 3️⃣ **Servidor não está rodando**

```bash
# Terminal 1 - Iniciar servidor
npm run dev

# Terminal 2 - Fazer login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "senha": "admin123"
  }'
```

### 4️⃣ **JSON com formatação errada**

```bash
# ✅ CORRETO
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","senha":"admin123"}'

# ❌ ERRADO - sem aspas
curl -X POST http://localhost:3001/auth/login \
  -d {email: admin@empresa.com, senha: admin123}
```

---

## 🧪 Diagnosticar o Problema

Execute o script de diagnóstico:

```bash
node diagnostico.js
```

Ele vai:
1. ✅ Verificar se há usuários no banco
2. ✅ Testar o hash bcrypt
3. ✅ Validar a senha admin123
4. ✅ Mostrar informações úteis

---

## ✅ Passo a Passo - Começar do Zero

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar banco de dados

```bash
npm run migrate
```

**Deve mostrar:**
```
✅ Banco de dados inicializado
✅ Tabela setores criada
✅ Tabela usuarios criada
✅ Tabela tarefas criada
✅ Índices criados
✅ Migração concluída com sucesso!
```

### 3. Popular com dados de teste

```bash
npm run seed
```

**Deve mostrar:**
```
✅ Super Admin criado: admin@empresa.com / admin123
✅ Setor TI criado
✅ Gestor TI criado: joao.ti@empresa.com / gestor123
...
✨ Seed concluído com sucesso!
```

### 4. Iniciar o servidor

```bash
npm run dev
```

**Deve mostrar:**
```
✅ Banco de dados conectado
🚀 Servidor rodando em http://localhost:3001
```

### 5. Testar o login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "senha": "admin123"
  }'
```

**Resposta esperada:**
```json
{
  "mensagem": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "xxx-xxx-xxx-xxx",
    "nome": "Super Admin",
    "email": "admin@empresa.com",
    "role": "SUPER_ADMIN",
    "setor_id": null
  }
}
```

---

## 📊 Verificar dados no banco

### Listar todos os usuários:

```bash
node -e "
import { database } from './src/database/connection.js';
await database.init();
const users = await database.all('SELECT email, role FROM usuarios');
console.log(users);
await database.close();
" --input-type=module
```

Ou use um gerenciador SQLite como [DB Browser for SQLite](https://sqlitebrowser.org/)

---

## 🆘 Ainda não funciona?

### Resetar tudo

```bash
# 1. Deletar banco de dados
rm task_management.db  # Linux/Mac
del task_management.db  # Windows

# 2. Recriar do zero
npm run migrate
npm run seed

# 3. Testar
npm run dev
```

### Verificar logs

```bash
# O servidor mostra todos os requests
# Se vir "POST /auth/login" quer dizer que chegou no servidor

# Problemas comuns nos logs:
# - "Token não fornecido" → Esquecer de enviar Authorization
# - "Usuário não encontrado" → Email errado
# - "Senha incorreta" → Senha errada
```

---

## 🎯 Casos de Teste

### ✅ Login com credenciais corretas

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "senha": "admin123"
  }'

# Resposta: 200 OK com token
```

### ❌ Login com email errado

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nao-existe@empresa.com",
    "senha": "admin123"
  }'

# Resposta: 404 Usuário não encontrado ou inativo
```

### ❌ Login com senha errada

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "senha": "senha-errada"
  }'

# Resposta: 401 Senha incorreta
```

### ❌ Email vazio

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "",
    "senha": "admin123"
  }'

# Resposta: 400 Email e senha são obrigatórios
```

---

## 💡 Dicas

1. **Use Postman** para testar mais facilmente (interface gráfica)
2. **Salve o token** em variável: `export TOKEN="token_aqui"`
3. **Use `jq`** para formatar JSON: `curl ... | jq '.'`
4. **Verifique o environment** - certifique-se que NODE_ENV não é 'production'

---

## 📞 Precisa de Ajuda?

1. Execute: `node diagnostico.js`
2. Copie a saída
3. Verifique os 4 requisitos acima
4. Se ainda não funcionar, valide:
   - ✅ npm install executado
   - ✅ npm run migrate executado
   - ✅ npm run seed executado
   - ✅ npm run dev rodando
   - ✅ email exato: `admin@empresa.com`
   - ✅ senha exata: `admin123`

---
