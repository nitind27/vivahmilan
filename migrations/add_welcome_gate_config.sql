-- Admin toggle: welcome_gate_enabled
-- 1 = require welcome.html preview login before site access
-- 0 = open website directly (default)

INSERT INTO siteconfig (id, `key`, value, createdAt, updatedAt)
SELECT UUID(), 'welcome_gate_enabled', '0', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM siteconfig WHERE `key` = 'welcome_gate_enabled');
