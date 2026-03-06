import { io, type Socket } from 'socket.io-client';
import { authStore } from '@/auth/authStore';

function getSocketUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      return window.location.origin;
    }
  }
  return window.location.origin;
}

export function createDigitalTwinSocket(): Socket {
  const token = authStore.getAccessToken();
  const url = getSocketUrl();
  return io(`${url}/digital-twin`, {
    auth: { token },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  });
}
