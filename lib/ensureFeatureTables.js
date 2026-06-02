import { execute, queryOne } from './db.js';

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
  'profilereminderlog',
];

async function columnExists(table, column) {
  const row = await queryOne(
    `SELECT 1 AS ok FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return !!row;
}

/** Add column only when missing — avoids "Duplicate column name" log spam on production. */
async function ensureColumn(table, column, definition) {
  if (await columnExists(table, column)) return;
  await execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

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
    await ensureColumn('savedsearch', 'lastAlertAt', 'DATETIME NULL');
    await ensureColumn('profile', 'introVideoUrl', 'TEXT NULL');
    await ensureColumn('userpreference', 'autoRenew', 'TINYINT(1) DEFAULT 0');
    await ensureColumn('userpreference', 'earlyBirdPopupSeen', 'TINYINT(1) DEFAULT 0');
    await ensureColumn('user', 'profileRejectionReason', 'TEXT NULL');
    await ensureColumn('user', 'profileRejectedAt', 'DATETIME NULL');

    try {
      await execute(`
        ALTER TABLE \`notification\` MODIFY \`type\` ENUM(
          'INTEREST_RECEIVED','INTEREST_ACCEPTED','MESSAGE_RECEIVED','PROFILE_VIEWED',
          'SUBSCRIPTION_EXPIRY','VERIFICATION_APPROVED','VERIFICATION_REJECTED','SYSTEM','NEW_MATCH'
        ) NOT NULL
      `);
    } catch {
      // enum may already include values
    }

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
        autoRenew TINYINT(1) DEFAULT 0,
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
      CREATE TABLE IF NOT EXISTS profilereminderlog (
        id VARCHAR(191) PRIMARY KEY,
        userId VARCHAR(191) NOT NULL,
        adminId VARCHAR(191) NULL,
        templateKey VARCHAR(64) NULL,
        title VARCHAR(191) NOT NULL,
        message TEXT NOT NULL,
        emailSent TINYINT(1) DEFAULT 0,
        pushSent TINYINT(1) DEFAULT 0,
        inAppSent TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_profilereminder_user (userId),
        INDEX idx_profilereminder_created (createdAt)
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
