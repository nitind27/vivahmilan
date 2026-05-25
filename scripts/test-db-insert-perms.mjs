import { config as loadEnv } from 'dotenv';
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

loadEnv({ path: '.env.production' });

const conn = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
});

async function testInsert(table, sql, params) {
  try {
    await conn.execute(sql, params);
    console.log(`✅ INSERT OK: ${table}`);
    return true;
  } catch (e) {
    console.log(`❌ INSERT FAIL: ${table} — ${e.code} ${e.message}`);
    return false;
  }
}

const uid = (await conn.query('SELECT id FROM `user` WHERE role=\'USER\' LIMIT 1'))[0][0]?.id;
console.log('Testing as user:', process.env.DATABASE_USER, '@', process.env.DATABASE_HOST);
console.log('Sample userId:', uid || 'none');

if (uid) {
  await testInsert('user',
    'INSERT INTO `user` (id,name,email,role,isActive,createdAt,updatedAt) VALUES (?,?,?,?,?,NOW(),NOW())',
    [randomUUID(), 'PermTest', `perm${Date.now()}@test.com`, 'USER', 1]
  );

  const subId = randomUUID();
  await testInsert('subscription',
    'INSERT INTO subscription (id,userId,plan,status,amount,currency,paymentId,startDate,endDate,createdAt) VALUES (?,?,?,?,?,?,?,NOW(),DATE_ADD(NOW(),INTERVAL 30 DAY),NOW())',
    [subId, uid, 'GOLD', 'PENDING', 99, 'INR', 'TEST_PERM_CHECK']
  );
  await conn.execute('DELETE FROM subscription WHERE id=?', [subId]).catch(() => {});

  const pushId = randomUUID();
  await testInsert('pushsubscription',
    'INSERT INTO pushsubscription (id,userId,endpoint,p256dh,auth,createdAt) VALUES (?,?,?,?,?,NOW())',
    [pushId, uid, 'https://test.example/push', 'test', 'test']
  );
  await conn.execute('DELETE FROM pushsubscription WHERE id=?', [pushId]).catch(() => {});
}

const [grants] = await conn.query('SHOW GRANTS');
console.log('\nCurrent grants:');
grants.forEach(g => console.log(' ', Object.values(g)[0]));

console.log('\nTrying GRANT INSERT, UPDATE (may fail on Hostinger shared hosting)...');
try {
  await conn.query("GRANT SELECT, INSERT, UPDATE, DELETE ON `u707717625_vivahmilan`.* TO 'u707717625_vivahmilan'@'%'");
  await conn.query('FLUSH PRIVILEGES');
  console.log('✅ GRANT succeeded');
} catch (e) {
  console.log('❌ GRANT failed:', e.message);
  console.log('   → Fix via Hostinger hPanel or support ticket (see migrations/fix_db_permissions.sql)');
}

await conn.end();
