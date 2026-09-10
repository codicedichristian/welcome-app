-- Add members_only toggle to news and events, independent of category/type
ALTER TABLE news ADD COLUMN IF NOT EXISTS members_only BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS members_only BOOLEAN NOT NULL DEFAULT false;
