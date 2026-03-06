# Regras de negócio – SIGEO (Gestão Operacional)

Documento das principais regras de negócio sugeridas para o sistema, organizadas por domínio. As marcadas com ✅ já estão (total ou parcialmente) no código; as demais são recomendações para implementação.

---

## 1. Tarefas (Tasks)

| ID | Regra | Prioridade | Status |
|----|--------|------------|--------|
| T1 | **Status permitidos:** PENDING → IN_PROGRESS → IN_REVIEW → DONE. Transições inversas só em casos excepcionais (ex.: reabertura por admin). | Alta | ✅ Parcial |
| T2 | Apenas tarefas com status **IN_REVIEW** podem ser aprovadas ou rejeitadas. | Alta | ✅ |
| T3 | Ao **aprovar**: status → DONE; registrar em auditoria (quem, quando). | Alta | ✅ |
| T4 | Ao **rejeitar**: status → IN_PROGRESS; obrigatório informar comentário (e opcionalmente motivo); registrar rejectedBy, rejectedAt, rejectedComment. | Alta | ✅ |
| T5 | Tarefa só pode ir para **IN_REVIEW** se tiver pelo menos uma foto (BEFORE ou AFTER), conforme política da empresa (ex.: mínimo 1 BEFORE e 1 AFTER). | Alta | Sugerido |
| T6 | **Data agendada** não pode ser no passado ao criar tarefa (ou permitir com alerta/configuração). | Média | Sugerido |
| T7 | **Funcionário** só pode ser atribuído a tarefa se estiver ACTIVE e (opcional) vinculado à mesma unidade/local da área. | Média | ✅ |
| T8 | **Área** da tarefa deve existir e estar vinculada a um local ativo. | Alta | Sugerido |
| T9 | Funcionário só enxerga/edita **suas** tarefas (filtro por employeeId = usuário logado); admin enxerga todas. | Alta | ✅ (RBAC) |
| T10 | Não permitir **excluir** tarefa com status DONE (ou exigir motivo + auditoria). | Média | Sugerido |

---

## 2. Fotos de tarefa (TaskPhotos)

| ID | Regra | Prioridade | Status |
|----|--------|------------|--------|
| F1 | **Tipos permitidos:** BEFORE (antes do serviço) e AFTER (depois do serviço). | Alta | ✅ |
| F2 | Upload de foto só para tarefa em PENDING ou IN_PROGRESS. | Alta | Sugerido |
| F3 | Ao adicionar foto em tarefa PENDING/IN_PROGRESS, atualizar status para IN_PROGRESS (se ainda não estiver). | Média | Sugerido |
| F4 | Tarefa só pode ser enviada para validação (IN_REVIEW) se atender critério mínimo de fotos (ex.: ≥ 1 BEFORE e ≥ 1 AFTER). | Alta | Sugerido |
| F5 | Limite de fotos por tarefa (ex.: máx. 10) e por tipo (ex.: máx. 5 BEFORE, 5 AFTER) para evitar abuso. | Média | Sugerido |

---

## 3. Funcionários (Employees)

| ID | Regra | Prioridade | Status |
|----|--------|------------|--------|
| E1 | **Status:** ACTIVE ou INACTIVE. Funcionário INACTIVE não pode ser atribuído a novas tarefas. | Alta | ✅ (campo existe) |
| E2 | **CPF** único por funcionário (e opcionalmente no sistema), formato válido (11 dígitos). | Alta | ✅ |
| E3 | Funcionário deve estar vinculado a uma **unidade** (unitId) existente (location ou outro agrupamento). | Alta | Sugerido |
| E4 | Ao inativar funcionário, tarefas futuras (scheduled_date > hoje) podem ser reatribuídas ou mantidas conforme política. | Média | Sugerido |
| E5 | Não permitir excluir funcionário com tarefas vinculadas (ou soft delete + histórico). | Média | Sugerido |

---

## 4. Ponto (TimeClock)

