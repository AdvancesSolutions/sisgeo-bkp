# Hosting completo na AWS – advances.com.br e SIGEO

Este guia configura **tudo na AWS**: DNS (Route 53), web (Amplify) e API (CloudFront/ECS) para o domínio **advances.com.br** (registrado no Registro.br). O **SIGEO** fica como subdomínio da Advances.

**Estrutura (100% AWS):**

| Serviço | URL | AWS |
|---------|-----|-----|
| **DNS** | advances.com.br | Route 53 (hosted zone) |
| **Web SIGEO** | sigeo.advances.com.br | Amplify |
| **API SIGEO** | api.sigeo.advances.com.br | CloudFront → ALB → ECS |

O domínio continua **registrado no Registro.br**; você só troca os **servidores DNS** para os da Route 53 e passa a gerenciar todos os registros na AWS.

---

## 1. Criar a hosted zone no Route 53

1. **Console AWS** → **Route 53** → **Hosted zones** → **Create hosted zone**.
2. **Domain name:** `advances.com.br`.
3. **Type:** Public hosted zone.
4. Clique em **Create hosted zone**.
5. Na hosted zone criada, anote os **4 nameservers** (ex.: `ns-123.awsdns-12.com`, `ns-456.awsdns-45.net`, etc.). Você vai usá-los no Registro.br.

---

## 2. Apontar o domínio no Registro.br para a Route 53

1. Acesse o **Registro.br** e abra a página do domínio **advances.com.br**.
2. Clique em **Alterar servidores DNS** (na seção DNS).
3. **Remova** os servidores atuais (ex.: DreamHost ou qualquer outro).
4. **Informe os 4 nameservers** da Route 53 (copie e cole exatamente como aparecem na hosted zone).
5. Salve. A propagação pode levar de alguns minutos até 48 horas (geralmente menos).

Depois disso, o DNS de **advances.com.br** passa a ser resolvido pela AWS. Todos os próximos registros serão criados na **Route 53**.

---

## 3. Web (Amplify) – sigeo.advances.com.br

1. **Amplify** (região **sa-east-1**) → app **sigeo** → **Hosting** → **Custom domains** → **Add domain**.
2. Domínio: **`sigeo.advances.com.br`**.
3. Se a hosted zone **advances.com.br** estiver na **mesma conta AWS**, a Amplify costuma oferecer **configurar automaticamente** o registro na Route 53. Aceite e aguarde a validação.
4. Se não oferecer: na **Route 53** → hosted zone **advances.com.br** → **Create record**:
   - **Record name:** `sigeo`
   - **Record type:** CNAME (ou o que a Amplify indicar)
   - **Value:** o alvo que a Amplify mostrar (ex.: `main.da1hucc7ed5a9.amplifyapp.com`)
5. Aguarde o status do domínio na Amplify ficar **Available**. Acesse **https://sigeo.advances.com.br**.

---

## 4. API (CloudFront) – api.sigeo.advances.com.br

### 4.1 Certificado SSL (ACM em us-east-1)

O CloudFront exige certificado na região **us-east-1** (Norte da Virgínia).

1. **AWS Certificate Manager (ACM)** → troque a região para **us-east-1**.
2. **Request certificate**.
3. **Domain name:** `api.sigeo.advances.com.br`.
4. **Validation:** DNS.
5. Clique em **Request**.
6. Na tela do certificado, em **Domains**, clique em **Create records in Route 53** (se a hosted zone **advances.com.br** estiver na mesma conta). Isso cria o CNAME de validação na Route 53.
7. Se não aparecer o botão: anote o **nome** e o **valor** do CNAME de validação e crie manualmente na Route 53 (hosted zone advances.com.br) um registro CNAME com esses dados.
8. Aguarde o status do certificado ficar **Issued**.

### 4.2 Domínio alternativo no CloudFront

1. **CloudFront** → distribuição da API (a que hoje é `dapotha14ic3h.cloudfront.net`).
2. Aba **General** → **Edit**.
3. **Alternate domain names (CNAMEs):** adicione **`api.sigeo.advances.com.br`**.
4. **Custom SSL certificate:** selecione o certificado criado no passo 4.1 (us-east-1).
5. Salve. Aguarde a distribuição atualizar (alguns minutos).

### 4.3 Registro DNS na Route 53

1. **Route 53** → hosted zone **advances.com.br** → **Create record**.
2. **Record name:** `api.sigeo` (resulta em `api.sigeo.advances.com.br`).
3. **Record type:** A.
4. **Alias:** ative; **Route traffic to:** Alias to CloudFront distribution; escolha a distribuição da API.
5. Crie o registro.

Após a propagação, a API estará em **https://api.sigeo.advances.com.br**.

---

## 5. Depois que web e API estiverem no ar

### 5.1 CORS na API (ECS)

Atualize a variável **CORS_ORIGIN** da API para a URL do front:

- `https://sigeo.advances.com.br`

**Como:** ECS → Task Definition (sigeo-api) → **Create new revision** → em **Environment**, altere `CORS_ORIGIN` para `https://sigeo.advances.com.br`. Depois atualize o **Service** para usar a nova revisão.

### 5.2 Frontend (Amplify)

Em **Environment variables** do app Amplify (branch **main**):

- **VITE_API_URL** = `https://api.sigeo.advances.com.br`

Faça um novo deploy do front para o build usar essa URL.

### 5.3 App mobile

Em **apps/mobile/src/utils/env.ts**:

```ts
const PRODUCTION_API_URL = 'https://api.sigeo.advances.com.br';
```

(ou defina `EXPO_PUBLIC_API_URL` no `.env` do mobile.)

### 5.4 Documentação e scripts

Atualize referências antigas para:

- Web: `https://sigeo.advances.com.br`
- API: `https://api.sigeo.advances.com.br`

---

## Resumo – hosting completo na AWS

| Etapa | Onde | O quê |
|-------|------|--------|
| DNS | **Route 53** | Hosted zone **advances.com.br** |
| Registro.br | Painel do domínio | Servidores DNS = 4 nameservers da Route 53 |
| Web (SIGEO) | **Amplify** + Route 53 | **sigeo.advances.com.br** → Amplify |
| API (SIGEO) | **ACM (us-east-1)** + **CloudFront** + Route 53 | **api.sigeo.advances.com.br** → CloudFront |
| CORS | ECS (CORS_ORIGIN) | `https://sigeo.advances.com.br` |
| Front | Amplify (VITE_API_URL) | `https://api.sigeo.advances.com.br` |
| Mobile | env.ts ou .env | `https://api.sigeo.advances.com.br` |

Com isso, **DNS, web e API** ficam 100% na AWS; o Registro.br só mantém o registro do domínio **advances.com.br** apontando para os nameservers da Route 53.
