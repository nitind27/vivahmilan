-- Create pending_registration table for storing registration data before OTP verification
CREATE TABLE IF NOT EXISTS `pending_registration` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(20),
  `password` VARCHAR(255) NOT NULL,
  `gender` VARCHAR(20),
  `otp` VARCHAR(6) NOT NULL,
  `otpExpiresAt` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_otp_expiry` (`otpExpiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add cleanup for expired pending registrations (optional - can be run as a cron job)
-- DELETE FROM pending_registration WHERE otpExpiresAt < NOW();
