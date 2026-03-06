# Ver dados de produção localmente

Para ver **tarefas recentes, funcionários, áreas e demais dados da base de produção** rodando o frontend localmente (sem subir a API nem o banco local).

## Opção 1: Frontend local → API de produção (recomendado)

O Vite faz proxy de `/api` para a API que você indicar. Assim o navegador fala só com `localhost` e não há problema de CORS.

### Passos

1. **Crie o arquivo de ambiente** na raiz do app web:
   - Caminho: `apps/web/.env.local`
   - Conteúdo (use a URL real da sua API em produção):

   ```env
   # Obrigatório: deixe VITE_API_URL vazio para o app usar /api (proxy). Caso contrário ele tenta localhost:3000 e dá ERR_CONNECTION_REFUSED.
   VITE_API_URL=
   PROXY_API_TARGET=https://api.sigeo.advances.com.br
   ```

   Se a API de produção for outra URL (ex.: CloudFront), use-a:

   ```env
   PROXY_API_TARGET=https://dapotha14ic3h.cloudfront.net
   ```

2. **Suba só o frontend:**

   ```bash
   pnpm dev:web
   ```

3. **Acesse** http://localhost:5173 e **faça login** com um usuário de produção (o mesmo que usa em https://sigeo.advances.com.br).

4. Tarefas recentes, dashboard, funcionários, áreas, materiais etc. virão da **API de produção** (e portanto do banco de produção).

### Resumo

| Onde roda        | O que usa                    |
|------------------|------------------------------|
| Frontend         | localhost:5173               |
| Chamadas da API  | `/api` → proxy → produção    |
| Dados exibidos   | Banco de produção            |

- **Não** defina `VITE_API_URL` no `.env.local` ao usar o proxy para produção; senão o app pode chamar a API direto e aí CORS pode bloquear.
- Se aparecer **500 (Internal Server Error)** em `/api/auth/me`, em geral é token antigo/inválido. O app agora **limpa a sessão** nesse caso: recarregue a página e faça **login de novo** com usuário de produção. Se continuar 500, tente em `.env.local` a URL do CloudFront: `PROXY_API_TARGET=https://dapotha14ic3h.cloudfront.net`.
- Se **POST /api/auth/login** também retornar **500**, o problema é no servidor de produção (API/ECS). O frontend exibe uma mensagem orientando a usar API local ou conferir a URL do proxy. Para corrigir: verifique os logs da API em produção (CloudWatch, ECS) e variáveis de ambiente; ou use a **Opção 2** (API + banco local com dump de produção).
- Para voltar a usar a API local, apague ou comente `PROXY_API_TARGET` no `.env.local` e reinicie o `pnpm dev:web`.

---

## Opção 2: Cópia do banco de produção para o PostgreSQL local

Se preferir rodar **API + frontend e banco tudo local**, mas com os **dados** de produção:

1. **Obter um dump do banco de produção**  
   (quem tiver acesso ao RDS/instância de produção):

   ```bash
   pg_dump -h <host-prod> -U <user> -d sigeo -F c -f sigeo_prod.dump
   ```

2. **Subir o Postgres local** (ex.: Docker):

   ```bash
   docker compose up -d postgres
   ```

3. **Restaurar o dump no banco local:**

   ```bash
   pg_restore -h localhost -U postgres -d sigeo --clean --if-exists sigeo_prod.dump
   ```

4. **Rodar API e frontend local:**

   ```bash
   pnpm dev:api
   pnpm dev:web
   ```

Aí o app local usa o banco local, que é uma cópia dos dados de produção (tarefas recentes, etc.).

---

## Variáveis relacionadas (referência)

| Variável            | Onde       | Uso |
|---------------------|------------|-----|
| `PROXY_API_TARGET`  | `apps/web/.env.local` | Para onde o proxy de `/api` encaminha (ex.: URL da API em produção). |
| `VITE_API_URL`      | `apps/web/.env` ou Amplify | URL da API usada pelo frontend. Em dev, se não for definida, o app usa `/api` (proxy). |
