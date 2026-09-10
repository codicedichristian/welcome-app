-- Add registration_required toggle to events, independent of members_only
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_required BOOLEAN NOT NULL DEFAULT false;
