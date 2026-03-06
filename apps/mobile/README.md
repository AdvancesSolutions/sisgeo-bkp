# SIGEO Mobile

App React Native (Expo) do monorepo SIGEO. **Integrado aos mesmos dados e ao painel em produção na AWS**: usa a mesma API (CloudFront) que o painel web (`sigeo.advances.com.br`). Consome a API publicada na AWS e reaproveita `@sigeo/shared`.

## Pré-requisitos

- Node 18+
- pnpm
- Expo Go no celular (ou emulador)

## Configuração de ambiente

1. **URL da API**
   - Por padrão (`.env.development` e `.env.production`) o app aponta para a **API de produção** (CloudFront: `https://dapotha14ic3h.cloudfront.net`), ou seja, **os mesmos dados do dashboard em produção**.
   - Para testar contra API local: em `.env.development` defina `EXPO_PUBLIC_API_URL` com o IP da sua máquina na rede (ex: `http://192.168.1.10:3000`).

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

## Gerar APK localmente (sem EAS)

Gera um APK instalável sem usar Expo Application Services. Requisitos na máquina:

- **Node 18+** e **pnpm**
- **JDK 17** (OpenJDK ou Oracle)
- **Android SDK** (Android Studio ou só command-line tools), com `ANDROID_HOME` configurado

Na raiz do monorepo ou em `apps/mobile`:

```bash
pnpm --filter @sigeo/mobile apk
```

Ou dentro de `apps/mobile`:

```bash
cd apps/mobile
pnpm apk
```

O script roda `expo prebuild --platform android` (gera a pasta `android/`) e em seguida `assembleRelease` com keystore de debug. O **APK** fica em:

`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

Copie para o celular e instale, ou use `adb install app-release.apk`. O APK é standalone (JS embutido), não precisa do Metro rodando. Para publicar na Play Store, configure seu próprio keystore em `android/app/build.gradle`.

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

## EAS Update (OTA)

O app está configurado para **atualizações OTA** (sem nova APK). Alterações de layout, JS/TS e lógica chegam via OTA; não é necessário gerar nova APK.

### Comandos para publicar OTA

```bash
# Produção (app na loja)
pnpm update:prod

# Staging (homologação)
pnpm update:staging

# Desenvolvimento (uso interno)
pnpm update:dev
```

### OTA vs Rebuild (checklist)

| Via OTA (update:prod)        | Via nova APK (prebuild + apk)    |
|-----------------------------|-----------------------------------|
| Layout, componentes React    | Novas dependências nativas        |
| Lógica JS/TS                | Permissões (AndroidManifest, etc.)|
| Textos, navegação, validação| Plugins Expo novos                |
| Estilos (Tailwind)          | Mudanças em app.config (ícone, splash) |
| Imagens/assets estáticos    | Mudança de runtimeVersion/version |

Ver **docs/EAS-UPDATE-OTA.md** para configuração inicial e fluxo completo.

## Próximos passos

- Implementar Camera (Expo Camera) e upload real para `/upload/photo`.
- Fila offline mínima para check-in/out e start/finish; sincronizar ao voltar online.
