-- Run this on your MySQL database to fix slow queries
-- These indexes are critical for performance

-- chatroom table
ALTER TABLE chatroom ADD INDEX IF NOT EXISTS idx_chatroom_userA (userAId);
ALTER TABLE chatroom ADD INDEX IF NOT EXISTS idx_chatroom_userB (userBId);

-- message table — add live location columns if not already present
ALTER TABLE message ADD COLUMN IF NOT EXISTS `locationExpiry` DATETIME(3) NULL;
ALTER TABLE message ADD COLUMN IF NOT EXISTS `locationType` VARCHAR(191) NULL;
ALTER TABLE message ADD INDEX IF NOT EXISTS idx_message_room_created (chatRoomId, createdAt DESC);
ALTER TABLE message ADD INDEX IF NOT EXISTS idx_message_room_read (chatRoomId, isRead, receiverId);

-- profile table
ALTER TABLE profile ADD INDEX IF NOT EXISTS idx_profile_userId (userId);
ALTER TABLE profile ADD INDEX IF NOT EXISTS idx_profile_gender (gender);
ALTER TABLE profile ADD INDEX IF NOT EXISTS idx_profile_religion (religion);
ALTER TABLE profile ADD INDEX IF NOT EXISTS idx_profile_country_state_city (country, state, city);

-- photo table
ALTER TABLE photo ADD INDEX IF NOT EXISTS idx_photo_userId_main (userId, isMain);

-- user table
ALTER TABLE `user` ADD INDEX IF NOT EXISTS idx_user_active_verified (isActive, adminVerified);

-- interest table
ALTER TABLE interest ADD INDEX IF NOT EXISTS idx_interest_sender (senderId);
ALTER TABLE interest ADD INDEX IF NOT EXISTS idx_interest_receiver (receiverId);
ALTER TABLE interest ADD INDEX IF NOT EXISTS idx_interest_status (status);

-- shortlist table
ALTER TABLE shortlist ADD INDEX IF NOT EXISTS idx_shortlist_owner (ownerId);
ALTER TABLE shortlist ADD INDEX IF NOT EXISTS idx_shortlist_target (targetId);

-- block table
ALTER TABLE block ADD INDEX IF NOT EXISTS idx_block_blocker (blockerId);
ALTER TABLE block ADD INDEX IF NOT EXISTS idx_block_blocked (blockedId);

-- notification table
ALTER TABLE notification ADD INDEX IF NOT EXISTS idx_notification_userId_read (userId, isRead);
ALTER TABLE notification ADD INDEX IF NOT EXISTS idx_notification_userId_created (userId, createdAt DESC);
