-- Converts translatable text columns in events and news to JSONB.
-- Existing content is preserved as the Spanish ('es') value.

ALTER TABLE events
  ALTER COLUMN title       TYPE jsonb USING jsonb_build_object('es', title),
  ALTER COLUMN description TYPE jsonb USING CASE
    WHEN description IS NULL THEN NULL
    ELSE jsonb_build_object('es', description)
  END;

ALTER TABLE news
  ALTER COLUMN title TYPE jsonb USING jsonb_build_object('es', title),
  ALTER COLUMN body  TYPE jsonb USING jsonb_build_object('es', body);
