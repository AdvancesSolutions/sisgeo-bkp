# Migrar SIGEO de us-east-1 para sa-east-1 (São Paulo)

O projeto está configurado para usar **sa-east-1** como região padrão. Recursos já criados em **us-east-1** não podem ser “movidos”; é preciso criar **novos** recursos em sa-east-1 e apontar o uso para eles.

**Estado atual:** Tudo em **sa-east-1**: Web (Amplify), API (ECS Fargate atrás de ALB + CloudFront HTTPS), RDS. O App Runner em us-east-1 foi removido.

**URL fixa / domínio customizado:** Se a URL parece mudar a cada deploy ou você quer uma URL fixa sob seu controle (ex.: `app.seudominio.com` e `api.seudominio.com`), veja **[URL-FIXA-CUSTOM-DOMAIN.md](./URL-FIXA-CUSTOM-DOMAIN.md)**. Para usar o domínio **advances.com.br** (Registro.br / DreamHost) na AWS, veja **[DOMINIO-ADVANCES-AWS.md](./DOMINIO-ADVANCES-AWS.md)**.

---

## 1. Página não abre (404 em rotas)

Se ao acessar a URL do Amplify a página fica em branco ou dá 404 ao abrir/atualizar uma rota (ex.: `/dashboard`, `/tasks`), falta a **regra de rewrite SPA**:

- **Console AWS** → **Amplify** → app **sigeo** → **Hosting** → **Rewrites and redirects** → **Manage redirects**.
- Cole o conteúdo de `scripts/amplify-custom-rules.json` (regra `"/<<*>>"` → `/index.html`, status 200).
- Ou no PowerShell (na raiz do projeto), com a região onde o app está:
  ```powershell
  .\scripts\amplify-spa-redirect.ps1 -AwsRegion sa-east-1
  ```
  (Use `us-east-1` se o app Amplify ainda estiver na região antiga.)

Salve e aguarde o próximo deploy (ou dispare um redeploy).

---

## 2. Criar tudo em sa-east-1 (do zero)

1. **Configurar região padrão**
   ```powershell
   aws configure
   ```
   - Default region: **sa-east-1**

2. **ECR + build + push**
   ```powershell
   .\scripts\deploy-aws.ps1
   ```
   Cria o repositório ECR em **sa-east-1** e faz push da imagem.

3. **RDS**  
   No Console: **RDS** → **Create database** → região **sa-east-1** → PostgreSQL 16 → criar DB `sigeo`, anotar endpoint e senha.

4. **App Runner**  
   No Console: **App Runner** → região **sa-east-1** → **Create service** → imagem ECR em sa-east-1, porta 3000, variáveis de ambiente (DB_*, JWT_*, CORS_ORIGIN). Anotar a URL do serviço.

5. **Amplify**  
   No Console: **Amplify** → **New app** → região **sa-east-1** (ou a que o Amplify oferecer) → conectar o repo GitHub, branch `main`, build com `amplify.yml`.  
   - Definir **VITE_API_URL** = URL do App Runner (sa-east-1).  
   - Aplicar o rewrite SPA (passo 1 acima).

6. **GitHub Secrets**  
   Atualizar (ou criar) os secrets com a **nova** região e o **novo** ARN do App Runner em sa-east-1:
   - `AWS_REGION` = **sa-east-1**
   - `APP_RUNNER_SERVICE_ARN` = ARN do serviço criado em sa-east-1

7. **Bootstrap do banco**
   ```powershell
   $env:DB_HOST = "ENDPOINT_RDS_SA_EAST_1"
   $env:DB_PASSWORD = "SUA_SENHA"
   $env:DB_PORT = "5432"
   $env:DB_USER = "postgres"
   $env:DB_NAME = "sigeo"
   pnpm --filter @sigeo/api db:bootstrap
   ```

---

## 3. Script deploy-aws-full.ps1 em sa-east-1

O script `scripts/deploy-aws-full.ps1` já usa **sa-east-1** por padrão. Ele cria RDS, App Runner, Amplify e bootstrap na região informada:

```powershell
.\scripts\deploy-aws-full.ps1 -AwsRegion sa-east-1
```

Use isso para subir o ambiente inteiro em sa-east-1; depois aplique o rewrite SPA (passo 1) no app Amplify criado.

---

## 4. Resumo

| Onde              | Ação |
|-------------------|------|
| **Página não abre** | Aplicar rewrite SPA no Amplify (`amplify-custom-rules.json` ou `amplify-spa-redirect.ps1`). |
| **Região**        | Padrão do projeto: **sa-east-1**. Scripts e workflow usam sa-east-1. |
| **Recursos antigos em us-east-1** | Podem ser mantidos ou desligados; para “migrar”, crie novos em sa-east-1 e atualize URLs e secrets. |

---

## 5. Ambiente 100% em sa-east-1

| Recurso | Região | URL / Endpoint |
|---------|--------|----------------|
| **Web (Amplify)** | sa-east-1 | https://main.da1hucc7ed5a9.amplifyapp.com |
| **API (CloudFront → ALB → ECS Fargate)** | sa-east-1 | https://dapotha14ic3h.cloudfront.net |
| **RDS PostgreSQL** | sa-east-1 | sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com (DB: sigeo) |

- **Login:** admin@sigeo.local / admin123  
- **Senha RDS** em SSM: `/sigeo/db-password` (região sa-east-1).

Para reduzir custos, veja **docs/REDUCAO-CUSTOS-AWS.md**.  
Para deploy da API (nova imagem), use `.\scripts\deploy-aws.ps1 -AwsRegion sa-east-1` e depois force novo deploy do serviço ECS: `aws ecs update-service --cluster sigeo-cluster --service sigeo-api --force-new-deployment --region sa-east-1`.

---

## 6. Internal Server Error ao cadastrar (locais, funcionários, áreas, etc.)

Se ao criar qualquer registro aparecer **Internal Server Error**:

1. **Logs da API:** No **CloudWatch** (região sa-east-1), grupo de log **/ecs/sigeo-api**, veja os logs da tarefa ECS. O erro real (ex.: coluna inexistente, constraint) aparece lá.
2. **Schema do banco:** Em produção a API usa `synchronize: false`. Se o RDS foi criado sem rodar o bootstrap, as tabelas podem estar faltando ou desatualizadas. Rode o bootstrap **uma vez** com as variáveis do RDS:
   ```powershell
   cd apps/api
   $env:DB_HOST="sigeo-db.xxx.sa-east-1.rds.amazonaws.com"
   $env:DB_USER="postgres"
   $env:DB_NAME="sigeo"
   $env:DB_PASSWORD="<senha do RDS>"  # ou use o valor do SSM /sigeo/db-password
   pnpm db:bootstrap
   ```
   Isso sincroniza o schema (todas as entidades) e cria o usuário admin se não existir.
