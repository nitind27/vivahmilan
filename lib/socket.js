'use client';
import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io({
      path: '/api/socket',
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(userId) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.once('connect', () => {
      console.log('[Socket] Connected:', s.id);
      s.emit('user:online', userId);
    });
    s.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });
  } else {
    s.emit('user:online', userId);
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
