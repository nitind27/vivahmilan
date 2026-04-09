'use client';
import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    // Same origin as Next.js — no separate port needed
    socket = io({
      path: '/api/socket',
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket(userId) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.once('connect', () => s.emit('user:online', userId));
  } else {
    s.emit('user:online', userId);
  }
  return s;
}

export function disconnectSocket() {
  socket?.connected && socket.disconnect();
}
