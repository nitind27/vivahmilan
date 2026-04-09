// Direct mysql2 connection to avoid Prisma pool overhead
import mysql from 'mysql2/promise';
import 'dotenv/config';

const url = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
const parsed = new URL(url);

const conn = await mysql.createConnection({
  host: parsed.hostname,
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace(/^\//, ''),
  port: parseInt(parsed.port || '3306'),
});

const [u] = await conn.execute("UPDATE `user` SET image = NULL WHERE image LIKE 'data:%'");
console.log(`Cleared base64 image from ${u.affectedRows} users`);

const [p] = await conn.execute("DELETE FROM `photo` WHERE url LIKE 'data:%'");
console.log(`Deleted ${p.affectedRows} base64 photos`);

const [d] = await conn.execute("DELETE FROM `document` WHERE url LIKE 'data:%'");
console.log(`Deleted ${d.affectedRows} base64 documents`);

await conn.end();
console.log('Done.');
