# @sigeo/database

Schema Prisma para o SIGEO - Sistema de Gestão Operacional.

## Estrutura

- **User**: Usuários com perfis (ADMIN, SUPERVISOR, AUXILIAR)
- **Colaborador**: Funcionários vinculados a setores
- **Setor**: Áreas com geofencing (lat, long, raio), classificação de risco e QR Code
- **Tarefa**: Tarefas programadas com status e tempo estimado
- **ExecucaoTarefa**: Check-in/check-out com coordenadas, assinatura e `uuid_local` (offline)
- **ChecklistItem**: Itens de checklist por tarefa
- **Evidencia**: Fotos S3 com etapa (CHECKIN/CHECKOUT), metadata e `uuid_local` (offline)
- **LogAuditoria**: Registro de alterações (valor_antigo, valor_novo)
- **NaoConformidade**: Não conformidades com supervisor e status de correção

## Uso

```bash
# Instalar dependências
pnpm install

# Configurar .env (copiar de .env.example)
cp .env.example .env

# Gerar cliente Prisma
pnpm --filter @sigeo/database generate

# Migração inicial
pnpm --filter @sigeo/database migrate

# Seed (perfis + 3 setores)
pnpm --filter @sigeo/database seed
```

## Scripts

| Script | Descrição |
|--------|-----------|
| `generate` | Gera o Prisma Client |
| `migrate` | Executa migrações em dev |
| `migrate:deploy` | Aplica migrações em produção |
| `seed` | Popula banco com dados iniciais |
| `studio` | Abre Prisma Studio |

## Migração inicial

Com o PostgreSQL rodando e `DATABASE_URL` configurada:

```bash
pnpm --filter @sigeo/database migrate:deploy
pnpm --filter @sigeo/database seed
```

Ou use o script: `./scripts/migrate-initial.ps1` (Windows) ou `./scripts/migrate-initial.sh` (Linux/Mac).
