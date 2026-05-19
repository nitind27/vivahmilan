import { execute } from './lib/db.js';

async function run() {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS homepage_feature (
        id VARCHAR(191) PRIMARY KEY,
        title VARCHAR(191) NOT NULL,
        description TEXT,
        icon VARCHAR(191),
        image VARCHAR(191),
        isActive BOOLEAN DEFAULT true,
        sortOrder INT DEFAULT 0,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3)
      )
    `);
    console.log('homepage_feature Table created');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
