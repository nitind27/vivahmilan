'use client';
import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io({
      path: '/api/socket',
      autoConnect: true,          // connect immediately
      reconnection: true,
      reconnectionAttempts: Infinity,
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

  // Register user:online on every connect/reconnect
  const registerOnline = () => {
    s.emit('user:online', userId);
  };

  // Remove previous listener to avoid duplicates, then re-add
  s.off('connect', registerOnline);
  s.on('connect', registerOnline);

  // If already connected, register immediately
  if (s.connected) {
    s.emit('user:online', userId);
  }

  s.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
