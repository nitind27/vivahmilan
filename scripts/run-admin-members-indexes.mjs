import mysql from 'mysql2/promise';
import fs from 'fs';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.production' });

const conn = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  multipleStatements: true,
});

const sql = fs.readFileSync('migrations/add_admin_members_indexes.sql', 'utf8');
console.log('Running admin members index migration...');
await conn.query(sql);

const [userIdx] = await conn.query("SHOW INDEX FROM `user` WHERE Key_name LIKE 'idx_user%'");
console.log('User indexes:', [...new Set(userIdx.map(i => i.Key_name))].join(', '));

await conn.end();
console.log('Done.');
