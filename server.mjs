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
import jwt from 'jsonwebtoken';
import { pool as dbPool } from './lib/db.js';

function getDbPool() {
  return dbPool;
}

async function updateLastSeen(userId) {
  try {
    const pool = getDbPool();
    await pool.execute('UPDATE `user` SET lastLoginAt = NOW() WHERE id = ?', [userId]);
  } catch (err) {
    console.error('[Socket] lastLoginAt update error:', err.message);
  }
}

async function getRoomPeer(roomId, userId) {
  try {
    const pool = getDbPool();
    const [rows] = await pool.execute(
      'SELECT userAId, userBId FROM chatroom WHERE id = ? LIMIT 1',
      [roomId]
    );
    const room = rows[0];
    if (!room) return null;
    if (room.userAId === userId) return room.userBId;
    if (room.userBId === userId) return room.userAId;
    return null;
  } catch {
    return null;
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

    // ── Welcome gate (admin: siteconfig welcome_gate_enabled = 1) ──
    const PREVIEW_COOKIE_NAME  = 'vd_preview_auth';
    const PREVIEW_COOKIE_VALUE = 'granted_2710';
    const WELCOME_GATE_BYPASS = [
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
      '/api/welcome-gate-status',
      '/api/coupons/validate',
      '/api/admin/',
      '/register',
      '/verify-email',
      '/onboarding',
      '/login',
      '/forgot-password',
      '/kyc/',
    ];
    const isWelcomeBypassed = WELCOME_GATE_BYPASS.some(p => pathname.startsWith(p))
      || (pathname.includes('.') && !pathname.endsWith('.html'));

    let welcomeGateEnabled = false;
    try {
      const pool = getDbPool();
      const [rows] = await pool.execute(
        "SELECT value FROM siteconfig WHERE `key` = 'welcome_gate_enabled' LIMIT 1"
      );
      welcomeGateEnabled = rows[0]?.value === '1';
    } catch {
      welcomeGateEnabled = false;
    }

    if (welcomeGateEnabled && !isWelcomeBypassed) {
      const cookieHeader = req.headers.cookie || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';')
          .map(c => { const [k, ...v] = c.trim().split('='); return [k?.trim(), v.join('=').trim()]; })
          .filter(([k]) => k)
      );
      if (cookies[PREVIEW_COOKIE_NAME] !== PREVIEW_COOKIE_VALUE) {
        const redirectTo = encodeURIComponent(pathname + (parsedUrl.search || ''));
        res.writeHead(302, { Location: `/welcome.html?login&redirect=${redirectTo}` });
        res.end();
        return;
      }
    }

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

    // ── Flutter portal access gate (verified users blocked until admin opens portal) ──
    const FLUTTER_PORTAL_BYPASS = [
      '/api/flutter/auth/',
      '/api/flutter/portal-access',
      '/api/flutter/location/',
    ];
    if (
      pathname.startsWith('/api/flutter/') &&
      !FLUTTER_PORTAL_BYPASS.some(p => pathname.startsWith(p))
    ) {
      const authHeader = req.headers.authorization || '';
      if (authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.slice(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'milan-jwt-secret-2026');
          if (decoded?.email && decoded.role !== 'ADMIN') {
            const pool = getDbPool();
            const [devRows] = await pool.execute(
              "SELECT value FROM siteconfig WHERE `key` = 'developer_portal_emails' LIMIT 1"
            );
            const devEmails = (devRows[0]?.value || '')
              .split(/[,;\s]+/)
              .map(e => e.trim().toLowerCase())
              .filter(Boolean);
            const isDev = devEmails.includes(String(decoded.email).trim().toLowerCase());
            if (!isDev) {
              const [portalRows] = await pool.execute(
                "SELECT value FROM siteconfig WHERE `key` = 'user_portal_access' LIMIT 1"
              );
              const portalOpen = portalRows[0]?.value === '1';
              if (!portalOpen) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  error: 'Your profile will be available soon. Please wait for our update.',
                  code: 'PORTAL_CLOSED',
                  portalAccess: false,
                  contact: {
                    phone: '8735995467',
                    phoneDisplay: '+91 87359 95467',
                    email: 'supportvivahdwar@gmail.com',
                  },
                }));
                return;
              }
            }
          }
        } catch {
          // Invalid token — let the route handler respond with 401
        }
      }
    }

    handle(req, res, parsedUrl);
  });

  // ── Socket.io ──────────────────────────────────────────────
  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Store io globally so API routes can emit events
  global.__io = io;

  // ── JWT Auth Middleware (supports Flutter Bearer token + web cookies) ──
  const JWT_SECRET = process.env.JWT_SECRET || 'milan-jwt-secret-2026';

  io.use((socket, next) => {
    // Flutter sends token in handshake auth: { token: 'Bearer xxx' } or just token string
    const authToken = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization
      || socket.handshake.query?.token;

    if (authToken) {
      const raw = typeof authToken === 'string' && authToken.startsWith('Bearer ')
        ? authToken.slice(7)
        : authToken;
      try {
        const decoded = jwt.verify(raw, JWT_SECRET);
        socket.flutterUserId = decoded.id;
        return next();
      } catch {
        // Invalid token — still allow connection (web users use cookie auth)
      }
    }
    // Web users: no token needed here, they identify via user:online event
    next();
  });

  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    // Auto-register Flutter users who authenticated via JWT
    if (socket.flutterUserId) {
      const userId = socket.flutterUserId;
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user:${userId}`); // personal room for direct notifications
      io.emit('users:online', Array.from(onlineUsers.keys()));
      console.log(`[Socket] Flutter user connected: ${userId}`);
    }

    socket.on('user:online', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user:${userId}`);
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

    socket.on('typing:start', async ({ roomId, userId }) => {
      if (!roomId || !userId) return;
      const payload = { userId, roomId };
      socket.to(roomId).emit('typing:start', payload);
      const peerId = await getRoomPeer(roomId, userId);
      if (peerId) socket.to(`user:${peerId}`).emit('typing:start', payload);
    });

    socket.on('typing:stop', async ({ roomId, userId }) => {
      if (!roomId || !userId) return;
      const payload = { userId, roomId };
      socket.to(roomId).emit('typing:stop', payload);
      const peerId = await getRoomPeer(roomId, userId);
      if (peerId) socket.to(`user:${peerId}`).emit('typing:stop', payload);
    });

    socket.on('interest:notify', ({ toUserId, fromUser }) => {
      const targetSocket = onlineUsers.get(toUserId);
      if (targetSocket) io.to(targetSocket).emit('interest:received', { fromUser });
    });

    socket.on('location:update', async ({ roomId, msgId, latitude, longitude }) => {
      if (!roomId || !msgId) return;
      const payload = { msgId, roomId, latitude, longitude };
      socket.to(roomId).emit('location:update', payload);
      if (socket.userId) {
        const peerId = await getRoomPeer(roomId, socket.userId);
        if (peerId) socket.to(`user:${peerId}`).emit('location:update', payload);
      }
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

    socket.on('kyc:switch-camera', ({ sessionId, mode }) => {
      socket.to(`kyc:${sessionId}`).emit('kyc:switch-camera', { mode: mode === 'front' ? 'front' : 'back' });
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
        io.emit('users:lastseen', { [socket.userId]: now });
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
