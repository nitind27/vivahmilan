import { execute } from './db.js';

let ensured = false;
let collationsFixed = false;

/** Match Prisma / legacy tables on Hostinger (avoids ER_CANT_AGGREGATE_2COLLATIONS on JOINs). */
const TABLE_CHARSET = 'utf8mb4 COLLATE utf8mb4_unicode_ci';

const FEATURE_TABLES = [
  'savedsearch',
  'familyaccess',
  'adminnote',
  'userpreference',
  'userreferral',
  'storysubmission',
];

async function normalizeFeatureTableCollations() {
  if (collationsFixed) return;
  for (const table of FEATURE_TABLES) {
    try {
      await execute(
        `ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    } catch {
      // table may not exist yet
    }
  }
  collationsFixed = true;
}

export async function ensureFeatureTables() {
  if (!ensured) {
  await execute(`
    CREATE TABLE IF NOT EXISTS savedsearch (
      id VARCHAR(191) PRIMARY KEY,
      userId VARCHAR(191) NOT NULL,
      name VARCHAR(191) NOT NULL,
      filters TEXT NOT NULL,
      alertEnabled TINYINT(1) DEFAULT 0,
      lastAlertAt DATETIME NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_savedsearch_user (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=${TABLE_CHARSET}
  `);
  try {
    await execute('ALTER TABLE savedsearch ADD COLUMN lastAlertAt DATETIME NULL');
  } catch {
    // column may already exist
  }
  try {
    await execute('ALTER TABLE profile ADD COLUMN introVideoUrl TEXT NULL');
  } catch {}
  try {
    await execute('ALTER TABLE userpreference ADD COLUMN autoRenew TINYINT(1) DEFAULT 0');
  } catch {}
  await execute(`
    CREATE TABLE IF NOT EXISTS familyaccess (
      id VARCHAR(191) PRIMARY KEY,
      ownerUserId VARCHAR(191) NOT NULL,
      memberName VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL,
      password VARCHAR(191) NOT NULL,
      relationship VARCHAR(191) DEFAULT 'Parent',
      isActive TINYINT(1) DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_family_email (email),
      INDEX idx_family_owner (ownerUserId)
    ) ENGINE=InnoDB DEFAULT CHARSET=${TABLE_CHARSET}
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS adminnote (
      id VARCHAR(191) PRIMARY KEY,
      targetUserId VARCHAR(191) NOT NULL,
      adminId VARCHAR(191) NOT NULL,
      adminName VARCHAR(191) NULL,
      note TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_adminnote_target (targetUserId)
    ) ENGINE=InnoDB DEFAULT CHARSET=${TABLE_CHARSET}
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS userpreference (
      userId VARCHAR(191) PRIMARY KEY,
      notifyInterest TINYINT(1) DEFAULT 1,
      notifyMessage TINYINT(1) DEFAULT 1,
      notifyProfileView TINYINT(1) DEFAULT 1,
      notifyMarketing TINYINT(1) DEFAULT 0,
      profileVisible TINYINT(1) DEFAULT 1,
      showOnlineStatus TINYINT(1) DEFAULT 1,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=${TABLE_CHARSET}
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS userreferral (
      id VARCHAR(191) PRIMARY KEY,
      userId VARCHAR(191) NOT NULL UNIQUE,
      referralCode VARCHAR(191) NOT NULL UNIQUE,
      referredByUserId VARCHAR(191) NULL,
      totalReferrals INT DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_userreferral_code (referralCode)
    ) ENGINE=InnoDB DEFAULT CHARSET=${TABLE_CHARSET}
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS storysubmission (
      id VARCHAR(191) PRIMARY KEY,
      userId VARCHAR(191) NOT NULL,
      coupleName VARCHAR(191) NOT NULL,
      location VARCHAR(191) DEFAULT '',
      story TEXT NOT NULL,
      imageUrl TEXT NULL,
      weddingDate DATE NULL,
      metOnPlatform TINYINT(1) DEFAULT 1,
      status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
      adminNote TEXT NULL,
      successStoryId VARCHAR(191) NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_storysub_user (userId),
      INDEX idx_storysub_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=${TABLE_CHARSET}
  `);
  ensured = true;
  }

  await normalizeFeatureTableCollations();
}
