// Custom Next.js server with Socket.io integrated
// Run with: node server.mjs  (replaces `next dev` / `next start`)
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000');

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Fix HTTP 431 — increase header size tolerance
    req.socket.setMaxListeners(0);
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // ── Socket.io attached to the SAME server ──────────────────────────
  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Track online users
  const onlineUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    // User comes online
    socket.on('user:online', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });

    // Join a chat room
    socket.on('room:join', (roomId) => socket.join(roomId));
    socket.on('room:leave', (roomId) => socket.leave(roomId));

    // Broadcast message to room
    socket.on('message:send', ({ roomId, message }) => {
      socket.to(roomId).emit('message:receive', message);
    });

    // Typing indicators
    socket.on('typing:start', ({ roomId, userId }) => {
      socket.to(roomId).emit('typing:start', { userId });
    });
    socket.on('typing:stop', ({ roomId, userId }) => {
      socket.to(roomId).emit('typing:stop', { userId });
    });

    // Interest notification to a specific user
    socket.on('interest:notify', ({ toUserId, fromUser }) => {
      const targetSocket = onlineUsers.get(toUserId);
      if (targetSocket) io.to(targetSocket).emit('interest:received', { fromUser });
    });

    // Live location update
    socket.on('location:update', ({ roomId, msgId, latitude, longitude }) => {
      socket.to(roomId).emit('location:update', { msgId, latitude, longitude });
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('users:online', Array.from(onlineUsers.keys()));
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`✅ Ready on http://${hostname}:${port}`);
    console.log(`🔌 Socket.io running on same port (path: /api/socket)`);
  });
});
