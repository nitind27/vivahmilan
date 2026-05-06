import { execute } from '../lib/db.js';

const sql = `CREATE TABLE IF NOT EXISTS \`pending_registration\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`phone\` VARCHAR(20),
  \`password\` VARCHAR(255) NOT NULL,
  \`gender\` VARCHAR(20),
  \`otp\` VARCHAR(6) NOT NULL,
  \`otpExpiresAt\` DATETIME NOT NULL,
  \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_email\` (\`email\`),
  INDEX \`idx_otp_expiry\` (\`otpExpiresAt\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

try {
  await execute(sql);
  console.log('✅ pending_registration table created successfully!');
  process.exit(0);
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
}
