-- Add app open count column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS app_open_count INTEGER NOT NULL DEFAULT 0;

-- Atomic increment function — returns the new count after update
CREATE OR REPLACE FUNCTION increment_app_open_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE users SET app_open_count = app_open_count + 1 WHERE id = p_user_id RETURNING app_open_count;
$$;
