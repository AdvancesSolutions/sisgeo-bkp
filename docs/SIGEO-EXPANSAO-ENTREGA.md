# SIGEO – Expansão de Escopo – Documento de Entrega

**Tech Lead Fullstack + Product Designer (UX/UI) + Arquiteto de Software**

---

## 1) Atualização de Arquitetura e Fluxo

### Visão geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SIGEO (Monorepo)                                │
├─────────────────┬─────────────────┬─────────────────┬──────────────────────┤
│  apps/web       │  apps/api       │  apps/mobile    │  packages/shared      │
│  React+Vite     │  NestJS         │  Expo RN        │  types/schemas/DTOs   │
│  Tailwind       │  PostgreSQL     │  Consome API    │  Zod, entities       │
│  React Router   │  S3 (fotos)     │  Ponto, fotos   │                      │
└────────┬────────┴────────┬────────┴────────┬────────┴──────────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN/SUPERVISOR (Web)              │  FUNCIONÁRIO (Mobile + Web limitado)  │
│  • Dashboard, KPIs, relatórios       │  • Minhas tarefas                     │
│  • CRUD: employees, locations,       │  • Ponto (check-in/out com GPS)      │
│    areas, service-types, tasks       │  • Iniciar tarefa → foto ANTES       │
│  • Fila de validação (IN_REVIEW)     │  • Concluir tarefa → foto DEPOIS     │
│  • Aprovar/Recusar com comentário    │  • Status da validação (aprovado/    │
│  • Auditoria, audit logs            │    recusado + comentário)            │
│  • Materiais, estoque                │  • Histórico de ponto e tarefas     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de validação por foto

1. **Funcionário (mobile):** Inicia tarefa → tira foto ANTES (GPS) → envia para API.
2. **Funcionário:** Executa serviço → tira foto DEPOIS → envia → status vai para **IN_REVIEW**.
3. **Admin (web):** Acessa **/validation** ou **/tasks/:id** → vê fotos ANTES/DEPOIS lado a lado.
4. **Admin:** **Aprovar** → status **DONE** (audit log).
5. **Admin:** **Recusar** → comentário obrigatório + motivo → status **IN_PROGRESS** (ou PENDING); audit log.
6. **Funcionário (mobile):** Vê "Recusado" + comentário → pode refazer e reenviar.

### Regra de status na recusa

- **Recusar** → tarefa volta para **IN_PROGRESS** (funcionário pode corrigir e reenviar para validação).
- Alternativa documentada: **PENDING** se a política exigir reatribuição.

---

## 2) Matriz de Permissões (RBAC) – Web e Mobile

### Perfis

| Perfil        | Descrição |
|---------------|-----------|
| **ADMIN**     | Gerencia tudo, valida serviços, relatórios, auditoria. |
| **FUNCIONARIO** | Apenas suas tarefas, ponto, registro de serviço (fotos), histórico. |

### Web – Matriz de acesso por rota

| Rota            | ADMIN | FUNCIONARIO |
|-----------------|-------|-------------|
| /login          | ✅    | ✅          |
| /dashboard      | ✅    | ✅ (KPIs limitados) |
| /employees      | ✅ CRUD | ❌ (ou só leitura própria) |
| /locations      | ✅ CRUD | ❌ |
| /areas          | ✅ CRUD | ❌ |
| /service-types  | ✅ CRUD | ❌ |
| /tasks          | ✅ CRUD | ✅ (só minhas tarefas) |
| /tasks/:id      | ✅    | ✅ (só se for minha) |
| /validation     | ✅    | ❌ |
| /materials      | ✅ CRUD | ❌ (ou só consulta) |
| /timeclock      | ✅ (todos) | ✅ (só meu) |
| /reports        | ✅    | ❌ |
| /audit          | ✅    | ❌ |

### Mobile – Matriz por tela

| Tela / Ação           | ADMIN | FUNCIONARIO |
|-----------------------|-------|-------------|
| Login                 | ✅    | ✅          |
| Home                  | ✅    | ✅          |
| Minhas tarefas        | ✅    | ✅          |
| Detalhe tarefa        | ✅    | ✅          |
| Foto antes/depois     | ✅    | ✅          |
| Ponto (check-in/out)  | ✅    | ✅          |
| Status da validação   | ✅    | ✅          |
| Fila de validação     | ✅    | ❌          |
| Resumo/KPIs           | ✅    | ❌          |

---

## 3) Lista de Páginas Web com Checklist