| ID | Regra | Prioridade | Status |
|----|--------|------------|--------|
| P1 | **Tipos** típicos: ENTRADA, SAIDA, INICIO_ALMOCO, FIM_ALMOCO (definir lista fixa ou configurável). | Alta | Sugerido |
| P2 | Sequência lógica: não permitir SAIDA sem ENTRADA no mesmo dia; validar ordem (ex.: FIM_ALMOCO após INICIO_ALMOCO). | Média | Sugerido |
| P3 | Um único registro de **ENTRADA** por dia por funcionário (ou permitir múltiplos conforme política). | Média | Sugerido |
| P4 | **Geolocalização** (lat/lng): opcional; se obrigatória, validar que está dentro do raio do local (Location.radius). | Baixa | Sugerido |
| P5 | Apenas o próprio funcionário (ou admin) pode registrar ponto para aquele employeeId. | Alta | Sugerido |

---

## 5. Materiais (Materials)

| ID | Regra | Prioridade | Status |
|----|--------|------------|--------|
| M1 | **Estoque** não pode ficar negativo. Ao dar baixa, validar quantidade disponível. | Alta | Sugerido |
| M2 | **Unidade** de medida padronizada (UN, CX, KG, L, M², etc.) – lista fixa ou cadastro de unidades. | Média | Sugerido |
| M3 | Movimentações de estoque (entrada/saída) devem ser registradas em auditoria ou tabela de movimentação. | Alta | Sugerido |
| M4 | Não permitir excluir material com movimentação histórica (ou soft delete). | Média | Sugerido |

---

## 6. Locais e Áreas (Locations, Areas)

| ID | Regra | Prioridade | Status |
|----|--------|------------|--------|
| L1 | **Área** pertence a um único **Local** (locationId). Local deve existir ao criar/editar área. | Alta | ✅ (modelo) |
| L2 | **Local** pode ter raio (radius) para geolocalização; se definido, validar que coordenadas de ponto/tarefa estão dentro do raio quando aplicável. | Média | Sugerido |
| L3 | Nome de área **único por local** (evitar duplicidade no mesmo local). | Média | Sugerido |
| L4 | Não permitir excluir local com áreas vinculadas (ou cascata definida). | Média | Sugerido |

---

## 7. Auditoria (AuditLog)

| ID | Regra | Prioridade | Status |
|----|--------|------------|--------|
| A1 | Registrar **quem** (userId), **o quê** (action), **em qual entidade** (entity, entityId) e **payload** relevante em ações sensíveis (aprovar, rejeitar, alterar status, exclusão). | Alta | ✅ Parcial |
| A2 | Ações a auditar: APPROVE, REJECT, CREATE, UPDATE, DELETE (e opcionalmente LOGIN) nas entidades principais. | Alta | Sugerido |
| A3 | Logs de auditoria **somente leitura** para usuários (sem exclusão ou alteração). | Alta | Sugerido |

---

## 8. Acesso e perfis (RBAC)

| ID | Regra | Prioridade | Status |
|----|--------|------------|--------|
| R1 | **ADMIN**: acesso a todas as funcionalidades (tarefas, validação, funcionários, locais, áreas, materiais, ponto, relatórios, auditoria). | Alta | ✅ |
| R2 | **FUNCIONARIO**: acesso a dashboard, minhas tarefas, ponto; não acessa validação, cadastros de funcionários/locais/áreas/materiais, relatórios avançados, auditoria. | Alta | ✅ |
| R3 | Respostas **401** para token inválido/expirado; **403** para recurso não permitido ao perfil. | Alta | ✅ |
| R4 | Funcionário só pode ver/editar **próprias** tarefas e **próprio** ponto; admin vê todos. | Alta | ✅ (filtros) |

---

## 9. Relatórios e consultas

| ID | Regra | Prioridade | Status |
|----|--------|------------|--------|
| Q1 | Relatórios que agregam dados (por período, por funcionário, por local) apenas para **ADMIN**. | Alta | ✅ (rota protegida) |
| Q2 | Fila de validação (/tasks/validation/queue) retorna apenas tarefas **IN_REVIEW**; apenas ADMIN. | Alta | ✅ |
| Q3 | Paginação obrigatória em listagens (tasks, employees, etc.) com limite máximo (ex.: 100). | Média | ✅ Parcial |

---

## 10. Resumo de prioridades para implementação

