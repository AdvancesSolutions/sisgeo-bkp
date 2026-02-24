# 📊 Sistema de Gestão de Tarefas por Setores - Estrutura Completa

## 🎯 Objetivo

Implementar um sistema de gestão de tarefas com hierarquia de permissões em três níveis (Super Admin, Gestor, Funcionário) com isolamento de dados por setor.

## 📁 Estrutura do Projeto

```
task-management-api/
│
├── 📄 package.json              # Dependências e scripts
├── 📄 .env                      # Variáveis de ambiente
├── 📄 .env.example              # Exemplo de configuração
├── 📄 .gitignore               # Git ignore
│
├── 📖 README.md                # Documentação principal
├── 📖 TESTES.md                # Guia de testes com cURL
├── 📖 ARQUITETURA.md           # Arquitetura e segurança
├── 📖 QUICKSTART.md            # Este arquivo
│
├── 🔧 setup.sh                 # Script de setup automático
│
└── 📁 src/
    │
    ├── 📄 index.js             # Ponto de entrada (Express app)
    │
    ├── 📁 config/
    │   └── 📄 uuid.js          # Gerador de UUID
    │
    ├── 📁 database/
    │   ├── 📄 connection.js     # Conexão com SQLite
    │   ├── 📄 migrate.js        # Criação de tabelas
    │   └── 📄 seed.js          # Dados iniciais de teste
    │
    ├── 📁 middleware/
    │   ├── 📄 auth.js          # JWT e autorização
    │   └── 📄 erros.js         # Tratamento de erros
    │
    ├── 📁 models/
    │   ├── 📄 Usuario.js       # Model de usuário
    │   ├── 📄 Setor.js         # Model de setor
    │   └── 📄 Tarefa.js        # Model de tarefa
    │
    ├── 📁 controllers/
    │   ├── 📄 AuthController.js    # Login e perfil
    │   ├── 📄 UsuarioController.js # CRUD de usuários
    │   ├── 📄 SetorController.js   # CRUD de setores
    │   └── 📄 TarefaController.js  # CRUD de tarefas
    │
    └── 📁 routes/
        ├── 📄 auth.js         # Rotas de autenticação
        ├── 📄 usuarios.js      # Rotas de usuários
        ├── 📄 setores.js       # Rotas de setores
        └── 📄 tarefas.js       # Rotas de tarefas
```

## 🏗️ Arquitetura de Permissões

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN (is_superadmin: true)             │
│  ✅ Gerencia todo sistema    ◀────────── Setor: NULL            │
│  ✅ Cria/Edita/Deleta qualquer coisa                            │
│  ✅ Acesso global                                               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
    ┌──────────────────────┐ ┌──────────────────────┐
    │ GESTOR - Setor TI    │ │ GESTOR - Setor RH    │
    │ (role: GESTOR)       │ │ (role: GESTOR)       │
    │ ✅ Cria tarefas      │ │ ✅ Cria tarefas      │
    │ ✅ Delega funciona   │ │ ✅ Delega funciona   │
    │ ✅ Vê TI apenas      │ │ ✅ Vê RH apenas      │
    │ ❌ Vê Vendas         │ │ ❌ Vê TI/Vendas      │
    └──────────────────────┘ └──────────────────────┘
             │                          │
        ┌────┴────┐                 ┌───┴────┐
        │          │                 │         │
        ▼          ▼                 ▼         ▼
    ┌─────┐   ┌─────┐           ┌─────┐  ┌─────┐
    │Func1│   │Func2│           │Func3│  │Func4│
    │FUNC │   │FUNC │           │FUNC │  │FUNC │
    │     │   │     │           │     │  │     │
    │✅ Vê├──┼──┼─┤ │     ✅ Vê├──┼──┼─┤ │
    │   tarefas     │   │       ├─ suas├─┤
    │   dele        │   │       │tarefas│
    │❌ Vê de   │   │
    │   outro   │   │
    └─────┘   └─────┘           └─────┘  └─────┘
