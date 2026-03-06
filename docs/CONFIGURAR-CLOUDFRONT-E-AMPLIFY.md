# Configurar CloudFront (API) e VITE_API_URL no Amplify (Web)

Guia para garantir que a API atrás do CloudFront não cacheie 401 e encaminhe o header `Authorization`, e que o front use a URL correta da API.

---

## Parte 1 – CloudFront: encaminhar Authorization e não cachear /auth/*

### 1.1 Conferir o behavior padrão

1. **AWS Console** → **CloudFront** → **Distributions**.
2. Abra a distribuição da API (ex.: a que termina em `dapotha14ic3h.cloudfront.net`).
3. Aba **Behaviors** → clique no behavior **Default (*)** (ou no que atende à API).

### 1.2 Origin Request Policy (encaminhar Authorization)

O header `Authorization` **não** pode ser incluído em políticas **custom** de Origin Request. Use a política **gerenciada**:

1. **CloudFront** → **Distributions** → sua distribuição da API → **Behaviors** → edite o **Default (*)**.
2. Em **Origin request policy**, escolha **AllViewerExceptHostHeader** (gerenciada).
   - Ela encaminha todos os headers do viewer para o origin (incluindo `Authorization`), exceto `Host`, além de cookies e query strings.
3. **Save changes**.

### 1.3 Cache Policy (não cachear respostas da API)

Para a API, o ideal é **não cachear** (tudo dinâmico):

1. No mesmo behavior (**Default (*)**), em **Cache policy**:
   - Se existir, use **CachingDisabled** (managed).
   - Ou crie uma **Cache policy** com **TTL**: Min 0, Max 0, Default 0.
2. **Save changes**.

### 1.4 (Opcional) Behavior só para /auth/*

Se quiser um behavior específico para autenticação:

1. **Behaviors** → **Create behavior**.
2. **Path pattern:** `auth/*`.
3. **Origin:** mesmo do Default (ex.: sigeo-alb).
4. **Cache policy:** CachingDisabled.
5. **Origin request policy:** SIGEO-API-Headers (ou a que encaminha Authorization).
6. **Create**.

### 1.5 Invalidar cache (se já tiver cacheado 401)

Se antes da configuração o CloudFront tiver cacheado respostas 401:

1. **CloudFront** → sua distribuição → aba **Invalidations** → **Create invalidation**.
2. **Object paths:** `/auth/*` ou `/*`.
3. **Create invalidation**.

---

## Parte 2 – Amplify: definir VITE_API_URL

### 2.1 Pelo Console (recomendado)

1. **AWS Console** → **Amplify** (região **sa-east-1**).
2. Abra o app **sigeo** (ou o nome do seu app web).
3. Menu **Hosting** → **Environment variables** (ou **App settings** → **Environment variables**).
4. Edite ou adicione:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://dapotha14ic3h.cloudfront.net`  
     (ou a URL do domínio customizado da API, ex.: `https://api.sigeo.advances.com.br`)
5. **Save**.
6. **Redeploy:** em **Hosting** → **Run build** (ou faça um novo commit na branch conectada) para o build usar a nova variável.

### 2.2 Pelo AWS CLI (opcional)

Use o **App ID** e o **Branch** do app Amplify (ex.: `main`).

```powershell
# Listar variáveis atuais (substitua APP_ID e BRANCH)
aws amplify get-branch --app-id APP_ID --branch-name main --region sa-east-1

# Atualizar env vars (substitua APP_ID e BRANCH)
# O comando abaixo define apenas VITE_API_URL; outras variáveis precisam ser incluídas no JSON.
$appId = "da1hucc7ed5a9"   # substitua pelo App ID do Amplify
$branch = "main"
$apiUrl = "https://dapotha14ic3h.cloudfront.net"

aws amplify update-branch --app-id $appId --branch-name $branch --environment-variables "VITE_API_URL=$apiUrl" --region sa-east-1
```

**Nota:** `update-branch` com `--environment-variables` **substitui** todas as variáveis do branch. Para manter as existentes, busque-as antes com `get-branch` e monte o JSON completo em `--environment-variables`.

### 2.3 Conferir no build

Depois do próximo build, no log do Amplify deve aparecer o uso de `VITE_API_URL` no build do Vite. No navegador (site em produção), abra o DevTools → Network e confira se as requisições vão para a URL configurada (ex.: `https://dapotha14ic3h.cloudfront.net/auth/me`).

---

## Checklist rápido

| Onde | O quê |
|------|--------|
| **CloudFront** | Behavior da API com Origin Request Policy que inclui `Authorization` (e Content-Type, Accept). |
| **CloudFront** | Cache Policy CachingDisabled (ou TTL 0) no behavior da API. |
| **Amplify** | Variável `VITE_API_URL` = URL do CloudFront (ou domínio customizado da API). |
| **Amplify** | Novo build após alterar `VITE_API_URL`. |

---

## Referências

- **Autenticação e 401:** `docs/CLOUDFRONT-AUTH.md`
- **Domínio customizado (sigeo.advances.com.br):** `docs/DOMINIO-ADVANCES-AWS.md`
