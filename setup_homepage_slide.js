import { execute } from './lib/db.js';

async function run() {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS homepage_slide (
        id VARCHAR(191) PRIMARY KEY,
        tag VARCHAR(191),
        headline VARCHAR(191) NOT NULL,
        highlight VARCHAR(191),
        sub TEXT,
        image VARCHAR(191),
        isActive BOOLEAN DEFAULT true,
        sortOrder INT DEFAULT 0,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3)
      )
    `);
    console.log('homepage_slide Table created');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
