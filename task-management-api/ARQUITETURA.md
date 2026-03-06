# 🏗️ Arquitetura e Segurança - Task Management API

## 📐 Arquitetura da Aplicação

### Estrutura de Pastas

```
task-management-api/
├── src/
│   ├── config/           # Configurações (UUID, etc)
│   ├── controllers/      # Lógica de negócio dos endpoints
│   ├── database/         # Conexão, migrações e seed
│   ├── middleware/       # Autenticação, autorização e tratamento de erros
│   ├── models/          # Camada de acesso a dados
│   ├── routes/          # Definição de endpoints
│   └── index.js         # Ponto de entrada da aplicação
├── .env                 # Variáveis de ambiente
├── package.json
│── README.md           # Documentação principal
└── TESTES.md          # Guia de testes
```

### Fluxo de uma Requisição

```
Requisição HTTP
    ↓
Express Middleware (JSON parsing)
    ↓
Autenticação (JWT) - middleware/auth.js
    ↓
Autorização (Role checking) - middleware/auth.js
    ↓
Controller - controllers/*.js
    ↓
Model - models/*.js
    ↓
Database - database/connection.js
    ↓
Resposta JSON
```

---

## 🔐 Segurança

### 1. **Autenticação JWT**

- Tokens JWT assinados com chave secreta
- Expiração configurável (padrão: 7 dias)
- Verificação obrigatória em todos os endpoints essenciais

**Payload do Token:**
```json
{
  "id": "uuid_usuario",
  "nome": "Nome Usuário",
  "email": "email@empresa.com",
  "role": "SUPER_ADMIN|GESTOR|FUNCIONARIO",
  "setor_id": "uuid_setor ou null",
  "is_superadmin": true|false
}
```

### 2. **Controle de Acesso Baseado em Função (RBAC)**

#### Super Admin
- ✅ Gerencia todo o sistema
- ✅ Cria/edita/deleta usuários
- ✅ Cria/edita/deleta setores
- ✅ Visualiza todas as tarefas
- ❌ Vinculado a setor específico
- Flag: `is_superadmin: true`, `setor_id: null`

#### Gestor
- ✅ Cria tarefas no seu setor
- ✅ Delega tarefas a funcionários
- ✅ Visualiza only tarefas do seu setor
- ❌ Acessa dados de outro setor
- ❌ Deleta/edita usuários
- `role: "GESTOR"`, `setor_id: uuid_setor`

#### Funcionário
- ✅ Visualiza tarefas atribuídas
- ✅ Atualiza status das tarefas
- ❌ Cria/edita/deleta tarefas
- ❌ Visualiza tarefas de outro funcionário
- ❌ Acessa configurações do sistema
- `role: "FUNCIONARIO"`, `setor_id: uuid_setor`

### 3. **Validação de Setor**

**Princípio:** Nunca confiar no ID enviado pelo cliente

```javascript
// ❌ INSEGURO - Confia apenas no ID
const tarefas = await database.get(
  'SELECT * FROM tarefas WHERE setor_id = ?',
  [req.body.setor_id]
);

// ✅ SEGURO - Valida contra usuário autenticado
if (!req.user.is_superadmin && req.user.role === 'GESTOR') {
  if (setorIdRequisitado !== req.user.setor_id) {
    return res.status(403).json({ erro: 'Acesso negado' });
  }
}
```

**Exemplos no código:**

- **UsuarioController.js** - Gestor só vê usuários do seu setor
- **TarefaController.js** - Gestor só cria tarefas no seu setor
- **Models** - Filtros sempre por setor quando necessário

### 4. **Criptografia de Senhas**

- Uso de bcryptjs com salt rounds: 10
- Hash irreversível em banco de dados
- Validação via `bcrypt.compare()` no login

```javascript
const senhaHash = await bcrypt.hash(senha, 10);  // Criar
const valida = await bcrypt.compare(senha, hash); // Validar
```

### 5. **Proteção de Rotas**

Middleware aplicado em diferentes níveis:

```javascript
// Apenas autenticado
router.get('/', autenticar, listar);

// Apenas Super Admin
router.post('/', autenticar, superAdminOnly, criar);

// Gestor ou Funcionário
router.patch('/:id', autenticar, gestorOuFuncionarioOnly, atualizar);
```

### 6. **Validação de Entrada**

- Verificação de campos obrigatórios
- Validação de roles permitidos
- Validação de status/prioridade válidos
- Sanitização básica via Express JSON

```javascript
if (!email || !senha || !role) {
  throw new ApiError('Campos obrigatórios faltando', 400);
}

if (!['SUPER_ADMIN', 'GESTOR', 'FUNCIONARIO'].includes(role)) {
  throw new ApiError('Role inválido', 400);
}
```

### 7. **Tratamento de Erros**

- Erros internos não expõem stack trace em produção
- Mensagens de erro específicas e úteis
- Status HTTP apropriados
- Logging centralizado

```javascript
export const tratarErros = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Não expõe detalhes em produção
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};
```

### 8. **Isolamento de Dados**

**Banco de dados:**
- Chaves estrangeiras para integridade referencial
- Índices em campos frequentemente consultados
- Cascata de DELETE para manter integridade

```sql
FOREIGN KEY (setor_id) REFERENCES setores(id)
ON DELETE CASCADE
```

**No código:**
- Models retornam apenas campos necessários
- Filtros garantem isolamento por setor
- Queries parametrizadas contra SQL injection

---

## 🗄️ Modelo de Dados