| Página        | Rota           | Done | Observação |
|---------------|----------------|------|------------|
| Login         | /login         | ✅   | JWT + refresh, role no user |
| Dashboard     | /dashboard     | ✅   | KPIs, pendências, atalhos |
| Funcionários  | /employees     | ✅   | CRUD + filtros |
| Locais        | /locations     | ✅   | CRUD + lat/lng/radius |
| Áreas         | /areas         | ✅   | CRUD + vínculo location |
| Tipos de serviço | /service-types | ✅ | CRUD + checklists |
| Tarefas       | /tasks         | ✅   | CRUD + atribuir + status + SLA |
| Validação     | /validation    | ✅   | Fila IN_REVIEW, aprovar/recusar |
| Detalhe tarefa | /tasks/:id   | ✅   | Timeline, fotos antes/depois, checklist, logs |
| Materiais     | /materials     | ✅   | CRUD + estoque + movimentações |
| Relatórios    | /reports       | ✅   | KPIs, produtividade, ponto |
| Auditoria     | /audit         | ✅   | Logs com filtros |
| Ponto         | /timeclock     | ✅   | Listagem por funcionário |

**Requisitos de UI:** Tailwind, Sidebar + Topbar, componentes reutilizáveis, loading/empty/error, responsivo, **Lucide React** em toda a web.

---

## 4) Wireframe Textual – 3 Páginas Críticas

### /validation

- **Topo:** Título "Fila de validação", subtítulo "Tarefas aguardando aprovação (IN_REVIEW)".
- **Filtros (opcional):** Data, funcionário.
- **Lista/Cards:** Cada item = uma tarefa IN_REVIEW.
  - ID/título da tarefa, funcionário, data/hora conclusão.
  - **Miniaturas:** Foto ANTES | Foto DEPOIS (lado a lado).
  - Botões: **Aprovar** (verde), **Recusar** (vermelho).
- **Ao clicar em item (ou expandir):** Detalhe completo: fotos grandes, GPS, checklist, materiais, comentário do funcionário.
- **Modal Aprovar:** Confirmação "Aprovar serviço? Status → DONE." [Cancelar] [Aprovar].
- **Modal Recusar:** Campo comentário (obrigatório), select motivo (ex.: Foto inadequada, Checklist incompleto). [Cancelar] [Recusar]. Ao recusar: status → IN_PROGRESS; audit log.

### /tasks/:id

- **Cabeçalho:** Título da tarefa, badge status (PENDING / IN_PROGRESS / IN_REVIEW / DONE / REJECTED), botão Editar (se ADMIN).
- **Abas ou seções:** Resumo | Fotos | Checklist | Materiais | Timeline/Auditoria.
- **Resumo:** Área, local, funcionário, data agendada, descrição.
- **Fotos:** Dois cards lado a lado: **Antes** (imagem + data/hora + GPS) | **Depois** (idem). Se ainda não houver foto, estado vazio.
- **Checklist:** Itens configurados + status (feito/não feito) se houver.
- **Materiais:** Consumidos na tarefa (se houver).
- **Timeline/Auditoria:** Lista de eventos (iniciado, fotos enviadas, em validação, aprovado/recusado por X em data).
- **Ações (se IN_REVIEW):** [Aprovar] [Recusar] (mesmo fluxo do /validation).

### /dashboard

- **Topo:** "Dashboard", saudação + nome do usuário, role (badge).
- **KPIs (cards):** Tarefas pendentes, Em validação (IN_REVIEW), Tarefas concluídas (hoje/semana), Funcionários ativos, Alertas SLA (se houver).
- **Pendências:** Lista resumida "Tarefas aguardando validação" (link para /validation) e "Tarefas atrasadas".
- **Atalhos:** Cards/botões para Tarefas, Validação, Ponto, Relatórios (conforme permissão).
- **Gráfico opcional:** Produtividade (tarefas por dia) ou ocupação por área (mock ou API futura).

---

## 5) Componentes UI (Tailwind + Lucide)

- **Button:** variantes primary, secondary, danger, ghost; ícone opcional (Lucide).
- **Input, Select, Textarea:** label, error, disabled.
- **Modal / Drawer:** overlay, título, footer com ações.
- **DataTable:** cabeçalho, linhas, loading, empty, paginação.
- **Badge:** status (cor por status), role (ADMIN/FUNCIONARIO).
- **Tabs:** abas horizontais.
- **Toast:** sucesso/erro/info (context ou lib leve).
- **ConfirmDialog:** título, mensagem, [Cancelar] [Confirmar].
- **Empty state:** ícone Lucide + texto + CTA opcional.
- **Sidebar:** ícones Lucide por item; itens visíveis conforme role.

Exemplos de ícones Lucide: LayoutDashboard, Users, MapPin, Layers, ClipboardList, CheckSquare, Package, Clock, FileText, ShieldCheck.

---

## 6) Endpoints e Contratos

### Auth

- **POST /auth/login**  
  Body: `{ email, password }`  
  Response: `{ accessToken, refreshToken, expiresIn, user: { id, name, email, role } }`

