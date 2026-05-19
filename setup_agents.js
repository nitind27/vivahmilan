import { execute } from './lib/db.js';

async function run() {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS agent (
        id VARCHAR(191) PRIMARY KEY,
        userId VARCHAR(191) UNIQUE NOT NULL,
        referralCode VARCHAR(191) UNIQUE NOT NULL,
        commissionPct INT DEFAULT 10,
        totalEarnings DECIMAL(10,2) DEFAULT 0,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3)
      )
    `);
    await execute(`
      CREATE TABLE IF NOT EXISTS agentsale (
        id VARCHAR(191) PRIMARY KEY,
        agentId VARCHAR(191) NOT NULL,
        buyerId VARCHAR(191) NOT NULL,
        subscriptionId VARCHAR(191) NOT NULL,
        planName VARCHAR(191) NOT NULL,
        amountPaid DECIMAL(10,2) NOT NULL,
        commissionEarned DECIMAL(10,2) NOT NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
      )
    `);
    console.log('Agent tables created successfully');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
