-- Speed up /admin/members on large datasets (2M+ users).
-- Safe to run multiple times — skips indexes that already exist.

-- user: role + createdAt + id for cursor pagination
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'user' AND index_name = 'idx_user_role_created_id');
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_user_role_created_id ON `user` (role, createdAt DESC, id DESC)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- user: role + createdAt for listing
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'user' AND index_name = 'idx_user_role_created');
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_user_role_created ON `user` (role, createdAt DESC)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- user: status filters (premium, verified, blocked)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'user' AND index_name = 'idx_user_role_status');
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_user_role_status ON `user` (role, isActive, adminVerified, isPremium)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- profile: gender filter
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'profile' AND index_name = 'idx_profile_gender');
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_profile_gender ON profile (gender, userId)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- photo: main photo lookup per user
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'photo' AND index_name = 'idx_photo_user_main');
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_photo_user_main ON photo (userId, isMain)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
