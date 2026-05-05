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
    connectionLimit:       10,
    waitForConnections:    true,
    queueLimit:            0,
    enableKeepAlive:       true,
    keepAliveInitialDelay: 0,
    connectTimeout:        15000,
    timezone:              "+00:00",
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

// ── Retry wrapper ─────────────────────────────────────────────────────────────
const MAX_RETRIES = 3;

async function withRetry(fn) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn(g.__matrimonialDbPool);
    } catch (err) {
      lastErr = err;
      if (!RETRYABLE.has(err.code)) {
        console.error("❌ DB Error:", err.message);
        throw err;
      }
      console.warn(`⚠️ DB ${err.code} — attempt ${attempt}/${MAX_RETRIES}, resetting pool...`);
      await resetPool();
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
  console.error("❌ DB failed after", MAX_RETRIES, "attempts:", lastErr?.message);
  throw lastErr;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function query(sql, params = []) {
  return withRetry(async (p) => {
    const [rows] = await p.execute(sql, params);
    return rows;
  });
}

export async function execute(sql, params = []) {
  return withRetry(async (p) => {
    const [result] = await p.execute(sql, params);
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
