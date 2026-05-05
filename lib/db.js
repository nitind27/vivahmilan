import mysql from "mysql2/promise";

const RETRYABLE = new Set([
  'PROTOCOL_CONNECTION_LOST',
  'ECONNRESET',
  'ENETUNREACH',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ER_CON_COUNT_ERROR',
]);

// DATABASE_HOST=82.25.121.177
// DATABASE_USER=u707717625_vivahmilan
// DATABASE_PASSWORD=Vivahmilan@7359
// DATABASE_NAME=u707717625_vivahmilan
// DATABASE_PORT=3306

const POOL_CONFIG = {
  host:     "82.25.121.177",
  user:     "u707717625_vivahmilan",
  password: "Vivahmilan@7359",
  database: "u707717625_vivahmilan",
  port:     parseInt(process.env.DATABASE_PORT || "3306"),
  connectionLimit:      10,
  waitForConnections:   true,
  queueLimit:           0,
  enableKeepAlive:      true,
  keepAliveInitialDelay: 0,
  connectTimeout:       15000,
  timezone:             "+00:00",
};

function createPool() {
  if (!POOL_CONFIG.host || !POOL_CONFIG.user || !POOL_CONFIG.database) {
    console.error("❌ DB env vars missing! HOST:", POOL_CONFIG.host);
  }
  const p = mysql.createPool(POOL_CONFIG);
  console.log("✅ DB Pool Created:", POOL_CONFIG.host);
  return p;
}

// Singleton pool on globalThis so it survives Next.js hot reloads
const g = globalThis;
if (!g._dbPool) g._dbPool = createPool();

/** Destroy the broken pool and create a fresh one */
async function resetPool() {
  try {
    await g._dbPool.end();
  } catch (_) { /* ignore errors on end */ }
  g._dbPool = createPool();
}

/** Always use the current pool reference */
export function getPool() {
  return g._dbPool;
}

// Keep `pool` export for any direct usages elsewhere
export const pool = new Proxy({}, {
  get(_, prop) { return g._dbPool[prop].bind(g._dbPool); },
});

// ── Core retry wrapper ────────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_DELAY = 800; // ms

async function withRetry(fn) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn(g._dbPool);
    } catch (err) {
      lastErr = err;
      if (!RETRYABLE.has(err.code)) {
        // Non-retryable — throw immediately
        console.error("❌ DB Error:", err.message);
        throw err;
      }
      console.warn(`⚠️ DB error (${err.code}), attempt ${attempt}/${MAX_RETRIES} — resetting pool...`);
      await resetPool();
      await new Promise(r => setTimeout(r, RETRY_DELAY * attempt));
    }
  }
  console.error("❌ DB failed after", MAX_RETRIES, "attempts:", lastErr.message);
  throw lastErr;
}

// ── Public helpers ────────────────────────────────────────────────────────────

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
