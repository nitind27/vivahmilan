// ✅ LOAD ENV (MOST IMPORTANT)
import { config } from 'dotenv';
config({
  path: '.env.production'
});

// Custom Next.js server with Socket.io integrated
import { createServer } from 'http';
import { parse } from 'url';
import { createReadStream, statSync, existsSync } from 'fs';
import { join, extname } from 'path';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // VPS pe better hai
const port = parseInt(process.env.PORT || '3006');

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// MIME types for uploaded files
const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp',
  '.gif': 'image/gif', '.pdf': 'application/pdf',
};

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    req.socket.setMaxListeners(0);
    const parsedUrl = parse(req.url, true);

    // ── Serve /uploads/* directly ──────────────────────────
    if (parsedUrl.pathname?.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'public', parsedUrl.pathname);
      if (existsSync(filePath)) {
        const ext = extname(filePath).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=31536000');

        try {
          const stat = statSync(filePath);
          res.setHeader('Content-Length', stat.size);
          createReadStream(filePath).pipe(res);
        } catch {
          res.writeHead(500);
          res.end('Error reading file');
        }
        return;
      } else {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
    }

    handle(req, res, parsedUrl);
  });

  // ── Socket.io ──────────────────────────
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

  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    socket.on('user:online', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });

    socket.on('room:join', (roomId) => socket.join(roomId));
    socket.on('room:leave', (roomId) => socket.leave(roomId));

    socket.on('message:send', ({ roomId, message }) => {
      socket.to(roomId).emit('message:receive', message);
    });

    socket.on('message:read', ({ roomId, readerId }) => {
      socket.to(roomId).emit('message:read', { roomId, readerId });
    });

    socket.on('typing:start', ({ roomId, userId }) => {
      socket.to(roomId).emit('typing:start', { userId });
    });

    socket.on('typing:stop', ({ roomId, userId }) => {
      socket.to(roomId).emit('typing:stop', { userId });
    });

    socket.on('interest:notify', ({ toUserId, fromUser }) => {
      const targetSocket = onlineUsers.get(toUserId);
      if (targetSocket) {
        io.to(targetSocket).emit('interest:received', { fromUser });
      }
    });

    socket.on('location:update', ({ roomId, msgId, latitude, longitude }) => {
      socket.to(roomId).emit('location:update', {
        msgId,
        latitude,
        longitude
      });
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('users:online', Array.from(onlineUsers.keys()));
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`🚀 Server running on http://${hostname}:${port}`);
    console.log(`📡 Socket.io running on /api/socket`);
    console.log(`🟢 DB HOST: ${process.env.DATABASE_HOST}`);
  });
});