/**
 * server.mjs — Production-ready server with:
 *  - Cluster mode (uses all CPU cores)
 *  - Gzip compression
 *  - In-memory response caching
 *  - Rate limiting per IP
 *  - Keep-alive + connection reuse
 *  - Graceful shutdown
 */

import cluster from 'cluster';
import os from 'os';
import { setupPrimary } from '@socket.io/cluster-adapter';
import { config } from 'dotenv';
config();

const isDev = process.env.NODE_ENV !== 'production';
const NUM_WORKERS = isDev ? 1 : (
  process.env.WEB_CONCURRENCY
    ? parseInt(process.env.WEB_CONCURRENCY)
    : Math.min(os.cpus().length, 4)
);

// In dev mode, skip cluster entirely — run as single process
if (isDev) {
  await startWorker();
} else if (cluster.isPrimary) {
  console.log(`🚀 Primary ${process.pid} — spawning ${NUM_WORKERS} workers`);

  // Setup Socket.IO cluster adapter on primary (IPC-based, no Redis needed)
  setupPrimary();

  for (let i = 0; i < NUM_WORKERS; i++) spawnWorker(i);

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`⚠️  Worker ${worker.process.pid} died (${signal || code}). Restarting…`);
    setTimeout(() => spawnWorker(), 1000);
  });

  process.on('SIGTERM', () => {
    for (const id in cluster.workers) cluster.workers[id].send('shutdown');
    setTimeout(() => process.exit(0), 5000);
  });

  function spawnWorker(index) {
    const w = cluster.fork({ WORKER_INDEX: index ?? Object.keys(cluster.workers).length });
    console.log(`  ✅ Worker ${w.process.pid} started`);
  }
} else {
  await startWorker();
}

async function startWorker() {
  const { createServer } = await import('http');
  const { parse } = await import('url');
  const { createReadStream, statSync, existsSync } = await import('fs');
  const { join, extname } = await import('path');
  const { default: next } = await import('next');
  const { Server } = await import('socket.io');
  const { createAdapter } = await import('@socket.io/cluster-adapter');
  const { default: compression } = await import('compression');
  const { default: NodeCache } = await import('node-cache');

  // Ensure lastSeen column exists (only run on first worker)
  if (process.env.WORKER_INDEX === '0' || process.env.WORKER_INDEX === undefined) {
    try {
      const { pool } = await import('./lib/db.js');
      await pool.execute("ALTER TABLE `user` ADD COLUMN `lastSeen` DATETIME NULL DEFAULT NULL");
      console.log('✅ lastSeen column added to user table');
    } catch (e) {
      // Column already exists (error code 1060) — that's fine
      if (e.errno !== 1060) console.warn('lastSeen column check:', e.message);
    }
  }

  const dev = process.env.NODE_ENV !== 'production';
  const port = parseInt(process.env.PORT || '3005');
  const hostname = process.env.HOSTNAME || 'localhost';

  // In-memory cache — longer TTL for static data
  const apiCache = new NodeCache({ stdTTL: 300, checkperiod: 120, useClones: false });

  // Rate limiter (per IP)
  const rateLimitMap = new Map();
  const RATE_LIMIT = 200;
  const RATE_WINDOW = 60_000;

  function isRateLimited(ip) {
    const now = Date.now();
    let entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
      return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT;
  }

  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
  }, RATE_WINDOW);

  const compress = compression({ level: 6, threshold: 1024 });

  const MIME = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.webp': 'image/webp',
    '.gif': 'image/gif', '.pdf': 'application/pdf',
  };

  // Routes safe to cache (public, non-user-specific)
  const CACHEABLE = [
    '/api/profile-options',
    '/api/location/countries',
    '/api/location/states',
    '/api/location/cities',
    '/api/admin/plans',
  ];

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();
  await app.prepare();

  const httpServer = createServer((req, res) => {
    req.socket.setKeepAlive(true, 5000);
    req.socket.setMaxListeners(0);

    // Rate limiting
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
      || req.socket.remoteAddress || 'unknown';

    if (isRateLimited(ip)) {
      res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '60' });
      res.end(JSON.stringify({ error: 'Too many requests. Please slow down.' }));
      return;
    }

    // Compression
    compress(req, res, () => {});

    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Serve /uploads/* directly
    if (pathname?.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'public', pathname);
      if (existsSync(filePath)) {
        const ext = extname(filePath).toLowerCase();
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        try {
          const stat = statSync(filePath);
          res.setHeader('Content-Length', stat.size);
          createReadStream(filePath).pipe(res);
        } catch { res.writeHead(500); res.end('Error reading file'); }
        return;
      }
      res.writeHead(404); res.end('Not found');
      return;
    }

    // API response caching (GET only, safe routes)
    if (req.method === 'GET' && CACHEABLE.some(r => pathname?.startsWith(r))) {
      const cacheKey = req.url;
      const cached = apiCache.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Cache', 'HIT');
        res.writeHead(200);
        res.end(cached);
        return;
      }
      const chunks = [];
      const origEnd = res.end.bind(res);
      res.end = (chunk) => {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        if (res.statusCode === 200) apiCache.set(cacheKey, Buffer.concat(chunks).toString());
        res.setHeader('X-Cache', 'MISS');
        return origEnd(chunk);
      };
    }

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Worker-PID', process.pid.toString());

    handle(req, res, parsedUrl);
  });

  // Socket.io
  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    ...(dev ? {} : { adapter: createAdapter() }),
    cors: {
      origin: process.env.NEXTAUTH_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    connectTimeout: 10000,
  });

  const onlineUsers = new Map();
  const lastSeenMap = new Map(); // userId -> ISO timestamp

  io.on('connection', (socket) => {
    socket.on('user:online', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      lastSeenMap.delete(userId); // they're online now
      io.emit('users:online', Array.from(onlineUsers.keys()));
      io.emit('users:lastseen', Object.fromEntries(lastSeenMap));
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
      if (targetSocket) io.to(targetSocket).emit('interest:received', { fromUser });
    });

    socket.on('location:update', ({ roomId, msgId, latitude, longitude }) => {
      socket.to(roomId).emit('location:update', { msgId, latitude, longitude });
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        const now = new Date().toISOString();
        onlineUsers.delete(socket.userId);
        lastSeenMap.set(socket.userId, now);
        io.emit('users:online', Array.from(onlineUsers.keys()));
        io.emit('users:lastseen', Object.fromEntries(lastSeenMap));

        // Persist lastSeen to DB
        import('./lib/db.js').then(({ execute }) => {
          execute('UPDATE `user` SET lastSeen = ? WHERE id = ?', [new Date(), socket.userId]).catch(() => {});
        }).catch(() => {});
      }
    });
  });

  // Graceful shutdown (only in cluster worker mode)
  if (process.send) {
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        httpServer.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 3000);
      }
    });
  }

  // Tune for high concurrency
  httpServer.keepAliveTimeout = 65000;
  httpServer.headersTimeout = 66000;
  httpServer.maxConnections = 10000;

  httpServer.listen(port, () => {
    console.log(`  🔧 Worker ${process.pid} ready on http://${hostname}:${port}`);
    console.log(`  🔌 Socket.io on /api/socket`);
  });
}
