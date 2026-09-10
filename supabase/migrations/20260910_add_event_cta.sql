-- Add configurable CTA (rsvp, link, or hidden) to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS cta_type TEXT NOT NULL DEFAULT 'rsvp';
ALTER TABLE events ADD COLUMN IF NOT EXISTS cta_url TEXT;
