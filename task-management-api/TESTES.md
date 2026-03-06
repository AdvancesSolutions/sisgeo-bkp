# 🧪 Guia de Testes - Task Management API

Este documento contém exemplos de como testar a API usando cURL ou Postman.

## 📋 Sumário

1. [Setup inicial](#setup-inicial)
2. [Autenticação](#autenticação)
3. [Testando Endpoints](#testando-endpoints)

---

## Setup Inicial

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar banco de dados

```bash
npm run migrate
```

### 3. Popular banco com dados de teste

```bash
npm run seed
```

### 4. Iniciar servidor

```bash
npm run dev
```

Server estará disponível em: `http://localhost:3001`

---

## 🔐 Autenticação

Todos os endpoints (exceto `/auth/login`) requerem um token JWT no header:

```
Authorization: Bearer <seu_token>
```

### Login - Super Admin

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
    "id": "xxx",
    "nome": "Super Admin",
    "email": "admin@empresa.com",
    "role": "SUPER_ADMIN",
    "setor_id": null
  }
}
```

**Salve o token para usar nos próximos requests:**
```bash
export TOKEN="seu_token_aqui"
```

### Login - Gestor

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.ti@empresa.com",
    "senha": "gestor123"
  }'
```

### Login - Funcionário

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carlos.dev@empresa.com",
    "senha": "func123"
  }'
```

---

## 🧪 Testando Endpoints

### 1. **Super Admin - Criar Setor**

```bash
curl -X POST http://localhost:3001/setores \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Operações",
    "descricao": "Setor de Operações"
  }'
```

### 2. **Super Admin - Criar Usuário (Gestor)**

Primeiro, pegue o ID do setor criado acima e substitua em `setor_id`:

```bash
curl -X POST http://localhost:3001/usuarios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Gestor",
    "email": "joao.novo@empresa.com",
    "senha": "gestor456",
    "role": "GESTOR",
    "setor_id": "uuid_do_setor"
  }'
```

### 3. **Super Admin - Listar Usuários**

```bash
curl -X GET http://localhost:3001/usuarios \
  -H "Authorization: Bearer $TOKEN"
```

### 4. **Super Admin - Listar Setores**

```bash
curl -X GET http://localhost:3001/setores \
  -H "Authorization: Bearer $TOKEN"
```

### 5. **Gestor - Criar Tarefa**

Login como gestor primeiro e pegue seu token:

```bash
# Login como gestor
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.ti@empresa.com",
    "senha": "gestor123"
  }'

# Use o token retornado
export GESTOR_TOKEN="token_aqui"

# Criar tarefa (precisa do ID do funcionário)
curl -X POST http://localhost:3001/tarefas \
  -H "Authorization: Bearer $GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Nova tarefa importante",
    "descricao": "Descrição da tarefa",
    "prioridade": "ALTA",
    "funcionario_id": "uuid_do_funcionario",
    "data_vencimento": "2024-12-31T23:59:59Z"
  }'
```

### 6. **Gestor - Listar Tarefas do Setor**

```bash
curl -X GET http://localhost:3001/tarefas \
  -H "Authorization: Bearer $GESTOR_TOKEN"
```

### 7. **Gestor - Obter Estatísticas do Setor**

```bash
curl -X GET http://localhost:3001/tarefas/stats \
  -H "Authorization: Bearer $GESTOR_TOKEN"
```

### 8. **Funcionário - Listar Suas Tarefas**

```bash
# Login como funcionário
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carlos.dev@empresa.com",
    "senha": "func123"
  }'

export FUNC_TOKEN="token_aqui"

# Listar tarefas atribuídas
curl -X GET http://localhost:3001/tarefas \
  -H "Authorization: Bearer $FUNC_TOKEN"
```

### 9. **Funcionário - Atualizar Status da Tarefa**

```bash
curl -X PATCH http://localhost:3001/tarefas/uuid_da_tarefa \
  -H "Authorization: Bearer $FUNC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "EM_ANDAMENTO"
  }'
