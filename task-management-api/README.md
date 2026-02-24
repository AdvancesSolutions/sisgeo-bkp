# Sistema de Gestão de Tarefas por Setores

API REST para gerenciamento de tarefas com hierarquia de permissões baseada em funções.

## 📋 Estrutura de Permissões

### Super Admin
- Gerencia gestores e setores (escopo global)
- Pode visualizar relatórios gerais
- Flag: `is_superadmin: true`

### Gestor
- Vinculado a um setor específico
- Cria e delega tarefas aos funcionários
- Visualiza apenas tarefas do seu setor
- Não pode visualizar outros setores

### Funcionário
- Visualiza tarefas atribuídas
- Pode atualizar status das tarefas
- Escopo limitado às tarefas atribuídas

## 🚀 Instalação

```bash
npm install
```

## 🔧 Configuração

1. Crie um arquivo `.env` baseado em `.env.example`:

```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente:

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=sua_chave_secreta_super_segura
JWT_EXPIRY=7d
```

3. Inicialize o banco de dados:

```bash
npm run migrate
npm run seed
```

## 🏃 Executar

**Desenvolvimento (com hot reload):**
```bash
npm run dev
```

**Produção:**
```bash
npm start
```

A API estará disponível em `http://localhost:3001`

## 📚 Endpoints

### Autenticação
- `POST /auth/login` - Login de usuário

### Usuários (apenas Super Admin)
- `POST /usuarios` - Criar usuário
- `GET /usuarios` - Listar usuários
- `GET /usuarios/:id` - Obter detalhes do usuário
- `PATCH /usuarios/:id` - Atualizar usuário
- `DELETE /usuarios/:id` - Deletar usuário

### Setores (apenas Super Admin)
- `POST /setores` - Criar setor
- `GET /setores` - Listar setores
- `GET /setores/:id` - Obter detalhes do setor

### Tarefas
- `POST /tarefas` - Criar tarefa (apenas gestor)
- `GET /tarefas` - Listar tarefas (filtrado por setor/atribuição)
- `GET /tarefas/:id` - Obter detalhes da tarefa
- `PATCH /tarefas/:id` - Atualizar tarefa
- `DELETE /tarefas/:id` - Deletar tarefa (apenas criador ou gestor)

## 🔐 Autenticação

A API usa JWT para autenticação. Após o login, inclua o token no header:

```
Authorization: Bearer seu_token_aqui
```

## 📊 Modelo de Dados

### Usuário
```
{
  id: UUID
  nome: String
  email: String
  senha: String (hash)
  role: 'SUPER_ADMIN' | 'GESTOR' | 'FUNCIONARIO'
  setor_id: UUID (NULL para Super Admin)
  is_superadmin: Boolean
  ativo: Boolean
  criado_em: DateTime
  atualizado_em: DateTime
}
```

### Setor
```
{
  id: UUID
  nome: String
  descricao: String
  ativo: Boolean
  criado_em: DateTime
  atualizado_em: DateTime
}
```

### Tarefa
```
{
  id: UUID
  titulo: String
  descricao: String
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA'
  criador_id: UUID
  gestor_id: UUID
  setor_id: UUID
  funcionario_id: UUID
  data_vencimento: DateTime
  criado_em: DateTime
  atualizado_em: DateTime
}
```

## 🧪 Exemplo de Uso

### 1. Super Admin cria um Setor
```bash
curl -X POST http://localhost:3001/setores \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "TI",
    "descricao": "Setor de Tecnologia da Informação"
  }'
```

### 2. Super Admin cria um Gestor para o Setor
```bash
curl -X POST http://localhost:3001/usuarios \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Gestor",
    "email": "joao@empresa.com",
    "senha": "senha_segura",
    "role": "GESTOR",
    "setor_id": "uuid_do_setor"
  }'
```

### 3. Gestor faz login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@empresa.com",
    "senha": "senha_segura"
  }'
```

### 4. Gestor cria uma tarefa
```bash
curl -X POST http://localhost:3001/tarefas \
  -H "Authorization: Bearer gestor_token" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Configurar servidor",
    "descricao": "Configurar novo servidor de produção",
    "prioridade": "ALTA",
    "funcionario_id": "uuid_funcionario",
    "data_vencimento": "2024-12-31T23:59:59Z"
  }'
```

### 5. Funcionário visualiza suas tarefas
```bash
curl -X GET http://localhost:3001/tarefas \
  -H "Authorization: Bearer funcionario_token"
```

### 6. Funcionário atualiza status da tarefa
```bash
curl -X PATCH http://localhost:3001/tarefas/uuid_tarefa \
  -H "Authorization: Bearer funcionario_token" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "EM_ANDAMENTO"
  }'
```

## ⚠️ Segurança

- Todos os endpoints verificam o JWT token
- Permissões são validadas no backend baseadas no role e setor_id
- Senhas são criptografadas com bcrypt
- Gestor só acessa dados do seu setor
- Super Admin tem acesso global

## 📝 Licença

ISC
