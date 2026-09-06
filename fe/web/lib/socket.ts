import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { ensureAccessToken } from '@/lib/auth-token';

let chatSocket: Socket | null = null;
let notifSocket: Socket | null = null;
let trackingSocket: Socket | null = null;

const createSocket = (namespace: string): Socket => {
  const url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
  
  return io(`${url}${namespace}`, {
    autoConnect: false,
    auth: (cb) => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        cb({ token });
      } else {
        ensureAccessToken()
          .then((newToken) => cb({ token: newToken }))
          .catch(() => cb({ token: null }));
      }
    },
    transports: ['websocket', 'polling'],
  });
};

export const getChatSocket = (): Socket => {
  if (chatSocket) return chatSocket;
  chatSocket = createSocket('/chat');
  return chatSocket;
};

export const getNotifSocket = (): Socket => {
  if (notifSocket) return notifSocket;
  notifSocket = createSocket('/notifications');
  return notifSocket;
};

export const getTrackingSocket = (): Socket => {
  if (trackingSocket) return trackingSocket;
  trackingSocket = createSocket('/tracking');
  return trackingSocket;
};

export async function connectSockets(): Promise<void> {
  let token = useAuthStore.getState().accessToken;
  if (!token) {
    token = await ensureAccessToken();
  }
  if (!token) return;

  const cSocket = getChatSocket();
  if (!cSocket.connected) cSocket.connect();

  const nSocket = getNotifSocket();
  if (!nSocket.connected) nSocket.connect();
}

export function disconnectSockets(): void {
  chatSocket?.disconnect();
  notifSocket?.disconnect();
  trackingSocket?.disconnect();
  chatSocket = null;
  notifSocket = null;
  trackingSocket = null;
}

