import mysql from "mysql2/promise";
import { config as loadEnv } from "dotenv";

if (!process.env.DATABASE_HOST) {
  loadEnv({ path: ".env.production" });
}

const RETRYABLE = new Set([
  'PROTOCOL_CONNECTION_LOST',
  'ECONNRESET',
  'ENETUNREACH',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ER_CON_COUNT_ERROR',
  'POOL_CLOSED',
]);

function isRetryable(err) {
  if (!err) return false;
  if (err.code === 'ER_USER_LIMIT_REACHED') return false;
  if (RETRYABLE.has(err.code)) return true;
  const msg = err.message || '';
  return (
    msg.includes("reading 'length'") ||
    msg.includes('Pool is closed') ||
    msg.includes('closed state')
  );
}

function buildPool() {
  const host     = process.env.DATABASE_HOST;
  const user     = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const port     = parseInt(process.env.DATABASE_PORT || "3306");

  if (!host || !user || !database) {
    console.error("❌ DB env vars missing! HOST:", host, "USER:", user, "DB:", database);
  }

  // NOTE: Do NOT set timezone here — mysql2 + timezone option breaks multi-row
  // result sets against Hostinger MySQL (TypeError: reading 'length').
  const p = mysql.createPool({
    host, user, password, database, port,
    connectionLimit:    3,
    waitForConnections: true,
    queueLimit:         0,
    connectTimeout:     20000,
  });

  console.log("✅ DB Pool (re)created:", host);
  return p;
}

const g = globalThis;
if (!g.__matrimonialDbPool) {
  g.__matrimonialDbPool = buildPool();
}

let resetPromise = null;

async function resetPool() {
  if (resetPromise) return resetPromise;

  resetPromise = (async () => {
    const oldPool = g.__matrimonialDbPool;
    g.__matrimonialDbPool = buildPool();
    if (oldPool) {
      try {
        await oldPool.end();
      } catch {
        // pool may already be closed
      }
    }
  })().finally(() => {
    resetPromise = null;
  });

  return resetPromise;
}

// Limit concurrent queries on shared hosting (500 connections/hr cap)
let activeQueries = 0;
const MAX_CONCURRENT = 4;
const waitQueue = [];

function acquireSlot() {
  if (activeQueries < MAX_CONCURRENT) {
    activeQueries++;
    return Promise.resolve();
  }
  return new Promise(resolve => waitQueue.push(resolve));
}

function releaseSlot() {
  activeQueries--;
  const next = waitQueue.shift();
  if (next) {
    activeQueries++;
    next();
  }
}

async function runQuery(pool, sql, params) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(sql, params);
    return rows;
  } finally {
    conn.release();
  }
}

const MAX_RETRIES = 3;

async function withRetry(fn) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await acquireSlot();
    try {
      if (resetPromise) await resetPromise;
      return await fn(g.__matrimonialDbPool);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) {
        if (err.code === 'ER_USER_LIMIT_REACHED') {
          console.error("❌ DB Error: Hourly connection limit reached (Hostinger max 500/hr). Wait ~1 hour.");
        } else if (err.errno === 1060) {
          // Duplicate column — expected during idempotent migrations; caller may catch
          throw err;
        } else {
          console.error("❌ DB Error:", err.message);
        }
        throw err;
      }
      const delay = 500 * attempt;
      console.warn(`⚠️ DB ${err.code || 'connection error'} — attempt ${attempt}/${MAX_RETRIES}, retrying in ${delay}ms...`);
      await resetPool();
      await new Promise(r => setTimeout(r, delay));
    } finally {
      releaseSlot();
    }
  }

  console.error("❌ DB failed after", MAX_RETRIES, "attempts:", lastErr?.message);
  throw lastErr;
}

export async function query(sql, params = []) {
  const safeParams = params.map(p => p === undefined ? null : p);
  return withRetry((p) => runQuery(p, sql, safeParams));
}

export async function execute(sql, params = []) {
  const safeParams = params.map(p => p === undefined ? null : p);
  return withRetry(async (p) => {
    const conn = await p.getConnection();
    try {
      const [result] = await conn.execute(sql, safeParams);
      return result;
    } finally {
      conn.release();
    }
  });
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export const pool = new Proxy({}, {
  get(_, prop) {
    const target = g.__matrimonialDbPool;
    const val = target[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  },
});
