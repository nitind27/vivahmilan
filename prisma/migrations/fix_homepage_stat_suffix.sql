-- Fix production homepage_stat missing columns (suffix, label, etc.)
ALTER TABLE `homepage_stat`
  ADD COLUMN `suffix` VARCHAR(32) NOT NULL DEFAULT '' AFTER `value`;

-- Safe to re-run only if column missing; app also auto-migrates via ensureHomepageStatTable()
