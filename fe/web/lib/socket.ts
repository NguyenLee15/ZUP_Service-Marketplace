import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

let chatSocket: Socket | null = null;
let notifSocket: Socket | null = null;
let trackingSocket: Socket | null = null;

const createSocket = (namespace: string): Socket => {
  const token = useAuthStore.getState().accessToken;
  const url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
  
  return io(`${url}${namespace}`, {
    autoConnect: false,
    auth: { token },
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

export function connectSockets(): void {
  const token = useAuthStore.getState().accessToken;
  if (!token) return;

  const cSocket = getChatSocket();
  cSocket.auth = { token };
  if (!cSocket.connected) cSocket.connect();

  const nSocket = getNotifSocket();
  nSocket.auth = { token };
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

