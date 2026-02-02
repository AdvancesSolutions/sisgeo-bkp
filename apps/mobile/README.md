# SIGEO Mobile

App React Native (Expo) do monorepo SIGEO. Consome a API já publicada na AWS e reaproveita `@sigeo/shared`.

## Pré-requisitos

- Node 18+
- pnpm
- Expo Go no celular (ou emulador)

## Configuração de ambiente

1. **URL da API**
   - Copie `.env.development` e ajuste `EXPO_PUBLIC_API_URL`:
     - Local: use o IP da sua máquina na rede (ex: `http://192.168.1.10:3000`) para testar no dispositivo.
     - Staging/Produção: use a URL do App Runner (ex: `https://xxx.us-east-1.awsapprunner.com`).
   - Para produção, use `.env.production` com a URL real da API na AWS.

2. **Alias @shared**
   - O app usa o pacote `@sigeo/shared` do monorepo (tipos, schemas Zod, DTOs).
   - No `tsconfig.json` e no `babel.config.js` o alias `@shared` aponta para `../../packages/shared`.
   - Em imports use `@sigeo/shared` (nome do pacote no workspace).

## Como rodar localmente

Os scripts `start` e `dev` usam `expo start --offline` para **não exibir o prompt de login do Expo** (modo anônimo). Para usar tunnel/LAN com login, rode `pnpm start:lan` ou `npx expo start`.

Na raiz do monorepo:

```bash
pnpm i
pnpm --filter @sigeo/shared build
pnpm --filter @sigeo/mobile dev
```

Ou apenas no mobile:

```bash
cd apps/mobile
pnpm i
pnpm dev
```

Abra o projeto no Expo Go (QR code no terminal). Para Android/iOS nativo use `pnpm android` ou `pnpm ios` (com ambiente configurado).

## Estrutura

- `src/app` – navegação (AuthStack + AppTabs)
- `src/screens` – telas (Login, Home, Tasks, TaskDetail, Ponto, PhotoStub)
- `src/features` – auth, tasks, timeclock, employees (hooks + context)
- `src/services` – apiClient (axios + interceptors), authService
- `src/utils` – env, helpers

## Funcionalidades MVP

- **Auth:** Login (email/senha), tokens em AsyncStorage, interceptor 401 com refresh.
- **Home:** Status do dia, check-in/check-out, “Minhas tarefas hoje”.
- **Ponto:** Check-in/check-out com GPS (Expo Location); bloqueio se GPS falhar.
- **Tarefas:** Lista, detalhe, Iniciar/Concluir serviço (PATCH status; stub de foto).
- **Foto:** Stub preparado para Camera + upload multipart para `/upload/photo`.

## Próximos passos

- Implementar Camera (Expo Camera) e upload real para `/upload/photo`.
- Fila offline mínima para check-in/out e start/finish; sincronizar ao voltar online.
- Build EAS: `eas build --platform all` (configurar `app.json` / `eas.json`).
