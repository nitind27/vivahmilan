-- Photo content hash for duplicate detection across accounts
ALTER TABLE photo ADD COLUMN contentHash VARCHAR(64) NULL;
CREATE INDEX idx_photo_contentHash ON photo(contentHash);
