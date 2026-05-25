import { query, execute } from '../lib/db.js';

const sql = `ALTER TABLE notification MODIFY COLUMN \`type\` enum(
  'INTEREST_RECEIVED','INTEREST_ACCEPTED','MESSAGE_RECEIVED','PROFILE_VIEWED',
  'SUBSCRIPTION_EXPIRY','VERIFICATION_APPROVED','SYSTEM','NEW_MATCH'
) NOT NULL`;

try {
  await execute(sql);
  console.log('✅ NEW_MATCH added to notification.type enum');
  process.exit(0);
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
}
