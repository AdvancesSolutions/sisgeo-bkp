# SGO – Arquitetura e Especificação Técnica

## 1. Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Backend** | NestJS (Node.js/TypeScript) | 11.x |
| **ORM** | TypeORM | 0.3.x |
| **Banco** | PostgreSQL | 16 |
| **API** | REST + WebSockets (Socket.io) | - |
| **Auth** | JWT + Refresh Token | - |
| **Web** | React 19 + Vite 7 + MUI 7 | - |
| **Mobile** | React Native + Expo | 54 |
| **State/Cache** | TanStack Query (React Query) | 5.x |
| **Offline** | TanStack Query + AsyncStorage | - |
| **PDF** | PDFKit + ExcelJS | - |
| **Imagens** | Sharp (server) + browser-image-compression (client) | - |
| **Infra** | Terraform (AWS) | 1.5+ |
| **CI/CD** | GitHub Actions | - |

---

## 2. Estrutura do Monorepo

```
SISGEO/
├── apps/
│   ├── api/                    # NestJS API
│   │   ├── src/
│   │   │   ├── common/        # Guards, filters, interceptors, decorators
│   │   │   ├── config/        # Database, env
│   │   │   ├── db/            # Migrations, bootstrap, seed
│   │   │   ├── entities/      # TypeORM entities
│   │   │   └── modules/       # Feature modules (Clean Architecture)
│   │   │       ├── auth/
│   │   │       ├── audit/
│   │   │       ├── areas/
│   │   │       ├── employees/
│   │   │       ├── locations/
│   │   │       ├── materials/
│   │   │       ├── tasks/
│   │   │       ├── time-clock/
│   │   │       ├── upload/
│   │   │       ├── reports/
│   │   │       ├── supervision/   # WebSockets, painel tempo real
│   │   │       └── health/
│   │   ├── test/
│   │   └── Dockerfile
│   ├── web/                    # React SPA (Supervisores/Admin)
│   │   └── src/
│   │       ├── components/
│   │       ├── contexts/
│   │       ├── lib/
│   │       ├── pages/
│   │       └── ...
│   └── mobile/                 # Expo (Funcionários)
│       └── src/
│           ├── features/
│           ├── screens/
│           ├── services/
│           └── utils/
├── packages/
│   └── shared/                 # Schemas Zod, tipos, utils
├── infra/
│   └── terraform/              # RDS, S3, CloudFront, ECS
├── scripts/
│   ├── deploy-infra.sh
│   ├── deploy.sh
│   └── run-migrations-prod.ps1
└── docs/
```

---

## 3. Schema Completo do Banco

### 3.1 Diagrama ER (resumo)

```
users ──┬── audit_trail (FK user_id)
        └── employee_id → employees

employees ── unit_id → locations
locations ──┬── lat, lng, radius (geofencing)
            └── areas (location_id)

areas ──┬── risk_classification, cleaning_frequency
        └── tasks (area_id)

tasks ──┬── employee_id → employees
        ├── scheduled_date, scheduled_time
        ├── status, started_at, completed_at
        ├── estimated_minutes (tempo estimado)
        └── task_photos (task_id)

task_photos ── type (BEFORE|AFTER), url, key, s3_key

time_clocks ── employee_id, type, lat, lng, photo_url, photo_key

materials ── stock, unit
cleaning_types
audit_logs
audit_trail (IP, User-Agent, status changes)
```

### 3.2 SQL Completo (Schema + Índices)

Ver arquivo: `docs/SGO-SCHEMA.sql`

### 3.3 Novos campos (Task)

- `estimated_minutes` – tempo estimado para cálculo de produtividade
- `started_at` – início da execução
- `completed_at` – conclusão da tarefa

---

## 4. RBAC (Perfis)

| Perfil | Acesso |
|--------|--------|
| **ADMIN** | Tudo, inclusive deletar logs, configurar sistema |
| **SUPERVISOR** | Tarefas, validação, relatórios, funcionários, áreas. Não deleta audit |
| **FUNCIONARIO** | Dashboard, minhas tarefas, ponto; não acessa validação, cadastros, audit |

---

## 5. Fluxos Principais

- **Evidências:** Mobile → compressão client → presigned URL S3 → upload direto
- **Check-in:** GPS + foto → validação geofencing (haversineDistance) → registro (ou CHECKIN_FORA_DE_AREA)
- **Offline:** TanStack Query persist + fila com payload+imagem base64 → retrySync ao detectar rede (NetInfo)
- **Relatórios:** PDF com logo, fotos, tabela auditoria
- **Motor de Escalas:** Validação de sobreposição de horários por funcionário/dia; tempo_estimado em tipos de limpeza