```

### 10. **Funcionário - Obter Detalhes da Tarefa**

```bash
curl -X GET http://localhost:3001/tarefas/uuid_da_tarefa \
  -H "Authorization: Bearer $FUNC_TOKEN"
```

---

## 📊 Valores de Enum

### Status da Tarefa
- `PENDENTE`
- `EM_ANDAMENTO`
- `CONCLUIDA`
- `CANCELADA`

### Prioridade
- `BAIXA`
- `MEDIA`
- `ALTA`

### Role
- `SUPER_ADMIN`
- `GESTOR`
- `FUNCIONARIO`

---

## 🚫 Testando Restrições de Segurança

### Gestor tentando acessar outro setor

```bash
# Isso deve retornar 403 Forbidden
curl -X GET "http://localhost:3001/tarefas?setor_id=outro_setor_id" \
  -H "Authorization: Bearer $GESTOR_TOKEN"
```

### Funcionário tentando atualizar campo que não deve

```bash
# Isso deve retornar erro, funcionário só pode alterar status
curl -X PATCH http://localhost:3001/tarefas/uuid_da_tarefa \
  -H "Authorization: Bearer $FUNC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Novo título"
  }'
```

### Funcionário tentando criar tarefa

```bash
# Isso deve retornar 403 Forbidden
curl -X POST http://localhost:3001/tarefas \
  -H "Authorization: Bearer $FUNC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Tarefa",
    "funcionario_id": "uuid"
  }'
```

---

## 📍 Endpoints Disponíveis

| Método | Endpoint | Permissão | Descrição |
|--------|----------|-----------|-----------|
| POST | `/auth/login` | Público | Fazer login |
| GET | `/auth/perfil` | Autenticado | Obter perfil do usuário |
| POST | `/usuarios` | Super Admin | Criar novo usuário |
| GET | `/usuarios` | Super Admin / Gestor | Listar usuários |
| GET | `/usuarios/:id` | Autenticado | Obter detalhes do usuário |
| PATCH | `/usuarios/:id` | Super Admin | Atualizar usuário |
| DELETE | `/usuarios/:id` | Super Admin | Deletar usuário |
| POST | `/setores` | Super Admin | Criar setor |
| GET | `/setores` | Autenticado | Listar setores |
| GET | `/setores/:id` | Autenticado | Obter detalhes do setor |
| PATCH | `/setores/:id` | Super Admin | Atualizar setor |
| DELETE | `/setores/:id` | Super Admin | Deletar setor |
| POST | `/tarefas` | Gestor | Criar tarefa |
| GET | `/tarefas` | Gestor / Funcionário | Listar tarefas |
| GET | `/tarefas/:id` | Gestor / Funcionário | Obter tarefa |
| PATCH | `/tarefas/:id` | Gestor / Funcionário | Atualizar tarefa |
| DELETE | `/tarefas/:id` | Gestor | Deletar tarefa |
| GET | `/tarefas/stats` | Gestor | Obter estatísticas |

---

## 💡 Dicas

1. **Use variáveis de ambiente no cURL:** Salve tokens em variáveis (`export TOKEN="..."`)

2. **Formate JSON:** Use ferramentas como `jq` para formatar respostas:
   ```bash
   curl ... | jq '.'
   ```

3. **Postman:** Importe os endpoints como uma collection para facilitar testes

4. **Logs:** O servidor exibe logs de todas as requisições

5. **Timestamps:** As respostas incluem `criado_em` e `atualizado_em` em ISO 8601

---

## 🐛 Troubleshooting

### Erro: "Token inválido ou expirado"
- Verifique se o token está correto
- Tokens expiram em 7 dias por padrão (configurável em `.env`)

### Erro: "Acesso negado"
- Verifique se o usuário tem a permissão correta
- Gestores só podem acessar seu próprio setor

### Erro: "Campo obrigatório"
- Verifique se todos os campos obrigatórios foram enviados
- Consulte a documentação do endpoint

---
