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
  'phone_verification',
  'deleted_user_archive',
  'donation_campaign',
  'donation_payment',
  'donation_expenditure',
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
    await ensureColumn('pending_registration', 'phoneE164', 'VARCHAR(20) NULL');
    await ensureColumn('pending_registration', 'phoneVerified', 'TINYINT(1) DEFAULT 0');

    await execute(`
      CREATE TABLE IF NOT EXISTS phone_verification (
        id VARCHAR(191) PRIMARY KEY,
        phoneE164 VARCHAR(20) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expiresAt DATETIME NOT NULL,
        verified TINYINT(1) DEFAULT 0,
        attempts INT DEFAULT 0,
        carrier VARCHAR(191) NULL,
        phoneType VARCHAR(64) NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone_verification_phone (phoneE164),
        INDEX idx_phone_verification_expires (expiresAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=${TABLE_CHARSET}
    `);

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
      CREATE TABLE IF NOT EXISTS deleted_user_archive (
        id VARCHAR(191) PRIMARY KEY,
        originalUserId VARCHAR(191) NOT NULL,
        email VARCHAR(191) NOT NULL,
        name VARCHAR(191) NULL,
        phone VARCHAR(32) NULL,
        rejectionReason TEXT NULL,
        rejectedAt DATETIME NULL,
        deletedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        deletedByAdminId VARCHAR(191) NULL,
        deletedByAdminName VARCHAR(191) NULL,
        INDEX idx_deleted_archive_email (email),
        INDEX idx_deleted_archive_deleted (deletedAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=${TABLE_CHARSET}
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS donation_campaign (
        id VARCHAR(191) PRIMARY KEY,
        title VARCHAR(191) NOT NULL,
        story TEXT NULL,
        beneficiaryNote VARCHAR(255) NULL,
        goalAmount DECIMAL(12,2) NULL,
        imageUrl TEXT NULL,
        isActive TINYINT(1) DEFAULT 1,
        sortOrder INT DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_donation_campaign_active (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=${TABLE_CHARSET}
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS donation_payment (
        id VARCHAR(191) PRIMARY KEY,
        orderId VARCHAR(191) NOT NULL UNIQUE,
        userId VARCHAR(191) NULL,
        donorName VARCHAR(191) NOT NULL,
        donorEmail VARCHAR(191) NULL,
        donorPhone VARCHAR(32) NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(8) DEFAULT 'INR',
        status ENUM('PENDING','PAID','FAILED','CANCELLED') DEFAULT 'PENDING',
        campaignId VARCHAR(191) NULL,
        message TEXT NULL,
        isAnonymous TINYINT(1) DEFAULT 0,
        paymentRef VARCHAR(191) NULL,
        paidAt DATETIME NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_donation_payment_user (userId),
        INDEX idx_donation_payment_status (status),
        INDEX idx_donation_payment_campaign (campaignId)
      ) ENGINE=InnoDB DEFAULT CHARSET=${TABLE_CHARSET}
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS donation_expenditure (
        id VARCHAR(191) PRIMARY KEY,
        title VARCHAR(191) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        category VARCHAR(32) DEFAULT 'OTHER',
        campaignId VARCHAR(191) NULL,
        expenditureDate DATE NOT NULL,
        receiptNote VARCHAR(255) NULL,
        createdByAdminId VARCHAR(191) NULL,
        createdByAdminName VARCHAR(191) NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_donation_exp_date (expenditureDate),
        INDEX idx_donation_exp_campaign (campaignId)
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
