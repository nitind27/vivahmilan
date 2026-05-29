import { ensureFeatureTables } from '../lib/ensureFeatureTables.js';
import { execute, query } from '../lib/db.js';

async function check(label, fn) {
  try {
    const result = await fn();
    console.log(`${label}: ${result}`);
  } catch (e) {
    console.log(`${label}: ERROR — ${e.message}`);
  }
}

await ensureFeatureTables();
console.log('\n✅ ensureFeatureTables() completed\n');

await check('familyaccess table', async () => {
  const [r] = await query("SHOW TABLES LIKE 'familyaccess'");
  return r ? 'EXISTS' : 'MISSING';
});

await check('profile.introVideoUrl', async () => {
  const r = await query("SHOW COLUMNS FROM profile LIKE 'introVideoUrl'");
  return r.length ? 'EXISTS' : 'MISSING';
});

await check('userpreference.autoRenew', async () => {
  const r = await query("SHOW COLUMNS FROM userpreference LIKE 'autoRenew'");
  return r.length ? 'EXISTS' : 'MISSING';
});

process.exit(0);
