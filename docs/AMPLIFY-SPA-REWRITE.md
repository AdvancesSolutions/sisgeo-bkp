# Amplify: corrigir 404 em refresh (SPA) — checklist e instruções

Se ao acessar diretamente ou dar **F5** em rotas como `/dashboard`, `/tasks`, `/employees` ou `/tasks/123` aparecer **404**, o Amplify não está servindo `index.html` para essas rotas. O React Router resolve as rotas no cliente; o servidor precisa devolver sempre `index.html` com status **200 (Rewrite)** para caminhos que não são arquivos estáticos.

---

## 0) Aplicar via script (rápido)

Com AWS CLI configurado (`aws configure`):

```powershell
.\scripts\amplify-apply-spa-rewrite.ps1
```

Isso aplica a regra em `scripts/amplify-custom-rules.json` no app Amplify. Ajuste o `AppId` no script se seu app for outro.

---

## 1) Checklist técnico

| Item | Onde verificar | Status |
|------|----------------|--------|
| **Router** | App usa `BrowserRouter` (não HashRouter) | OK em `apps/web/src/App.tsx` |
| **Build** | `amplify.yml` → `artifacts.baseDirectory: apps/web/dist` | OK em `amplify.yml` |
| **Rewrite 200** | Regra no Amplify: source `/*` → target `/index.html` → type **200** (Rewrite) | Configurar no Console (abaixo) |
| **Não 404** | A regra deve ser **Rewrite (200)**, não "Not found (404)" | Ver passo 4.4 |

---

## 2) Onde configurar a regra

A regra de rewrite é configurada no **AWS Amplify Console** (não no `amplify.yml`). O build spec define só o build e os artifacts; redirects/rewrites são definidos na app.

---

## 3) Passo a passo no Console do Amplify

1. Acesse o **AWS Console** e abra o **Amplify**.
2. Na lista de apps, clique no app do SISGEO (ex.: **sigeo** ou o nome do repositório).
3. No menu lateral esquerdo, em **Hosting**, clique em **Rewrites and redirects**.
4. Clique no botão **Manage redirects**.
5. No editor JSON que abrir:
   - Se já houver outras regras, **adicione** a regra abaixo no **início** do array (a ordem importa).
   - Se preferir usar só a regra SPA, **substitua** todo o conteúdo pelo JSON abaixo.
6. Cole ou ajuste para ficar assim (uma regra de **Rewrite 200** para SPA):

```json
[
  {
    "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>",
    "target": "/index.html",
    "status": "200",
    "condition": ""
  }
]
```

7. Confira:
   - **Source:** padrão em regex (qualquer caminho que não seja arquivo estático).
   - **Target:** `/index.html`.
   - **Status:** `200` (Rewrite) — **não** use 404.
8. Clique em **Save**.

Isso faz com que qualquer URL que não seja arquivo estático (.js, .css, .png, etc.) seja atendida pelo `index.html` com status 200; o React Router então resolve `/tasks`, `/employees`, `/tasks/123`, etc.

---

## 4) Referência rápida (onde clicar)

| Onde | O que clicar |
|------|----------------|
| AWS Console | Serviços → **Amplify** |
| App | Nome do app (ex.: **sigeo**) |
| Menu lateral | **Hosting** → **Rewrites and redirects** |
| Página de redirects | **Manage redirects** |
| Editor | Colar/editar o JSON da regra SPA (status 200) |
| Salvar | **Save** |

---

## 5) Arquivos do repositório

- **Build / artifacts:** `amplify.yml` já está com `baseDirectory: apps/web/dist` e `files: '**/*'`.
- **Regra pronta para copiar:** `scripts/amplify-custom-rules.json` (mesmo conteúdo da regra acima).
- **Atualização via API:** se usar CLI/API para atualizar o app, use `scripts/amplify-update-input.json` (contém `customRules` no formato da API).

Não é obrigatório ter redirects dentro do `amplify.yml`; no Amplify Hosting atual, redirects/rewrites são da **app**, no Console (ou via API).

---

## 6) Como validar depois do ajuste

1. Fazer **commit** e **push** das alterações do projeto (se houve mudança em código ou em scripts). O deploy do Amplify pode ser disparado pelo push (se o branch estiver conectado).
2. Aguardar o build do Amplify terminar (Hosting → seu branch).
3. Abrir a URL do app (ex.: `https://sigeo.advances.com.br` ou `https://main.xxxx.amplifyapp.com`).
4. Navegar para uma rota, ex.: **/tasks** ou **/employees**.
5. Pressionar **F5** (refresh).
6. **Resultado esperado:** a página recarrega e continua na mesma rota, **sem 404**. Se aparecer 404, a regra de rewrite ainda não está aplicada ou está com status errado (ex.: 404 em vez de 200).

---

## 7) Resumo

- **Router:** já está com `BrowserRouter` no app.
- **Artifacts:** `amplify.yml` já aponta para `apps/web/dist`.
- **O que falta:** garantir no Console a regra **source → /index.html, status 200 (Rewrite)** (conteúdo em `scripts/amplify-custom-rules.json`).
- **Validação:** abrir `/tasks` ou `/employees`, dar F5 e conferir que não retorna 404.
