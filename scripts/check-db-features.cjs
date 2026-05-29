const mysql = require('mysql2/promise');
require('dotenv').config({ path: process.env.ENV_FILE || '.env.production' });

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  });

  const tables = [
    'savedsearch', 'familyaccess', 'adminnote', 'userpreference',
    'userreferral', 'storysubmission', 'pushsubscription', 'shortlist', 'kundali',
  ];

  console.log('=== TABLES ===');
  for (const t of tables) {
    const [rows] = await conn.query('SHOW TABLES LIKE ?', [t]);
    console.log(`${t}: ${rows.length ? 'EXISTS' : 'MISSING'}`);
  }

  const cols = [
    ['profile', 'introVideoUrl'],
    ['userpreference', 'autoRenew'],
    ['savedsearch', 'lastAlertAt'],
    ['savedsearch', 'alertEnabled'],
  ];

  console.log('\n=== COLUMNS ===');
  for (const [tbl, col] of cols) {
    try {
      const [rows] = await conn.query(`SHOW COLUMNS FROM \`${tbl}\` LIKE ?`, [col]);
      console.log(`${tbl}.${col}: ${rows.length ? 'EXISTS' : 'MISSING'}`);
    } catch (e) {
      console.log(`${tbl}.${col}: TABLE MISSING (${e.message})`);
    }
  }

  await conn.end();
}

main().catch((e) => {
  console.error('DB ERROR:', e.message);
  process.exit(1);
});
