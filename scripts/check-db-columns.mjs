import { queryOne, execute } from '../lib/db.js';

async function columnExists(table, column) {
  const row = await queryOne(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return !!row;
}

async function applyPhotoHashMigration() {
  if (await columnExists('photo', 'contentHash')) return 'already_exists';
  await execute('ALTER TABLE photo ADD COLUMN contentHash VARCHAR(64) NULL');
  try {
    await execute('CREATE INDEX idx_photo_contentHash ON photo(contentHash)');
  } catch (e) {
    if (!e.message?.includes('Duplicate')) throw e;
  }
  return 'applied';
}

const photoHash = await columnExists('photo', 'contentHash');
const receipt = await columnExists('subscription', 'receiptSentAt');

console.log(JSON.stringify({
  photo_contentHash: photoHash ? 'EXISTS' : 'MISSING',
  subscription_receiptSentAt: receipt ? 'EXISTS' : 'MISSING',
}, null, 2));

if (process.argv.includes('--apply-photo-hash') && !photoHash) {
  const result = await applyPhotoHashMigration();
  console.log('photo contentHash migration:', result);
  const verified = await columnExists('photo', 'contentHash');
  console.log('verified:', verified ? 'OK' : 'FAILED');
}

process.exit(0);