**Alta (fazer primeiro):**
- T5, T8: validação de fotos e área/local ao enviar para validação e ao criar tarefa.
- F2, F4: upload só em status permitido; critério mínimo de fotos para IN_REVIEW.
- E2, E3: CPF único; unitId existente.
- M1: estoque não negativo; M3: movimentação auditada.
- A2, A3: ampliar auditoria e garantir imutabilidade dos logs.
- P5: ponto só pelo próprio funcionário ou admin.

**Média:**
- T6, T7, T10: data, funcionário ativo, exclusão de tarefa DONE.
- F5: limite de fotos.
- E4, E5, L3, L4, M2, M4: integridade e soft delete onde fizer sentido.
- P2, P3, L2: sequência de ponto, geolocalização.

**Baixa:**
- P4: geolocalização dentro do raio do local.

---

## Como usar este documento

1. **Backlog:** usar as regras como épicos/estórias (ex.: “T5 – Validar fotos antes de IN_REVIEW”).
2. **API:** implementar validações nos services (NestJS) e, quando útil, no shared (Zod) para contratos.
3. **Front/Mobile:** desabilitar ações que violem regras (ex.: botão “Enviar para validação” só habilitado quando houver fotos mínimas).
4. **Testes:** criar casos de teste para cada regra crítica (T2, T5, M1, R2, etc.).

---

## Checklist de implementação (API)

Regras já aplicadas no código da API:

| Regra | Onde | O que foi feito |
|-------|------|-----------------|
| T5 / F4 | `TasksService.update` | Ao definir status IN_REVIEW: exige pelo menos 1 foto BEFORE e 1 AFTER; só permite se status atual for PENDING ou IN_PROGRESS. |
| T6 | `TasksService.create` e `update` | Data agendada não pode ser no passado. |
| T8 | `TasksService.create` e `update` | Valida se `areaId` existe (tabela `areas`). |
| T10 | `TasksService.remove` | Não permite excluir tarefa com status DONE. |
| F2 | `TasksService.addPhoto` | Upload de foto só se tarefa estiver PENDING ou IN_PROGRESS. |
| M1 | `MaterialsService.update` | Estoque não pode ser negativo. |
| L1 (área) | `AreasService.create` | Valida se `locationId` existe (tabela `locations`). |
| E3 (unitId) | `EmployeesService.create` e `update` | Valida se `unitId` (local) existe. |
| T7 | `TasksService.create` e `update` | Se `employeeId` informado: funcionário deve existir e estar ACTIVE. |
| E2 | `EmployeesService.create` e `update` + `packages/shared` | CPF com 11 dígitos (schema); CPF único no sistema (query por dígitos). |
| A2 | `TasksService.update` e `remove` | Auditoria em mudança de status e em exclusão de tarefa. |

Constantes de negócio (podem virar config no futuro):

- `MIN_PHOTOS_BEFORE = 1`, `MIN_PHOTOS_AFTER = 1` em `apps/api/src/modules/tasks/tasks.service.ts`.

### Mensagens de erro no front/mobile

- **Web:** uso de `getApiErrorMessage(e, fallback)` em `apps/web/src/lib/getApiErrorMessage.ts` nas páginas Tarefas, Detalhe da Tarefa, Validação, Materiais e Funcionários, para exibir a mensagem retornada pela API (400/422) em vez de texto genérico.
- **Mobile:** já utiliza `getApiErrorMessage(e)` em `TaskDetailScreen` e `TakeTaskPhotoScreen` (Alert ao falhar status ou upload).

### Testes automatizados (API)

- **`tasks.service.spec.ts`:** create (área existe, data não no passado, funcionário ACTIVE se informado – T7), addPhoto (só PENDING/IN_PROGRESS), update IN_REVIEW (fotos mínimas, status permitido), remove (não excluir DONE).
- **`materials.service.spec.ts`:** update (estoque não negativo).
- **`employees.service.spec.ts`:** create (unitId existe, CPF único – E2), update (unitId existe).
- **`areas.service.spec.ts`:** create (locationId existe).

Rodar: `pnpm run test -- tasks.service.spec materials.service.spec employees.service.spec areas.service.spec` (em `apps/api`).

Se quiser, posso detalhar uma regra específica (ex.: fluxo completo de tarefa da criação até DONE) ou gerar trechos de código (validação, DTO, testes) para as regras de alta prioridade.
