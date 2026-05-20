import { execute } from '../lib/db.js';

const sql = `CREATE TABLE IF NOT EXISTS \`fcm_token\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`userId\` VARCHAR(36) NOT NULL,
  \`token\` VARCHAR(255) NOT NULL UNIQUE,
  \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_fcm_user\` (\`userId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

try {
  await execute(sql);
  console.log('✅ fcm_token table created successfully!');
  process.exit(0);
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
}
