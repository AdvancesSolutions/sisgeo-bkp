# EAS Update (OTA) – SIGEO Mobile

Atualizações Over-The-Air permitem enviar alterações de JS/TS, layout, estilos e textos **sem gerar nova APK/IPA**.

## Dependência expo-updates

O pacote `expo-updates` já está em `apps/mobile/package.json`. Instale as dependências:

```bash
cd d:\SERVIDOR\SISGEO
pnpm install
```

Se houver `ERR_PNPM_INCLUDED_DEPS_CONFLICT`, tente limpar e reinstalar:

```bash
Remove-Item -Recurse -Force node_modules
pnpm install
```

## Configuração inicial (uma vez)

### 1. Instalar EAS CLI e login

```bash
npm install -g eas-cli
eas login
```

### 2. Inicializar projeto EAS

```bash
cd apps/mobile
eas init
```

Escolha criar um novo projeto ou vincular a um existente. Isso preenche o `projectId` em `app.config.js` (via `EAS_PROJECT_ID` ou `.eas.json`).

### 3. Configurar updates no projeto

```bash
cd apps/mobile
eas update:configure
```

Isso adiciona/atualiza entradas nativas (AndroidManifest, Expo.plist) para EAS Update.

### 4. Re-gerar o projeto nativo (se já existir `android/`)

```bash
cd apps/mobile
npx expo prebuild --platform android --clean
```

Depois rode o build do APK:

```bash
pnpm apk
```

---

## Publicar update OTA

**Importante:** O script `update:prod` (e demais) executa automaticamente `pnpm --filter @sigeo/shared build` antes de publicar. Se o build falhar com **EPERM** ou **@rollup/rollup-win32-x64-msvc**:

1. Feche **todos** os terminais com Metro, Expo, API ou Web rodando
2. Feche o Cursor/VS Code (opcional, mas às vezes trava arquivos)
3. Exclua `node_modules` e execute: `pnpm install`
4. Depois: `pnpm --filter @sigeo/shared build` e `pnpm --filter @sigeo/mobile update:prod`

### Produção

```bash
cd apps/mobile
eas update --channel production --message "fix layout dashboard"
```

ou (recomendado – faz build do shared automaticamente):

```bash
pnpm --filter @sigeo/mobile update:prod
```

### Desenvolvimento / staging

```bash
cd apps/mobile
eas update --channel development --message "ajuste UI mobile"
```

---

## O que pode ser atualizado via OTA

- Layout e componentes React
- Lógica JS/TS
- Estilos (Tailwind/NativeWind)
- Textos e fluxos
- Validações
- Imagens e assets estáticos

## O que exige nova APK

- Novas dependências nativas
- Mudanças em `app.config.js` que alterem permissões, ícones, splash
- Mudanças em `runtimeVersion` (ex.: novo `policy` ou `native`)

---

## Fluxo no app

1. **Ao abrir**: o `UpdateManager` consulta `GET /app-config` e verifica OTA.
2. **Update crítico** (`forceUpdate=true`): baixa e recarrega imediatamente.
3. **minRuntimeVersion > atual**: exibe tela bloqueante "Atualize na loja".
4. **Update normal**: baixa em background e mostra modal "Atualização pronta — Reiniciar agora".
5. **Ao voltar ao app** (AppState active): nova verificação após ~1h desde a última.

---

## Estratégia para SIGEO

| Ambiente   | Canal       | Uso                              |
|-----------|-------------|----------------------------------|
| Production| production  | App publicado / APK em campo     |
| Staging   | staging     | Homologação / testes internos    |
| Dev       | development | Desenvolvimento com dev client   |

### Versionamento

- `version` em `app.config.js`: 1.0.0, 1.0.1, etc.
- `runtimeVersion`: `{ policy: "appVersion" }` – acompanha a versão do app.
- Ao mudar versão no código (ex.: 1.0.0 → 1.0.1), gere nova APK para que o cliente receba updates OTA dessa nova linha.

### Rollback

```bash
eas update:republish --branch production --message "rollback"
```

---

## Arquivos principais

| Arquivo | Descrição |
|---------|-----------|
| `apps/mobile/eas.json` | Profiles de build e canais (development, staging, production) |
| `apps/mobile/app.config.js` | Config Expo + runtimeVersion + updates |
| `apps/mobile/src/services/update/UpdateService.ts` | API de check/fetch/reload + update crítico |
| `apps/mobile/src/features/updates/UpdateManager.tsx` | Verificação automática + modal "Atualização pronta" |
| `apps/mobile/src/hooks/useUpdateManager.ts` | Hook que gerencia OTA e política de update crítico |

---

## Checklist

- [ ] `eas login` e `eas init` executados
- [ ] `eas update:configure` executado
- [ ] `projectId` real em `app.config.js` (não "placeholder")
- [ ] APK gerado após prebuild com updates configurado
- [ ] Primeiro update OTA publicado e testado em dispositivo real