```

## 🔄 Fluxo de Requisição

```
1. Cliente envia requisição HTTP
   │
   ├─ POST /auth/login                     → AuthController.login()
   │  └─ Sem JWT (acesso público)
   │
   ├─ GET /usuarios          ────────────────┐
   ├─ POST /tarefas          ─────┐          │
   ├─ PATCH /tarefas/:id     ─────┼──────────┤
   └─ GET  /tarefas/stats    ─────┘          │
                                  │          │
2. Express extrai header Authorization      │
   │                                        │
3. Middleware (auth.js):                   │
   ├─ autenticar()           ◀──────────────┘
   │  └─ Verifica JWT
   │     └─ Retorna 401 se inválido
   │
   ├─ superAdminOnly()       ◀─ POST /setores
   │  └─ Verifica is_superadmin
   │
   ├─ gestorOnly()           ◀─ POST /tarefas
   │  └─ Verifica role='GESTOR'
   │
   ├─ gestorOuFuncionarioOnly() ◀─ GET /tarefas
   │  └─ Verifica role in ['GESTOR', 'FUNCIONARIO']
   │
   ├─ validarSetor()         (futuro)
   │  └─ Verifica se setor_id coincide
   │
4. Controller trata lógica
   │
   ├─ Valida inputs
   ├─ Acessa Model
   └─ Retorna resposta
   │
5. Middleware (erros.js):
   └─ tratarErros() captura erros

```

## 📝 Casos de Uso Principais

### 🔐 Caso 1: Super Admin cria Gestor

```sql
Super Admin (admin@empresa.com/admin123)
  ↓
login → token com is_superadmin=true
  ↓
POST /usuarios {
  nome: "João",
  email: "joao.ti@empresa.com",
  senha: "...",
  role: "GESTOR",
  setor_id: "uuid_setor_ti"
}
  ↓
UsuarioController.criarUsuario() verifica:
  ✅ req.user.is_superadmin === true
  ✅ role válido
  ✅ setor_id existe
  ↓
Usuario criado com role GESTOR vinculado ao Setor TI
```

### 📋 Caso 2: Gestor cria Tarefa

```sql
Gestor TI (joao.ti@empresa.com/gestor123)
  ↓
login → token com role='GESTOR', setor_id='ti'
  ↓
POST /tarefas {
  titulo: "Implementar API",
  funcionario_id: "uuid_carlos",
  prioridade: "ALTA"
}
  ↓
TarefaController.criarTarefa() verifica:
  ✅ autenticar: token válido
  ✅ gestorOnly: role === 'GESTOR'
  ✅ Funcionário pertence ao setor 'ti'
  ↓
Tarefa criada:
  - criador_id = Gestor
  - gestor_id = Gestor
  - setor_id = 'ti' (do gestor)
  - funcionario_id = Carlos
```

### ✅ Caso 3: Funcionário atualiza Tarefa

```sql
Funcionário Carlos (carlos.dev@empresa.com/func123)
  ↓
login → token com role='FUNCIONARIO', setor_id='ti'
  ↓
PATCH /tarefas/uuid_tarefa {
  status: "EM_ANDAMENTO"
}
  ↓
TarefaController.atualizarTarefa() verifica:
  ✅ autenticar: token válido
  ✅ gestorOuFuncionarioOnly: role in ['GESTOR', 'FUNCIONARIO']
  ✅ tarefa.funcionario_id === req.user.id
  ✅ Apenas status pode ser alterado
  ↓
Tarefa atualizada com novo status
```

### ❌ Caso 4: Funcionário tenta acessar outro setor

```sql
Funcionário Carlos (TI)
  ↓
GET /tarefas?setor_id=rh
  ↓
TarefaController.listarTarefas() verifica:
  ✅ autenticar: token válido
  ✅ gestorOuFuncionarioOnly: ok
  ❌ NEGA: você é FUNCIONARIO
     => Apenas suas tarefas retornadas
     => Filtro é automaticamente seu ID
