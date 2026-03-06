# Integração SIGEO Web ↔ Mobile Nativo

## 1. Sincronização de Notificações (FCM)

### Mobile (Expo - SIGEO-mobile)
- **expo-notifications** já configurado
- Token registrado ao abrir o app
- **Fluxo atualizado**: após login e fetch do dashboard, o token é enviado para o backend com o **ID real do usuário** (vindo de `GET /dashboard` → `usuario.id`)
- Endpoint: `POST /users/me/push-token` com `{ token, platform }`
- **Importante**: Push só funciona em APK/IPA real. Testar com `eas build` — não funciona no Expo Go nem no browser.

### Web (Capacitor - rota /mobile)
- **@capacitor/push-notifications** para builds híbridos
- Endpoint: `POST /push/register`
- O backend envia notificações quando o gestor atribui tarefas

---

## 2. Rota /mobile e UX Nativa

- **TechnicianMobile** em `src/pages/TechnicianMobile.tsx`
- **Safe area** implementada com `env(safe-area-inset-*)` no viewport
- `index.html`: `viewport-fit=cover` para entalhes (notch)
- Redirecionamento automático de dispositivos móveis para `/mobile` (Login, Index)

---

## 3. Geolocalização no Check-in

### Mobile (Expo)
- **expo-location** já integrado
- `handleCheckIn`: obtém coordenadas via `Location.getCurrentPositionAsync()`
- Envia para: `POST /timeclock/checkin` com `{ lat, lng, timestamp }`
- Modo offline: enfileira na fila local → sincroniza ao voltar online

### Web (TechnicianMobile - Capacitor)
- Prioridade: **@capacitor/geolocation** quando disponível (build nativo)
- Fallback: `navigator.geolocation` (browser/PWA)
- Mesmo payload e endpoint

---

## 4. Endpoints Alinhados

| Ação        | Mobile                     | Web                         |
|-------------|----------------------------|-----------------------------|
| Check-in    | POST /timeclock/checkin    | POST /timeclock/checkin     |
| Push token  | POST /users/me/push-token  | POST /push/register         |
| Dashboard   | GET /dashboard             | -                           |

---

## 5. Status de Publicação

| Recurso            | Status no SIGEO                 | Ação necessária                    |
|--------------------|---------------------------------|------------------------------------|
| Notificações       | Configurado (Push/FCM)          | Testar em APK real                 |
| Login              | Integrado com SecureStore       | Persistência OK                     |
| Check-in GPS       | Implementado (Mobile + Web)      | Gestor vê posição no mapa           |
| Rota /mobile       | Criada (TechnicianMobile)       | Safe area + viewport OK             |
