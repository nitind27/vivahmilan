// import mysql from "mysql2/promise";

// function getDbConfig() {
//   const url = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
//   try {
//     const p = new URL(url);
//     return {
//       host: p.hostname,
//       user: decodeURIComponent(p.username),
//       password: decodeURIComponent(p.password),
//       database: p.pathname.replace(/^\//, ""),
//       port: parseInt(p.port || "3306"),
//     };
//   } catch {
//     return {
//       host: (process.env.DATABASE_HOST || "localhost").trim(),
//       user: (process.env.DATABASE_USER || "root").trim(),
//       password: (process.env.DATABASE_PASSWORD || "").trim().replace(/^["']|["']$/g, ""),
//       database: (process.env.DATABASE_NAME || "matrimonial").trim(),
//       port: parseInt((process.env.DATABASE_PORT || "3306").trim()),
//     };
//   }
// }

// const g = globalThis;
// if (!g.dbPool) {
//   g.dbPool = mysql.createPool({
//     ...getDbConfig(),
//     connectionLimit: 10,
//     waitForConnections: true,
//     queueLimit: 0,
//     enableKeepAlive: true,
//     dateStrings: false,
//     timezone: "+00:00",
//   });
// }

// export const pool = g.dbPool;

// // Helper: run a query and return rows
// export async function query(sql, params = []) {
//   const [rows] = await pool.execute(sql, params);
//   return rows;
// }

// // Helper: run insert/update/delete and return result
// export async function execute(sql, params = []) {
//   const [result] = await pool.execute(sql, params);
//   return result;
// }

// // Helper: get single row
// export async function queryOne(sql, params = []) {
//   const rows = await query(sql, params);
//   return rows[0] ?? null;
// }


import mysql from "mysql2/promise";

const g = globalThis;

// 🔥 Create pool (only once)
if (!g.dbPool) {
  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const port = parseInt(process.env.DATABASE_PORT || "3306");

  if (!host || !user || !database) {
    console.error("❌ DB env vars missing! HOST:", host, "USER:", user, "DB:", database);
  }

  g.dbPool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,   // send keepalive immediately on idle
    connectTimeout: 15000,
    timezone: "+00:00",
  });

  console.log("✅ DB Pool Created (lib/db.js):", host);
} else {
  console.log("♻️ Reusing existing DB Pool:", process.env.DATABASE_HOST);
}

export const pool = g.dbPool;

// ✅ Internal helper: execute with one automatic retry on lost connection
async function executeWithRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    const isRetryable = ['PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'ENETUNREACH', 'ETIMEDOUT', 'ECONNREFUSED'].includes(err.code);
    if (isRetryable) {
      console.warn("⚠️ DB connection lost, retrying...");
      await new Promise(r => setTimeout(r, 500));
      return await fn();
    }
    console.error("❌ DB Error:", err.message);
    throw err;
  }
}

// ✅ Query helper with retry
export async function query(sql, params = []) {
  return executeWithRetry(async () => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  });
}

// ✅ Execute helper with retry (insert/update/delete)
export async function execute(sql, params = []) {
  return executeWithRetry(async () => {
    const [result] = await pool.execute(sql, params);
    return result;
  });
}

// ✅ Single row helper
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}