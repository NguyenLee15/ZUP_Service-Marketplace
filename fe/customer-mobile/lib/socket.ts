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
  if (chatSocket && !chatSocket.disconnected) return chatSocket;
  if (!chatSocket) {
    chatSocket = await createSocket('/chat');
  } else if (chatSocket.disconnected) {
    chatSocket.connect();
  }
  return chatSocket;
};

export const getNotifSocket = async (): Promise<Socket> => {
  if (notifSocket && !notifSocket.disconnected) return notifSocket;
  if (!notifSocket) {
    notifSocket = await createSocket('/notifications');
  } else if (notifSocket.disconnected) {
    notifSocket.connect();
  }
  return notifSocket;
};

export const getTrackingSocket = async (): Promise<Socket> => {
  if (trackingSocket && !trackingSocket.disconnected) return trackingSocket;
  if (!trackingSocket) {
    trackingSocket = await createSocket('/tracking');
  } else if (trackingSocket.disconnected) {
    trackingSocket.connect();
  }
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
