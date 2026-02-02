# URL fixa na AWS – Domínio customizado

## Por que a URL “muda”?

As URLs padrão da AWS **não mudam a cada deploy**:

- **Web (Amplify):** `https://main.da1hucc7ed5a9.amplifyapp.com` é fixa para o app **sigeo** (ID `da1hucc7ed5a9`). Só muda se você criar um **novo** app Amplify.
- **API (CloudFront):** `https://dapotha14ic3h.cloudfront.net` é fixa para a distribuição CloudFront. Só muda se você criar uma **nova** distribuição.

Se a URL está mudando, provavelmente:
- você está criando um novo app Amplify ou nova distribuição CloudFront, ou
- está usando outra branch (ex.: `staging.xxx.amplifyapp.com` em vez de `main.xxx.amplifyapp.com`).

Para ter **uma URL fixa sob seu controle** (ex.: `https://app.seudominio.com` e `https://api.seudominio.com`), use **domínio customizado** como abaixo.

---

## Pré-requisito: um domínio

Você precisa de um domínio (ex.: `sigeo.com.br`, `meudominio.com`):

- Comprar no **Route 53** (AWS) ou em qualquer registrador (Registro.br, GoDaddy, etc.).
- Se o domínio estiver no Route 53 na mesma conta AWS, a configuração fica mais simples.

Exemplos de subdomínios que vamos usar:

- **Web:** `app.seudominio.com` (ou `sigeo.seudominio.com`)
- **API:** `api.seudominio.com`

Substitua `seudominio.com` pelo seu domínio real.

---

## 1. URL fixa para o frontend (Amplify)

### 1.1 No Console AWS (Amplify)

1. **Amplify** → app **sigeo** (sa-east-1) → menu **Hosting** → **Custom domains**.
2. Clique em **Add domain**.
3. Digite o domínio (ex.: `app.seudominio.com` ou `sigeo.seudominio.com`).
4. Se o domínio estiver no **Route 53** na mesma conta, escolha o domínio na lista e deixe a AWS criar o registro automaticamente.
5. Se o domínio estiver **fora da AWS**, a Amplify vai mostrar um **CNAME** para você criar no seu DNS (ex.: `main.da1hucc7ed5a9.amplifyapp.com`). Crie o registro CNAME apontando para esse valor.
6. Aguarde a validação (pode levar alguns minutos). Quando aparecer **Available**, o app estará acessível em `https://app.seudominio.com` (ou o subdomínio que você escolheu).

Depois disso, **sempre** use essa URL para acessar o frontend; ela não muda com deploy.

### 1.2 Atualizar CORS e variáveis de ambiente

- No **ECS** (Task Definition / variáveis da API), defina `CORS_ORIGIN` com a nova URL do front, por exemplo:  
  `https://app.seudominio.com`
- No **Amplify**, em **Environment variables**, mantenha `VITE_API_URL` apontando para a **URL fixa da API** (domínio customizado da API, ver seção 2).

---

## 2. URL fixa para a API (CloudFront)

A API hoje está atrás do CloudFront. Para usar algo como `https://api.seudominio.com`:

### 2.1 Certificado SSL (ACM)

O certificado para o domínio usado no CloudFront precisa estar em **us-east-1** (exigência da AWS para CloudFront).

1. **AWS Certificate Manager (ACM)** → região **us-east-1**.
2. **Request certificate**.
3. Domínio: `api.seudominio.com` (ou um wildcard `*.seudominio.com` se quiser usar outros subdomínios).
4. Validação: **DNS** (recomendado). Crie o registro CNAME que a ACM indicar no DNS do domínio.
5. Aguarde status **Issued**.

### 2.2 Domínio alternativo no CloudFront

1. **CloudFront** → distribuição da API (a que hoje termina em `dapotha14ic3h.cloudfront.net`).
2. Aba **General** → **Edit**.
3. Em **Alternate domain names (CNAMEs)**, adicione: `api.seudominio.com`.
4. Em **Custom SSL certificate**, selecione o certificado que você criou no passo 2.1 (us-east-1).
5. Salve e aguarde a distribuição atualizar (alguns minutos).

### 2.3 DNS (apontar para o CloudFront)

Crie um registro no DNS do seu domínio:

- **Tipo:** CNAME (ou A/AAAA se usar Route 53 com alias).
- **Nome:** `api` (ou o subdomínio que você escolheu, ex.: `api.seudominio.com`).
- **Valor:** o **domínio** da distribuição CloudFront, ex.: `dapotha14ic3h.cloudfront.net`.

Se usar **Route 53**:

- Crie um registro **A** (alias) para `api.seudominio.com` apontando para a distribuição CloudFront, ou um CNAME para `dapotha14ic3h.cloudfront.net`.

Depois que o DNS propagar, a API ficará acessível em **https://api.seudominio.com** de forma fixa.

### 2.4 Atualizar o projeto para usar a URL fixa da API

Quando a API estiver respondendo em `https://api.seudominio.com`:

1. **Amplify (variáveis de ambiente):**  
   `VITE_API_URL=https://api.seudominio.com`
2. **Mobile (produção):**  
   Atualize a URL padrão da API em `apps/mobile/src/utils/env.ts` (ou `.env`) para `https://api.seudominio.com`.
3. **CORS na API:**  
   Mantenha `CORS_ORIGIN` com a URL do front (ex.: `https://app.seudominio.com`).

Faça um novo deploy do front (e do mobile, se necessário) para que todos usem a nova URL da API.

---

## Resumo

| O que | URL padrão (fixa por recurso) | URL fixa com domínio customizado |
|-------|------------------------------|-----------------------------------|
| **Web** | `https://main.da1hucc7ed5a9.amplifyapp.com` | `https://app.seudominio.com` |
| **API** | `https://dapotha14ic3h.cloudfront.net` | `https://api.seudominio.com` |

- As URLs padrão **não mudam a cada deploy**; mudam só se você criar outro app ou outra distribuição.
- Para ter **uma URL fixa sob seu controle**, configure domínio customizado no Amplify e no CloudFront como acima. Depois disso, use sempre essas URLs no CORS, `VITE_API_URL` e no app mobile.
