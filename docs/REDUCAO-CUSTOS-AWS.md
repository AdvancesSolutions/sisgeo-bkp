# Redução de custos AWS – SIGEO

Ações já aplicadas e recomendações para manter o custo baixo.

---

## Ações já realizadas

| Ação | Efeito |
|------|--------|
| **Excluído RDS `sigeo-db-sa`** (sa-east-1) | Instância de teste não utilizada removida. |
| **Excluído RDS `sigeo-db`** (us-east-1) | Banco antigo removido; uso apenas do RDS em sa-east-1. |
| **Excluído app Amplify** em us-east-1 (d4eu378gsc65t) | Um único app em sa-east-1 evita cobrança duplicada de build/hosting. |
| **Excluído repositório ECR** em sa-east-1 | API roda em us-east-1 e usa ECR em us-east-1; sem armazenamento de imagem em sa-east-1. |
| **Backup RDS em 0** (sigeo-db, sa-east-1) | Sem snapshots automáticos; menor custo e **sem restauração pontual** (trade-off). |

---

## Recursos que permanecem (tudo em sa-east-1)

| Recurso | Região | Observação |
|---------|--------|------------|
| **RDS** `sigeo-db` | sa-east-1 | db.t3.micro, 20 GB, single-AZ, backup 0. |
| **ECS Fargate** `sigeo-api` | sa-east-1 | 0,25 vCPU, 512 MB (task mínima). |
| **ALB** `sigeo-alb` | sa-east-1 | Encaminha tráfego para ECS. |
| **CloudFront** | global | HTTPS na frente do ALB (evita mixed content). |
| **ECR** `sigeo-api` | sa-east-1 | Imagem `latest` da API. |
| **Amplify** app `sigeo` | sa-east-1 | Um app, branch `main`. |

**App Runner** em us-east-1 foi **excluído**; a API passou a rodar em ECS Fargate em sa-east-1.

---

## Recomendações adicionais

1. **RDS – backup**  
   Com retenção 0 não há backup automático. Para ter cópias sem gastar muito, pode usar retenção 1 dia ou fazer dump manual (ex.: `pg_dump`) e guardar em S3 ou fora da AWS.

2. **App Runner**  
   Não há opção menor que 1 vCPU / 2 GB. Para reduzir mais, seria preciso trocar por outro serviço (ex.: Lambda + API Gateway ou ECS Fargate com tarefa menor).

3. **Amplify**  
   Evite criar branches desnecessários; cada branch com build automático gera custo de build.

4. **Monitorar**  
   - **AWS Cost Explorer** e **Budgets** para alertas.  
   - **Billing** → **Free Tier** para ver o que ainda está no free tier.

5. **Parar em desenvolvimento**  
   Se não for usar por um tempo:  
   - **RDS**: pode parar (instâncias paradas são cobradas em geral por storage). Em contas novas, verifique se “stop” está disponível na sua região/tipo.  
   - **App Runner**: pausar não é suportado; para zerar custo de compute seria preciso excluir o serviço e recriar depois.

---

## Resumo

- Foram removidos: 2 RDS (sigeo-db-sa, sigeo-db us-east-1), 1 Amplify (us-east-1), 1 ECR (sa-east-1).  
- Backup do RDS em uso foi definido para 0 para evitar custo de snapshot.  
- O que resta é o mínimo necessário para o app atual (1 RDS, 1 App Runner, 1 ECR, 1 Amplify).
