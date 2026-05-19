import { execute } from './lib/db.js';

async function run() {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS homepage_stat (
        id VARCHAR(191) PRIMARY KEY,
        title VARCHAR(191) NOT NULL,
        value VARCHAR(191) NOT NULL,
        icon VARCHAR(191),
        isActive BOOLEAN DEFAULT true,
        sortOrder INT DEFAULT 0,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3)
      )
    `);
    console.log('homepage_stat Table created');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
