import mysql from "mysql2/promise";

const RETRYABLE = new Set([
  'PROTOCOL_CONNECTION_LOST',
  'ECONNRESET',
  'ENETUNREACH',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ER_CON_COUNT_ERROR',
]);

function buildPool() {
  const host     = process.env.DATABASE_HOST;
  const user     = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const port     = parseInt(process.env.DATABASE_PORT || "3306");

  if (!host || !user || !database) {
    console.error("❌ DB env vars missing! HOST:", host, "USER:", user, "DB:", database);
  }

  const p = mysql.createPool({
    host, user, password, database, port,
    connectionLimit:       15,
    waitForConnections:    true,
    queueLimit:            0,
    enableKeepAlive:       true,
    keepAliveInitialDelay: 10000,   // send keepalive after 10s idle
    connectTimeout:        20000,
    timezone:              "+00:00",
    // Reconnect if connection goes stale
    idleTimeout:           60000,
  });

  console.log("✅ DB Pool (re)created:", host);
  return p;
}

// Use globalThis so the pool survives Next.js module re-evaluation in dev
const g = globalThis;
if (!g.__matrimonialDbPool) {
  g.__matrimonialDbPool = buildPool();
}

async function resetPool() {
  try { await g.__matrimonialDbPool.end(); } catch (_) {}
  g.__matrimonialDbPool = buildPool();
}

// ── Pool Health Check (ping every 30s to keep connections alive) ──────────────
if (!g.__dbHealthCheckInterval) {
  g.__dbHealthCheckInterval = setInterval(async () => {
    try {
      await g.__matrimonialDbPool.query('SELECT 1');
    } catch (err) {
      console.warn('⚠️ DB health check failed:', err.code);
      if (RETRYABLE.has(err.code)) {
        await resetPool();
      }
    }
  }, 30000); // every 30 seconds
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────
const MAX_RETRIES = 5;

async function withRetry(fn) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn(g.__matrimonialDbPool);
    } catch (err) {
      lastErr = err;
      const isMysql2BrokenPoolBug = err && err.message && err.message.includes("reading 'length'");
      if (!RETRYABLE.has(err.code) && !isMysql2BrokenPoolBug) {
        console.error("❌ DB Error:", err.message);
        throw err;
      }
      const delay = Math.min(1000 * attempt, 5000); // exponential backoff, max 5s
      console.warn(`⚠️ DB ${err.code || 'TypeError'} — attempt ${attempt}/${MAX_RETRIES}, retrying in ${delay}ms...`);
      // Reset pool immediately on connection failure to avoid mysql2 TypeErrors on broken pools
      await resetPool();
      await new Promise(r => setTimeout(r, delay));
    }
  }
  console.error("❌ DB failed after", MAX_RETRIES, "attempts:", lastErr?.message);
  throw lastErr;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function query(sql, params = []) {
  const safeParams = params.map(p => p === undefined ? null : p);
  return withRetry(async (p) => {
    const [rows] = await p.execute(sql, safeParams);
    return rows;
  });
}

export async function execute(sql, params = []) {
  const safeParams = params.map(p => p === undefined ? null : p);
  return withRetry(async (p) => {
    const [result] = await p.execute(sql, safeParams);
    return result;
  });
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// Direct pool access (e.g. kundali route) — always returns current pool
export const pool = new Proxy({}, {
  get(_, prop) {
    const target = g.__matrimonialDbPool;
    const val = target[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  },
});
