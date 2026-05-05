// ✅ LOAD ENV (MOST IMPORTANT)
import { config } from 'dotenv';
config({ path: '.env.production' });

// Custom Next.js server with Socket.io integrated
import { createServer } from 'http';
import { parse } from 'url';
import { createReadStream, statSync, existsSync } from 'fs';
import { join, extname } from 'path';
import next from 'next';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';

// ── DB pool — shared with lib/db.js via globalThis ──
function getDbPool() {
  if (!globalThis.__matrimonialDbPool) {
    globalThis.__matrimonialDbPool = mysql.createPool({
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      connectionLimit:       10,
      waitForConnections:    true,
      queueLimit:            0,
      enableKeepAlive:       true,
      keepAliveInitialDelay: 0,
      connectTimeout:        15000,
      timezone:              '+00:00',
    });
    console.log('✅ DB Pool Created (server.mjs):', process.env.DATABASE_HOST);
  }
  return globalThis.__matrimonialDbPool;
}

async function updateLastSeen(userId) {
  try {
    const pool = getDbPool();
    await pool.execute('UPDATE `user` SET lastSeen = NOW() WHERE id = ?', [userId]);
  } catch (err) {
    console.error('[Socket] lastSeen update error:', err.message);
  }
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3006');

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp',
  '.gif': 'image/gif', '.pdf': 'application/pdf',
};

// Global io accessor for API routes
global.getIO = () => global.__io || null;

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    req.socket.setMaxListeners(0);
    const parsedUrl = parse(req.url, true);
    const pathname = parsedUrl.pathname || '/';

    // ── START PREVIEW GATE ──────────────────────────────────
    // TO REMOVE: delete from here to END PREVIEW GATE comment
    const PREVIEW_COOKIE_NAME  = 'vd_preview_auth';
    const PREVIEW_COOKIE_VALUE = 'granted_2710';
    const BYPASS_PATHS = [
      '/welcome.html',
      '/_next/',
      '/favicon.ico',
      '/logo/',
      '/audio/',
      '/video/',
      '/images/',
      '/uploads/',
      '/api/auth/',
      '/api/flutter/',
      '/api/register',
      '/api/onboarding',
      '/api/kyc/',
      '/api/track',
      '/api/location/',
      '/api/profile-options',
      '/api/stories',
      '/api/maintenance-status',
      '/api/coupons/validate',
      '/api/admin/plans',
      '/api/admin/homepage/',
      '/register',
      '/verify-email',
      '/onboarding',
      '/login',
      '/forgot-password',
      '/kyc/',
    ];
    const isBypassed = BYPASS_PATHS.some(p => pathname.startsWith(p))
      || (pathname.includes('.') && !pathname.endsWith('.html'));

    if (!isBypassed) {
      const cookieHeader = req.headers.cookie || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';')
          .map(c => { const [k, ...v] = c.trim().split('='); return [k?.trim(), v.join('=').trim()]; })
          .filter(([k]) => k)
      );
      if (cookies[PREVIEW_COOKIE_NAME] !== PREVIEW_COOKIE_VALUE) {
        const redirectTo = encodeURIComponent(pathname);
        res.writeHead(302, { Location: `/welcome.html?login&redirect=${redirectTo}` });
        res.end();
        return;
      }
    }
    // ── END PREVIEW GATE ────────────────────────────────────

    // ── Serve /uploads/* directly ──────────────────────────
    if (pathname.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'public', pathname);
      if (existsSync(filePath)) {
        const ext = extname(filePath).toLowerCase();
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
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

    // ── Maintenance Mode Check ─────────────────────────────
    const MAINTENANCE_BYPASS = [
      '/maintenance', '/api/', '/_next', '/favicon', '/logo',
      '/images', '/uploads', '/audio', '/video', '/welcome',
      '/register', '/verify-email', '/onboarding', '/forgot-password', '/kyc/',
    ];
    const isMaintenanceBypassed =
      pathname.startsWith('/admin') ||
      pathname.startsWith('/login') ||
      MAINTENANCE_BYPASS.some(p => pathname.startsWith(p)) ||
      (pathname.includes('.') && !pathname.endsWith('.html'));

    if (!isMaintenanceBypassed) {
      try {
        const pool = getDbPool();
        const [rows] = await pool.execute(
          "SELECT value FROM siteconfig WHERE `key` = 'maintenance_mode' LIMIT 1"
        );
        // value '1' = LIVE, value '0' or missing = show maintenance
        const isLive = rows[0]?.value === '1';
        if (!isLive) {
          // Rewrite internally to /maintenance page via Next.js
          parsedUrl.pathname = '/maintenance';
          handle(req, res, parsedUrl);
          return;
        }
      } catch {
        // DB error — don't block
      }
    }

    handle(req, res, parsedUrl);
  });

  // ── Socket.io ──────────────────────────────────────────────
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

  // Store io globally so API routes can emit events
  global.__io = io;

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
      if (targetSocket) io.to(targetSocket).emit('interest:received', { fromUser });
    });

    socket.on('location:update', ({ roomId, msgId, latitude, longitude }) => {
      socket.to(roomId).emit('location:update', { msgId, latitude, longitude });
    });

    // ── Video KYC WebRTC Signaling ─────────────────────────────
    socket.on('kyc:join', ({ sessionId, role }) => {
      socket.join(`kyc:${sessionId}`);
      socket.kycSessionId = sessionId;
      socket.kycRole = role; // 'admin' | 'user'
      socket.to(`kyc:${sessionId}`).emit('kyc:peer-joined', { role });
    });

    socket.on('kyc:offer', ({ sessionId, offer }) => {
      socket.to(`kyc:${sessionId}`).emit('kyc:offer', { offer });
    });

    socket.on('kyc:answer', ({ sessionId, answer }) => {
      socket.to(`kyc:${sessionId}`).emit('kyc:answer', { answer });
    });

    socket.on('kyc:ice-candidate', ({ sessionId, candidate }) => {
      socket.to(`kyc:${sessionId}`).emit('kyc:ice-candidate', { candidate });
    });

    socket.on('kyc:switch-camera', ({ sessionId }) => {
      // Admin requests user to switch to back camera
      socket.to(`kyc:${sessionId}`).emit('kyc:switch-camera');
    });

    socket.on('kyc:end', ({ sessionId }) => {
      socket.to(`kyc:${sessionId}`).emit('kyc:ended');
      io.socketsLeave(`kyc:${sessionId}`);
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        const now = new Date().toISOString();
        onlineUsers.delete(socket.userId);
        io.emit('users:online', Array.from(onlineUsers.keys()));
        // Broadcast real lastSeen time to all clients
        io.emit('users:lastseen', { [socket.userId]: now });
        // Persist to DB
        await updateLastSeen(socket.userId);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`🚀 Server running on http://${hostname}:${port}`);
    console.log(`📡 Socket.io running on /api/socket`);
    console.log(`🟢 DB HOST: ${process.env.DATABASE_HOST}`);
  });
});
