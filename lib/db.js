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

function getDbConfig() {
  return {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: parseInt(process.env.DATABASE_PORT || "3306"),
  };
}

const g = globalThis;

if (!g.dbPool) {
  g.dbPool = mysql.createPool({
    ...getDbConfig(),
    connectionLimit: 5, // thoda kam rakho (shared DB hai)
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    timezone: "+00:00",
  });
}

export const pool = g.dbPool;

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}