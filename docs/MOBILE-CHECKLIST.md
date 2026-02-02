# Checklist e próximos passos – SIGEO Mobile

## O que foi entregue

### 1) Estrutura do monorepo
- **apps/mobile** criado com Expo (template blank-typescript).
- **pnpm-workspace.yaml** já inclui `apps/*` – o mobile entra automaticamente.
- Alias **@shared**: no mobile use o pacote **@sigeo/shared** (workspace). No `tsconfig.json` e no `babel.config.js` o alias `@shared` aponta para `../../packages/shared/src` para compatibilidade.

### 2) Stack mobile
- **Expo SDK 54**, TypeScript estrito.
- **React Navigation**: stack (Auth + Main) + bottom tabs (Home, Tasks, Ponto, Foto).
- **TanStack Query (React Query)** para cache de API.
- **Axios** com interceptors de auth (token + refresh em 401).
- **Zod** via `@sigeo/shared` (loginSchema, timeClockSchema, etc.).
- **Expo Location** (GPS) e **Expo Camera** (stub) – dependências instaladas.
- **AsyncStorage** para token/refresh/user.
- UI com **StyleSheet** (NativeWind deixado como dependência para uso futuro).

### 3) Funcionalidades MVP
| Item | Status |
|------|--------|
| **A) Auth** – Login email/senha, tokens em AsyncStorage, interceptor 401 com refresh | ✅ |
| **B) Home** – Status do dia, check-in/out, “Minhas tarefas hoje” | ✅ |
| **C) Ponto** – Check-in/out com GPS, bloqueio se GPS falhar | ✅ |
| **D) Tarefas** – Lista, detalhe, Iniciar/Concluir (PATCH status; stub foto) | ✅ |
| **E) Upload de foto** – Stub (tela preparada; Camera + multipart em implementação futura) | ✅ stub |
| **F) Offline** – Enfileirar e sincronizar (pendências) | ⏳ próximo passo |

### 4) Integração com AWS
- **EXPO_PUBLIC_API_URL** em `.env.development` e `.env.production`.
- **Produção**: use `https://dapotha14ic3h.cloudfront.net` (API em sa-east-1). Se não definir a variável, o app já usa essa URL por padrão.
- **Desenvolvimento local**: use o IP da sua máquina na rede em `.env.development` (ex: `http://192.168.1.10:3000`).
- **Erro "Network" / "network request failed"**: geralmente é URL errada (ex: localhost no dispositivo). Garanta que `.env.production` ou o fallback apontem para a API em produção.

### 5) Padrões de código
- TypeScript estrito.
- Pastas: **src/app** (navegação), **src/screens**, **src/components**, **src/features**, **src/services**, **src/utils**.
- **apiClient.ts** (axios + interceptors), **authService.ts**, hooks **useAuth**, **useTasks**, **useTimeclock**, **useEmployeesList** / **useMyEmployeeId** (MVP: primeiro funcionário da API).
- Layout consistente (tema escuro), estados loading/empty/error, feedback com **Alert** (toast/snackbar pode ser adicionado depois).

---

## Comandos para rodar local

```bash
# Na raiz do monorepo
pnpm i
pnpm --filter @sigeo/shared build
pnpm --filter @sigeo/mobile dev
# ou
pnpm dev:mobile
```

Abra no **Expo Go** (QR code no terminal). Para testar contra a API local, suba a API (`pnpm dev:api`) e use em `.env.development` o IP da sua máquina na rede como `EXPO_PUBLIC_API_URL`.

---

## Próximos passos sugeridos

1. **Camera e upload real**
   - Usar **Expo Camera** na tela de foto.
   - Enviar multipart para **POST /upload/photo** com metadata (lat, lng, timestamp, deviceId).

2. **Offline mínimo**
   - Enfileirar check-in/out e start/finish quando sem internet.
   - Sincronizar ao voltar online e exibir “Pendências para sincronizar”.

3. **Build EAS**
   - Criar **eas.json** (build profiles dev/staging/prod).
   - `eas build --platform android` (e ios quando aplicável).
   - Configurar **app.json** → `extra.eas.projectId` com o ID do projeto EAS.

4. **Vínculo User → Employee**
   - Hoje o ponto usa o **primeiro funcionário** da lista (GET /employees). Em produção: endpoint **GET /me** ou **GET /employees?userId=** na API, ou tela de “selecionar meu perfil” no app.

5. **Versões recomendadas pelo Expo**
   - Rodar `npx expo install --fix` em **apps/mobile** para alinhar dependências à SDK 54 (AsyncStorage, expo-camera, expo-location, react-native-screens, etc.).
