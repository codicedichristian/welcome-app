-- Add members_only toggle to events, independent of type
ALTER TABLE events ADD COLUMN IF NOT EXISTS members_only BOOLEAN NOT NULL DEFAULT false;
