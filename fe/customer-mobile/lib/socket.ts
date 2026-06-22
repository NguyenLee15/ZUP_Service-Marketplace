/**
 * Socket.io singleton để kết nối /chat, /notifications, /tracking namespaces
 * Tránh tạo nhiều kết nối thừa khi chuyển đổi qua lại giữa các màn hình
 */
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../constants/api';
import { storage } from './storage';

let chatSocket: Socket | null = null;
let notifSocket: Socket | null = null;
let trackingSocket: Socket | null = null;

const createSocket = async (namespace: string): Promise<Socket> => {
  const socket = io(`${WS_URL}${namespace}`, {
    auth: (cb) => {
      storage.getAccessToken().then(token => cb({ token }));
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  });
  return socket;
};

export const getChatSocket = async (): Promise<Socket> => {
  if (chatSocket?.connected) return chatSocket;
  chatSocket = await createSocket('/chat');
  return chatSocket;
};

export const getNotifSocket = async (): Promise<Socket> => {
  if (notifSocket?.connected) return notifSocket;
  notifSocket = await createSocket('/notifications');
  return notifSocket;
};

export const getTrackingSocket = async (): Promise<Socket> => {
  if (trackingSocket?.connected) return trackingSocket;
  trackingSocket = await createSocket('/tracking');
  return trackingSocket;
};

export const disconnectAll = () => {
  chatSocket?.disconnect();
  notifSocket?.disconnect();
  trackingSocket?.disconnect();
  chatSocket = null;
  notifSocket = null;
  trackingSocket = null;
};
