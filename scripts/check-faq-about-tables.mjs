import { query, pool } from '../lib/db.js';

const blog = await query("SHOW TABLES LIKE 'blogpost'");
const tables = await query("SHOW TABLES LIKE 'faqitem'");
const about = await query("SHOW TABLES LIKE 'about_%'");
console.log('blogpost:', blog.length ? 'EXISTS' : 'NOT FOUND');

console.log('faqitem:', tables.length ? 'EXISTS' : 'NOT FOUND');
console.log('about tables:', about.map((t) => Object.values(t)[0]).join(', ') || 'NOT FOUND');

if (tables.length) {
  const r = await query('SELECT COUNT(*) AS c FROM faqitem');
  console.log('faqitem rows:', r[0]?.c);
}

const names = about.map((t) => Object.values(t)[0]);
if (names.includes('about_setting')) {
  const s = await query('SELECT COUNT(*) AS c FROM about_setting');
  const v = await query('SELECT COUNT(*) AS c FROM about_value');
  const m = await query('SELECT COUNT(*) AS c FROM about_milestone');
  console.log('about_setting rows:', s[0]?.c);
  console.log('about_value rows:', v[0]?.c);
  console.log('about_milestone rows:', m[0]?.c);
}

process.exit(0);
