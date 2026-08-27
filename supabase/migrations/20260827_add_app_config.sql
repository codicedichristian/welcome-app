CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_config (key, value)
VALUES ('default_language', 'es')
ON CONFLICT (key) DO NOTHING;