- **POST /auth/refresh**  
  Body: `{ refreshToken }`  
  Response: igual ao login.

- **GET /auth/me** (ou /me)  
  Headers: `Authorization: Bearer <token>`  
  Response: `{ id, name, email, role }`

### Tasks

- **GET /tasks**  
  Query: page, limit, status?, employeeId? (FUNCIONARIO: filtrar por employeeId do token).  
  Response: `{ data: Task[], total, totalPages }`

- **GET /tasks/:id**  
  Response: Task + fotos (urls antes/depois) + checklist + materiais + últimos audit logs (ou endpoint separado).

- **POST /tasks**  
  Body: TaskInput (areaId, employeeId?, scheduledDate, title?, description?).

- **PATCH /tasks/:id**  
  Body: TaskUpdateInput (status, etc.).

- **POST /tasks/:id/approve**  
  Body: opcional comentário.  
  Response: Task atualizado (status DONE). Audit: userId, ação approve, statusAnterior IN_REVIEW, statusNovo DONE.

- **POST /tasks/:id/reject**  
  Body: `{ comment: string, reason?: string }` (comment obrigatório).  
  Response: Task (status IN_PROGRESS). Audit: userId, ação reject, payload comment/reason.

### Validation

- **GET /validation/queue**  
  Response: lista de tarefas com status IN_REVIEW (com fotos e resumo). Só ADMIN.

### Photos / Upload

- **POST /upload/photo**  
  Multipart: file, taskId, type (BEFORE | AFTER), timestamp, deviceId, lat?, lng?.  
  Response: `{ url, key }`. Salvar em S3; path: photos/{taskId}/{type}/...

### TimeClock

- **POST /time-clock/checkin**  
  Body: { employeeId, lat?, lng? }.

- **POST /time-clock/checkout**  
  Body: { employeeId, lat?, lng? }.

- **GET /time-clock/employee/:id**  
  Query: limit.  
  Response: TimeClock[].

### Audit

- **GET /audit**  
  Query: entity?, entityId?, userId?, action?, from?, to?, page, limit.  
  Response: { data: AuditLog[], total, totalPages }.

---

## 7) Backlog de Inovações (Priorizado)

| Inovação                          | Valor | Esforço | Dependências     | Fase |
|----------------------------------|-------|---------|-------------------|------|
| QR Code/NFC por área             | Alto  | Médio   | Hardware/App      | V1   |
| Score antifraude (GPS+tempo+foto)| Alto  | Alto    | Dados históricos  | V2   |
| Checklist inteligente por local | Médio | Médio   | Config por área   | V1   |
| OCR/IA na foto                   | Alto  | Alto    | Modelo/API        | V2   |
| Geofence polígono                | Médio | Médio   | Mapas             | V1   |
| Timeline/trilha auditoria visual| Alto  | Baixo   | Audit log         | MVP  |
| SLA e alertas (push/email/WA)   | Alto  | Médio   | Notificações      | V1   |
| Roteirização do dia (mapa)      | Médio | Alto    | Mapas, tarefas    | V2   |
| Modo Cliente/Recepção (aceite)  | Alto  | Médio   | Assinatura        | V1   |
| Exportação BI / PDF              | Médio | Médio   | Relatórios        | V1   |
| Offline robusto + conflitos     | Alto  | Alto    | Sync strategy     | V2   |
| Multi-tenant                     | Alto  | Alto    | Auth + schema     | V2   |

---

## 8) Próximos Passos (Ordem de Implementação)

1. **Shared:** Roles (ADMIN, FUNCIONARIO), DTOs de approve/reject, tipos de fotos por tarefa.
2. **API:** GET /auth/me, RolesGuard, filtro tasks por role; endpoints approve/reject; persistir e listar fotos por tarefa (path S3 ou tabela task_photos); audit em approve/reject.
3. **Web:** Instalar lucide-react; componentes Button, Input, DataTable, Modal, Badge, Toast; Sidebar/Topbar com Lucide e itens por role; ProtectedRoute por role; GET /me e user.role no AuthContext.
4. **Web:** Concluir Dashboard (KPIs mock/API), Validation (fila + aprovar/recusar + modal), TaskDetail (/tasks/:id com fotos, timeline, ações); Employees, Locations, Areas, Materials, Audit, TimeClock, ServiceTypes, Reports com CRUD ou listagem completa.
5. **Mobile:** Incluir role no login e no AuthContext; tela "Status da validação" (aprovado/recusado + comentário); para ADMIN: tela "Fila de validação" e "Resumo"; guard por role nas rotas.

---

*Documento gerado como parte da expansão de escopo do SIGEO. Implementação alinhada a este documento.*
