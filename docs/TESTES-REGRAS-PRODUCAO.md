# Checklist: testar regras de negócio em produção

Use este guia para validar no site em produção (Após o deploy do Amplify e da API.) que as regras estão sendo aplicadas e que as mensagens de erro aparecem corretamente.

---

## Antes de começar

- [ ] Site web em produção carregando (ex.: URL do Amplify ou sigeo.advances.com.br).
- [ ] API em produção respondendo (ex.: https://dapotha14ic3h.cloudfront.net).
- [ ] Login feito com usuário **ADMIN** (para acessar cadastros e validação).
- [ ] Ter pelo menos 1 **Local**, 1 **Área**, 1 **Funcionário** (ACTIVE) e 1 **Material** cadastrados.

---

## 1. Tarefas

### 1.1 Data no passado (T6)
- [ ] Ir em **Tarefas** → **Nova**.
- [ ] Escolher uma **área** e colocar **data agendada** = ontem (ou qualquer data passada).
- [ ] Salvar.
- **Esperado:** mensagem de erro em vermelho, algo como **"Data agendada não pode ser no passado"** (e não "Erro ao salvar").

### 1.2 Área inexistente (T8)
- (Requer DevTools ou teste via API; no front o combo costuma listar só áreas existentes.)
- **Alternativa:** criar tarefa com área válida e data futura → deve **salvar com sucesso**.

### 1.3 Funcionário inativo (T7)
- [ ] Cadastrar um funcionário e colocar status **INACTIVE** (ou usar um já inativo).
- [ ] Em **Tarefas** → **Nova**, escolher **área**, **data futura** e esse **funcionário** inativo.
- [ ] Salvar.
- **Esperado:** mensagem tipo **"Só é possível atribuir tarefa a funcionário com status ACTIVE"**.

### 1.4 Enviar para validação sem fotos (T5 / F4)
- [ ] Criar uma tarefa **nova** (PENDING) ou em execução (IN_PROGRESS), **sem** fotos antes/depois.
- [ ] No **mobile**: tentar **Concluir serviço** (status → IN_REVIEW).
- **Esperado (mobile):** erro com mensagem tipo **"Para enviar à validação é necessário pelo menos 1 foto(s) ANTES e 1 foto(s) DEPOIS"** (ou que a API bloqueie e o app mostre a mensagem retornada).
- No **web** o admin altera status por **Tarefas** ou **Detalhe da tarefa**; se houver campo de status para IN_REVIEW, mesmo comportamento.

### 1.5 Excluir tarefa concluída (T10)
- [ ] Ter uma tarefa com status **DONE** (aprovada).
- [ ] Tentar **excluir** essa tarefa (botão/ação de remover, se existir na tela).
- **Esperado:** mensagem tipo **"Não é permitido excluir tarefa já concluída (DONE)"**.

---

## 2. Fotos (upload)

### 2.1 Foto em tarefa já em validação (F2)
- [ ] Ter uma tarefa em status **IN_REVIEW** (em validação).
- [ ] No **mobile**: abrir essa tarefa e tentar adicionar **Foto antes** ou **Foto depois**.
- **Esperado:** erro com mensagem tipo **"Só é possível adicionar foto em tarefa com status PENDING ou IN_PROGRESS"** (se a API for chamada; caso o app bloqueie antes, a regra também está valendo).

---

## 3. Materiais

### 3.1 Estoque negativo (M1)
- [ ] Ir em **Materiais**.
- [ ] Editar um material existente e colocar **Estoque** = -1 (ou outro negativo).
- [ ] Salvar.
- **Esperado:** mensagem tipo **"Estoque não pode ser negativo"** (ou mensagem de validação do schema).

---

## 4. Funcionários

### 4.1 CPF duplicado (E2)
- [ ] Ter um funcionário já cadastrado com **CPF** (ex.: 123.456.789-00).
- [ ] **Novo funcionário**: preencher Nome, Função, Unidade e o **mesmo CPF** (ou equivalente: 12345678900).
- [ ] Salvar.
- **Esperado:** mensagem tipo **"CPF já cadastrado para outro funcionário"**.

### 4.2 Unidade inexistente (E3)
- (No front o combo costuma listar só locais existentes; se houver como forçar um unitId inválido, a API deve retornar **"Unidade (local) não encontrada"**.)

---

## 5. Validação (aprovar / recusar)

### 5.1 Aprovar tarefa não IN_REVIEW (T2)
- (Se houver como tentar aprovar uma tarefa que não está IN_REVIEW, a API deve retornar **"Apenas tarefas em validação podem ser aprovadas"**; o front deve exibir essa mensagem.)

### 5.2 Recusar sem comentário (T4)
- [ ] Em **Validação**, escolher uma tarefa e **Recusar**.
- [ ] Se o sistema exigir comentário e você deixar em branco, deve falhar com mensagem de validação.
- [ ] Se preencher comentário e enviar: deve **recusar** e a tarefa volta para IN_PROGRESS (e exibir sucesso ou mensagem adequada).

---

## 6. Acesso (RBAC)

### 6.1 Funcionário não acessa área admin (R2 / 403)
- [ ] Fazer login com usuário **FUNCIONARIO** (se existir).
- [ ] Tentar acessar **Validação**, **Funcionários**, **Relatórios** ou **Auditoria** (por URL ou menu).
- **Esperado:** mensagem **"Acesso negado (403)"** ou redirecionamento, sem ver o conteúdo restrito.

---

## Resumo rápido

| Regra        | Onde testar              | Mensagem esperada (exemplo) |
|-------------|---------------------------|-----------------------------|
| T6          | Nova tarefa, data passada | Data agendada não pode ser no passado |
| T7          | Nova tarefa, funcionário INACTIVE | Só é possível atribuir tarefa a funcionário com status ACTIVE |
| T5/F4       | Concluir tarefa sem fotos (mobile) | Pelo menos 1 foto ANTES e 1 DEPOIS |
| T10         | Excluir tarefa DONE       | Não é permitido excluir tarefa já concluída |
| F2          | Adicionar foto em IN_REVIEW | Só é possível adicionar foto em PENDING ou IN_PROGRESS |
| M1          | Material, estoque -1      | Estoque não pode ser negativo |
| E2          | Novo funcionário, CPF igual a outro | CPF já cadastrado para outro funcionário |
| R2/403      | FUNCIONARIO acessa /validation | Acesso negado (403) |

---

Se alguma mensagem não aparecer ou o comportamento for diferente, confira no **DevTools** (aba Network) a resposta da API (status 400 e corpo `message`) e se o front está usando a URL correta da API (`VITE_API_URL` em produção).
