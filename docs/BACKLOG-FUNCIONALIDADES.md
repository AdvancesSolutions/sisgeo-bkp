# Backlog de funcionalidades – SIGEO

Documento que consolida as solicitações de funcionalidades organizadas por módulo.  
**Status:** 🔴 Não feito | 🟡 Em andamento | 🟢 Feito

---

## 1. Materiais

| # | Funcionalidade | Descrição | Status |
|---|----------------|-----------|--------|
| M1 | **Checklist de nível de produto diário** | Implementar checklist para nível de produto com registro diário. | 🔴 Não feito |
| M2 | **Comentários sobre estoque** | Funcionário poder fazer comentário sobre o estoque de produtos (campo/comentários por material ou por dia). | 🟢 Feito |

---

## 2. Cumprimento de tarefas (fotos)

| # | Funcionalidade | Descrição | Status |
|---|----------------|-----------|--------|
| T-FOTO1 | **Identificar ambiente pela foto** | App identificar por meio da foto a qual ambiente/área se refere (ex.: reconhecimento de imagem ou seleção obrigatória de área ao enviar foto). | 🔴 Não feito |

---

## 3. Gestor – Equipes e plantões

| # | Funcionalidade | Descrição | Status |
|---|----------------|-----------|--------|
| G1 | **Montar equipe** | Gestor: criar equipe, editar, adicionar, excluir membros. | 🔴 Não feito |
| G2 | **Equipe de plantões** | Montar equipe de plantões (vinculação de funcionários a turnos/plantões). | 🔴 Não feito |
| G3 | **Multi-tarefas para funcionário ou equipe** | Gestor adicionar múltiplas tarefas de uma vez a um funcionário ou a uma equipe. | 🔴 Não feito |
| G4 | **Rotina de tarefas** | Gestor criar rotina de tarefas para equipe ou colaborador (tarefas recorrentes/template). | 🔴 Não feito |

---

## 4. Funcionários – Troca de plantão

| # | Funcionalidade | Descrição | Status |
|---|----------------|-----------|--------|
| E1 | **Sub-item Troca de plantão** | Em Funcionários, criar sub-item "Troca de plantão" com aprovação do gestor e dos funcionários envolvidos. | 🔴 Não feito |
| E2 | **Assinatura da troca** | No fluxo de troca de plantão, coletar assinatura (digital) da troca. | 🔴 Não feito |

---

## 5. Tarefas

| # | Funcionalidade | Descrição | Status |
|---|----------------|-----------|--------|
| TK1 | **Horário na tarefa** | Adicionar horário (hora) ao agendamento da tarefa (além da data). | 🟢 Feito |
| TK2 | **Ordenação alfabética na Nova tarefa** | No formulário "Nova tarefa", ordenar listas (ex.: área, funcionário) em ordem alfabética. | 🟢 Feito |

---

## 6. Áreas internas – Limpeza e checklist

| # | Funcionalidade | Descrição | Status |
|---|----------------|-----------|--------|
| A1 | **Perguntas por área interna** | Para cada área interna: após foto "ambiente limpo", marcar data/hora automaticamente e coletar: | 🔴 Não feito |
| A1a | | • Qual tipo de limpeza? (terminal ou concorrente?) | |
| A1b | | • Tem alguma avaria no setor? Se sim, qual? | |

---

## 7. Dashboard

| # | Funcionalidade | Descrição | Status |
|---|----------------|-----------|--------|
| D1 | **Área sem atividade** | Identificar no dashboard qual área não realizou nenhuma atividade (no período). | 🟢 Feito |
| D2 | **Atividade em tempo real** | Identificar no dashboard qual atividade o prestador está realizando em tempo real. | 🔴 Não feito |

---

## Resumo por prioridade sugerida

- **Curto prazo (já em andamento):** TK1 (horário na tarefa), TK2 (ordem alfabética no formulário).
- **Médio prazo:** M1, M2 (materiais); T-FOTO1 (identificação de ambiente pela foto); D1 (área sem atividade).
- **Maior escopo:** G1–G4 (equipes, plantões, multi-tarefas, rotinas); E1–E2 (troca de plantão e assinatura); A1 (perguntas por área); D2 (atividade em tempo real).

---

## Dependências técnicas (referência)

- **Equipes/plantões:** novas entidades (ex.: `Team`, `Shift`, `TeamMember`, `ShiftChange`) e rotas na API.
- **Identificação por foto:** integração com serviço de visão (ex.: tag de área na foto ou ML) ou fluxo de seleção de área no app.
- **Tempo real (D2):** WebSockets ou polling; expor “tarefa em execução” por funcionário.
- **Assinatura:** campo de captura de assinatura (canvas/base64) e armazenamento no backend.

Este documento deve ser atualizado conforme itens forem implementados (alterar status para 🟢 e opcionalmente preencher “Onde” na API/front).