### Tabela: setores
```sql
CREATE TABLE setores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: usuarios
```sql
CREATE TABLE usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'GESTOR', 'FUNCIONARIO')),
  setor_id TEXT,
  is_superadmin BOOLEAN DEFAULT 0,
  ativo BOOLEAN DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (setor_id) REFERENCES setores(id)
);
```

### Tabela: tarefas
```sql
CREATE TABLE tarefas (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE' 
    CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA')),
  prioridade TEXT DEFAULT 'MEDIA' 
    CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA')),
  criador_id TEXT NOT NULL,
  gestor_id TEXT NOT NULL,
  setor_id TEXT NOT NULL,
  funcionario_id TEXT,
  data_vencimento DATETIME,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (criador_id) REFERENCES usuarios(id),
  FOREIGN KEY (gestor_id) REFERENCES usuarios(id),
  FOREIGN KEY (setor_id) REFERENCES setores(id),
  FOREIGN KEY (funcionario_id) REFERENCES usuarios(id)
);
```

**Índices:**
```sql
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_setor_id ON usuarios(setor_id);
CREATE INDEX idx_tarefas_setor_id ON tarefas(setor_id);
CREATE INDEX idx_tarefas_funcionario_id ON tarefas(funcionario_id);
CREATE INDEX idx_tarefas_gestor_id ON tarefas(gestor_id);
```

---

## 🛣️ Fluxo de Autorização por Role

### Super Admin
```
Requisição → Autenticação → is_superadmin = true? → SIM → Acesso
                                    ↓
                                   NÃO → Erro 403
```

### Gestor
```
Requisição → Autenticação → role = GESTOR? → SIM → setor_id coincide? → SIM → Acesso
                                ↓                          ↓
                               NÃO → Erro 403            NÃO → Erro 403
```

### Funcionário
```
Requisição → Autenticação → role = FUNCIONARIO? → SIM → Só acesso a dados dele → Acesso
                                ↓                                              
                               NÃO → Erro 403                                 
```

---

## 🔧 Variáveis de Ambiente

```env
PORT=3001                              # Porta do servidor
NODE_ENV=development                   # development ou production
JWT_SECRET=chave_super_segura          # Chave para assinar JWT
JWT_EXPIRY=7d                         # Expiração do token
DATABASE=./task_management.db          # Caminho do banco SQLite
```

**Em produção, alterar:**
- `JWT_SECRET` para valor aleatório e seguro
- `NODE_ENV` para `production`
- `DATABASE` para caminho seguro

---

## 📊 Exemplos de Casos de Uso

### 1. Super Admin cria Gestor

```
1. Super Admin faz login → Recebe token com is_superadmin = true
2. Super Admin chama POST /usuarios com role = 'GESTOR'
3. Sistema verifica superAdminOnly middleware ✅
4. Usuário criado com setor_id vinculado
5. Gestor pode fazer login
```

### 2. Gestor cria Tarefa para Funcionário

```
1. Gestor faz login → Token com role = 'GESTOR', setor_id = 'ti'
2. Gestor chama POST /tarefas com funcionario_id = 'func123'
3. Sistema verifica:
   - ✅ Autenticado?
   - ✅ role = GESTOR?
   - ✅ Funcionário pertence ao seu setor?
4. Tarefa criada com setor_id = setor do gestor
5. Funcionário só vê essa tarefa quando faz GET /tarefas
```

### 3. Funcionário tenta ver tarefa de outro funcionário

```
1. Funcionário A obtém token
2. Tenta GET /tarefas/tarefa_de_outro_funcionario
3. Sistema verifica:
   - ✅ Autenticado?
   - ✅ role = FUNCIONARIO?
   - ❌ funcionario_id na tarefa = seu ID? NÃO
4. Retorna 403 Forbidden
```

### 4. Gestor tenta ver outro setor

```
1. Gestor TI obtém token com setor_id = 'ti'
2. Tenta GET /tarefas?setor_id=vendas
3. Sistema verifica validarSetor middleware:
   - ✅ is_superadmin? NÃO
   - ✅ setor_id do request = setor_id do usuário? NÃO
4. Retorna 403 Forbidden
```

---

## ✅ Checklist de Segurança

- [x] Autenticação JWT implementada
- [x] Validação de token em todos os endpoints sensíveis
- [x] Verificação de role/permissão
- [x] Validação de setor para gestores
- [x] Senhas criptografadas com bcrypt
- [x] Queries parametrizadas (proteção contra SQL injection)
- [x] Foreign keys para integridade referencial
- [x] Tratamento centralizado de erros
- [x] Logging de requisições
- [x] Proteção de informações sensíveis em erro 500

---

## 🚀 Deploy em Produção

### Checklist

1. **Ambiente:**
   - [ ] `NODE_ENV=production`
   - [ ] `JWT_SECRET` alterado para valor aleatório forte
   - [ ] `DATABASE` apontando para local seguro

2. **Banco de dados:**
   - [ ] Backup realizado
   - [ ] Foreign keys habilitadas
   - [ ] Índices criados

3. **Servidor:**
   - [ ] HTTPS configurado
   - [ ] CORS configurado se necessário
   - [ ] Rate limiting implementado
   - [ ] Logs centralizados

4. **Segurança:**
   - [ ] Senhas fortes para usuários de produção
   - [ ] Audit de acesso implementado
   - [ ] Plano de disaster recovery

---

## 📚 Referências

- Express.js: https://expressjs.com/
- JWT: https://jwt.io/
- bcryptjs: https://github.com/dcodeIO/bcrypt.js
- SQLite: https://www.sqlite.org/
- OWASP: https://owasp.org/

---
