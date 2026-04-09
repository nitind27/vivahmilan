// Run: node prisma/create-admin.js
// Creates the first admin user
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'matrimonial',
  });

  const email = 'admin@milan.com';
  const password = 'Admin@1234';
  const name = 'Milan Admin';

  const [existing] = await conn.execute('SELECT id FROM User WHERE email = ?', [email]);
  if (existing.length > 0) {
    console.log('✅ Admin already exists. Login with:', email, '/', password);
    await conn.end(); return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const id = randomUUID();
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  await conn.execute(
    `INSERT INTO User (id, name, email, password, role, isActive, isVerified, adminVerified, verificationBadge, isPremium, profileBoost, phoneVerified, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 'ADMIN', 1, 1, 1, 1, 1, 0, 0, ?, ?)`,
    [id, name, email, hashed, now, now]
  );

  // Seed default plan configs
  const plans = [
    { plan: 'FREE',     name: 'Free',     price: 0,    days: 0,  perms: { canChat: false, interestLimit: 5,  canSeeContact: false, canBoostProfile: false, canSeeWhoViewed: false, unlimitedInterests: false, aiMatchScore: false } },
    { plan: 'SILVER',   name: 'Silver',   price: 749,  days: 30, perms: { canChat: false, interestLimit: 50, canSeeContact: true,  canBoostProfile: false, canSeeWhoViewed: true,  unlimitedInterests: false, aiMatchScore: false } },
    { plan: 'GOLD',     name: 'Gold',     price: 1499, days: 30, perms: { canChat: true,  interestLimit: -1, canSeeContact: true,  canBoostProfile: true,  canSeeWhoViewed: true,  unlimitedInterests: true,  aiMatchScore: false } },
    { plan: 'PLATINUM', name: 'Platinum', price: 2999, days: 30, perms: { canChat: true,  interestLimit: -1, canSeeContact: true,  canBoostProfile: true,  canSeeWhoViewed: true,  unlimitedInterests: true,  aiMatchScore: true  } },
  ];

  for (const p of plans) {
    const [ex] = await conn.execute('SELECT id FROM PlanConfig WHERE plan = ?', [p.plan]);
    if (ex.length === 0) {
      const pid = randomUUID();
      await conn.execute(
        `INSERT INTO PlanConfig (id, plan, displayName, price, currency, durationDays, isActive, permissions, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'INR', ?, 1, ?, ?, ?)`,
        [pid, p.plan, p.name, p.price, p.days, JSON.stringify(p.perms), now, now]
      );
      console.log(`✅ Plan created: ${p.name}`);
    }
  }

  await conn.end();
  console.log('\n🎉 Admin created!');
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('   Login at: http://localhost:3000/login');
}

main().catch(e => { console.error(e); process.exit(1); });
