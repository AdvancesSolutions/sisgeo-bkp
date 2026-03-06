# CloudFront: API e autenticação (401 não cacheado)

Para a API atrás do CloudFront (`https://dapotha14ic3h.cloudfront.net` ou domínio customizado) funcionar corretamente com JWT e refresh token, configure o seguinte.

## 1. Não cachear rotas de autenticação

- **Path pattern:** `/auth/*`
- **Cache Policy:** Crie uma política com TTL 0 (ou use “CachingDisabled”) para que 401 e respostas de login/refresh nunca sejam cacheadas.
- **Origin Request Policy:** Encaminhe os headers necessários (veja abaixo).

## 2. Encaminhar Authorization e cookies

No **Behavior** que atende à API (ex.: `Default (*)` ou `/api/*`):

- **Cache Policy:** Para rotas protegidas, use “CachingDisabled” ou TTL 0 se todas as respostas forem dinâmicas.
- **Origin Request Policy:** Inclua:
  - **Headers:** `Authorization`, `Content-Type`, `Accept`
  - **Cookies:** All (se usar cookie para refresh token)

Assim, o CloudFront repassa o `Authorization: Bearer <token>` para o origin (ALB/API) e não responde com 401 em cache.

## 3. Resumo de configurações

| Item                    | Configuração |
|-------------------------|--------------|
| `/auth/*`               | Cache TTL 0 (CachingDisabled) |
| Headers encaminhados    | `Authorization`, `Content-Type`, `Accept` |
| Cookies (se usar)       | All (para refresh em cookie) |
| Rotas protegidas (ex.: `/tasks`, `/employees`) | Não cachear ou TTL 0; encaminhar `Authorization` |

## 4. Verificação

- Faça login no front e confira no DevTools (Network) que as requisições para a API enviam `Authorization: Bearer <token>`.
- Se receber 401 ao abrir o site (ex.: `/auth/me`, `/tasks`), confira:
  1. A política de cache do behavior **não** está cacheando respostas 401.
  2. A Origin Request Policy inclui o header `Authorization`.

## 5. Variável de ambiente no front (Amplify)

No Amplify (apps/web), defina:

- `VITE_API_URL` = `https://dapotha14ic3h.cloudfront.net` (ou a URL do CloudFront/domínio customizado da API).

Isso garante que o axios use essa baseURL e que o refresh chame a mesma origem.
