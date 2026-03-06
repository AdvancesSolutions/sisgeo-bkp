# Diagnóstico: Autenticação e 401 no front (apps/web)

## 1. Onde está o cliente HTTP (axios)

- **Arquivo:** `apps/web/src/lib/api.ts`
- **Cliente:** `axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } })`
- **baseURL:** `VITE_API_URL` ou em dev `/api`; em produção deve ser `https://dapotha14ic3h.cloudfront.net`

## 2. Onde os tokens são guardados

- **Antes:** `localStorage` com chaves `accessToken`, `refreshToken`, `user` (sem prefixo).
- **Depois:** `apps/web/src/auth/authStore.ts` centraliza o armazenamento com prefixo por ambiente (`VITE_AUTH_KEY_PREFIX` ou `sigeo`):
  - `sigeo_accessToken`, `sigeo_refreshToken`, `sigeo_user`
  - Métodos: `getAccessToken()`, `getRefreshToken()`, `setTokens()`, `setUser()`, `clear()`, `isAuthenticated()`

## 3. Onde /auth/me é chamado

- **Arquivo:** `apps/web/src/contexts/AuthContext.tsx`
- **Quando:** No `useEffect` que roda apenas quando `authStore.isAuthenticated()` e `isVerifying` são true (ou seja, só quando já existe token).
- **Fluxo:** Ao carregar, se há token + user no store, `isVerifying` fica true e é feita uma única chamada a `/auth/me`; só depois de sucesso (ou falha) o app libera o restante (evita tempestade de requests sem sessão).

## 4. Headers enviados hoje

- **Request:** `Content-Type: application/json` (padrão do axios) e `Authorization: Bearer <accessToken>` quando há token.
- O interceptor de request só anexa `Authorization` se `authStore.getAccessToken()` existir; em rotas não-auth, se não houver token a request é rejeitada (`NO_AUTH`) e o usuário não chega a disparar dezenas de requests (ProtectedRoute redireciona para `/login`).

## 5. Backend: /auth/login e /auth/refresh (contratos)

- **POST /auth/login** (body: `{ email, password }`):
  - Resposta: `{ accessToken, refreshToken, expiresIn, user }` (LoginResult)
- **POST /auth/refresh** (body: `{ refreshToken }`):
  - Resposta: `{ accessToken, refreshToken, expiresIn, user }` (LoginResult)
- **GET /auth/me** (header: `Authorization: Bearer <accessToken>`):
  - Resposta: `{ id, name, email, role }` (user)

## 6. CloudFront na frente da API

- Sim. A API é consumida em produção via `https://dapotha14ic3h.cloudfront.net`.
- **Risco de 401 em cache:** Se o behavior cachear respostas, um 401 pode ser servido do cache. Deve-se usar Cache Policy com TTL 0 (CachingDisabled) para `/auth/*` e encaminhar o header `Authorization` (ver `docs/CLOUDFRONT-AUTH.md`).

## 7. Confirmações

| Pergunta | Resposta |
|----------|----------|
| O token está sendo enviado? | Sim, quando existe: `Authorization: Bearer <accessToken>` no interceptor de request. |
| Access token expirou? | Decodificar payload JWT (exp/iat) na Auth Debug Page (`/auth-debug`) para inspecionar. |
| Refresh token existe e é usado? | Sim: guardado no authStore; no interceptor de response, em 401 (exceto login/refresh) chama-se `/auth/refresh` com lock único e depois repete a request. |
| CORS/cookies impedindo refresh? | CORS na API já permite `Authorization` e `credentials: true`; refresh é feito por body (`refreshToken`), não por cookie. |
