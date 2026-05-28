import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config({ path: '.env' });
config({ path: '.env.local' });

const u = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: u.hostname,
  port: u.port || 3306,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, ''),
});

const [rows] = await conn.query(`
  SELECT s.id, s.plan, s.status, s.amount, s.paymentId, s.receiptSentAt, s.createdAt,
         u.name, u.email
  FROM subscription s
  JOIN user u ON u.id = s.userId
  ORDER BY s.createdAt DESC
  LIMIT 5
`);
console.log(JSON.stringify(rows, null, 2));
await conn.end();