```

## 🗄️ Modelo de Dados

### Relacionamentos

```
SETORES
  │
  ├─── USUARIOS (setor_id FK)
  │     ├─ Super Admin (setor_id: NULL)
  │     ├─ Gestor (setor_id: uuid_setor)
  │     └─ Funcionário (setor_id: uuid_setor)
  │
  └─── TAREFAS (setor_id FK)
        ├─ criador_id → USUARIOS (quem criou)
        ├─ gestor_id → USUARIOS (gestor responsável)
        └─ funcionario_id → USUARIOS (quem executa)
```

### Campos Importantes

**USUARIOS:**
- `role`: SUPER_ADMIN | GESTOR | FUNCIONARIO
- `setor_id`: NULL para admin, UUID para gestor/funcionário
- `is_superadmin`: true/false (redundante com role, mas útil na query)
- `senha`: hash bcrypt

**TAREFAS:**
- `status`: PENDENTE | EM_ANDAMENTO | CONCLUIDA | CANCELADA
- `prioridade`: BAIXA | MEDIA | ALTA
- `setor_id`: Garante isolamento por setor

## 🔍 Validações de Segurança

```javascript
// 1. Autenticação
if (!token) → 401 Unauthorized

// 2. Autorização por Role
if (role !== required_role) → 403 Forbidden

// 3. Isolamento por Setor (Gestor)
if (!isSuperAdmin && userSetorId !== requestSetorId) → 403 Forbidden

// 4. Isolamento por Tarefa (Funcionário)
if (role === FUNCIONARIO && taskFuncionarioId !== userId) → 403 Forbidden

// 5. Validação de Entrada
if (invalidRole || missingRequired) → 400 Bad Request

// 6. SQL Injection Protection
Query via parametros → NÃO via string concatenation
```

## 🚀 Comandos Rápidos

```bash
# Setup
npm install
npm run migrate
npm run seed

# Desenvolvimento
npm run dev

# Testes
npm run seed              # Reinicializar dados
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/tarefas

# Produção
NODE_ENV=production npm start
```

## 📊 Resumo de Endpoints

| Endpoint | Método | Super Admin | Gestor | Funcionário |
|----------|--------|:----------:|:------:|:-----------:|
| /auth/login | POST | ✅ | ✅ | ✅ |
| /usuarios | POST | ✅ | ❌ | ❌ |
| /usuarios | GET | ✅ | ✅* | ❌ |
| /setores | POST | ✅ | ❌ | ❌ |
| /setores | GET | ✅ | ✅ | ✅ |
| /tarefas | POST | ❌ | ✅ | ❌ |
| /tarefas | GET | ✅ | ✅* | ✅** |
| /tarefas/:id | PATCH | ❌ | ✅ | ✅*** |
| /tarefas/stats | GET | ❌ | ✅ | ❌ |

*Gestor vê apenas seu setor  
**Funcionário vê apenas suas tarefas  
***Funcionário só atualiza status

## 💡 Padrões Implementados

✅ **MVC**: Models, Controllers, Routes separados  
✅ **Middleware**: Autenticação e autorização centralizadas  
✅ **Error Handling**: Classe ApiError customizada  
✅ **Logging**: Todas as requisições logadas  
✅ **RBAC**: Role-Based Access Control  
✅ **Isolation**: Dados isolados por setor  
✅ **JWT**: Tokens assinados e com expiração  
✅ **Password Hash**: bcryptjs com salt 10  
✅ **SQL Injection Protection**: Queries parametrizadas  

## 📚 Documentação Completa

- **README.md** - Guia de instalação e uso
- **TESTES.md** - 20+ exemplos de cURL para testar
- **ARQUITETURA.md** - Detalhes de segurança e design
- **Comentários no código** - Explicações inline

Aproveite! 🎉
