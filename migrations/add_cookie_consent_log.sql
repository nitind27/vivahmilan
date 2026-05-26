-- Anonymous cookie consent choices (for admin statistics; no personal data required)
CREATE TABLE IF NOT EXISTS cookieconsentlog (
  id          VARCHAR(36)  PRIMARY KEY,
  choiceType  VARCHAR(20)  NOT NULL COMMENT 'all | essential | custom',
  functional  TINYINT(1)   NOT NULL DEFAULT 0,
  analytics   TINYINT(1)   NOT NULL DEFAULT 0,
  sessionId   VARCHAR(64)  DEFAULT NULL,
  createdAt   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_createdAt (createdAt),
  INDEX idx_choiceType (choiceType)
);
