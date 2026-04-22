import mysql from "mysql2/promise";

function getDbConfig() {
  const url = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
  try {
    const p = new URL(url);
    return {
      host: p.hostname,
      user: decodeURIComponent(p.username),
      password: decodeURIComponent(p.password),
      database: p.pathname.replace(/^\//, ""),
      port: parseInt(p.port || "3306"),
    };
  } catch {
    return {
      host: (process.env.DATABASE_HOST || "localhost").trim(),
      user: (process.env.DATABASE_USER || "root").trim(),
      password: (process.env.DATABASE_PASSWORD || "").trim().replace(/^["']|["']$/g, ""),
      database: (process.env.DATABASE_NAME || "matrimonial").trim(),
      port: parseInt((process.env.DATABASE_PORT || "3306").trim()),
    };
  }
}

const g = globalThis;
if (!g.dbPool) {
  // With cluster mode (4 workers), each worker gets its own pool.
  // connectionLimit per worker = 10, so total DB connections = 4 * 10 = 40
  // Increase if your DB server allows more (check max_connections in MySQL)
  const workerConnections = parseInt(process.env.DB_POOL_SIZE || '10');

  g.dbPool = mysql.createPool({
    ...getDbConfig(),
    connectionLimit: workerConnections,
    waitForConnections: true,
    queueLimit: 100,          // queue up to 100 requests before rejecting
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    dateStrings: false,
    timezone: '+00:00',
    connectTimeout: 10000,    // 10s connection timeout
    idleTimeout: 60000,       // release idle connections after 60s
  });
}

export const pool = g.dbPool;

// Helper: run a query and return rows
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Helper: run insert/update/delete and return result
export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

// Helper: get single row
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}
