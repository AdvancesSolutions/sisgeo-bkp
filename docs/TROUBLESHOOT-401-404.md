# Troubleshooting: 401 e 404 na API em produção

## 401 em /auth/me

Quando o front faz `GET /auth/me` e recebe **401 Unauthorized**, as causas comuns:

| Causa | Solução |
|------|---------|
| **Token expirado ou inválido** | Fazer logout e login de novo. Ou limpar `localStorage` (chaves `sigeo_accessToken`, `sigeo_refreshToken`) e logar de novo. |
| **Sessão antiga em outro navegador/device** | O token pode ter sido invalidado no servidor. Limpar storage e logar de novo. |
| **CloudFront não encaminha Authorization** | Conferir no CloudFront: Behavior padrão com **Origin Request Policy** = `Managed-AllViewerExceptHostHeader` (encaminha todos os headers, incluindo Authorization). Ver `docs/CLOUDFRONT-AUTH.md`. |

## 404 em /employee-access

O endpoint `/employee-access` exige que a API em produção tenha o módulo `EmployeeAccessModule` no deploy mais recente.

**Verificar versão da API em produção:**
```bash
curl https://dapotha14ic3h.cloudfront.net/version
```
Resposta esperada: `{"build":"...","hasEmployeeAccess":true}`

**Se retornar 404 no /version ou `hasEmployeeAccess: false`:**
1. O deploy da API está desatualizado.
2. O workflow do GitHub Actions falha no step **Deploy to ECS** (Cluster not found) por credenciais.
3. **Solução:** rodar manualmente o deploy:
   ```powershell
   .\scripts\ecs-force-deploy.ps1
   ```
4. Aguardar 1–2 min para o rolling update completar.
5. Invalidar cache do CloudFront: Console AWS → CloudFront → Invalidations → Create → Paths: `/*`

## GitHub Actions: Cluster not found

O step **Deploy to ECS** falha com `ClusterNotFoundException` porque as credenciais (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) nos secrets do repositório não pertencem à conta AWS onde está o cluster (`320674390105`).

**Corrigir:** GitHub → Repo → Settings → Secrets and variables → Actions. Conferir que `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` apontam para a conta que tem `sigeo-cluster` em `sa-east-1`.
