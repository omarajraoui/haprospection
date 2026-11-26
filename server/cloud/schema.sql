CREATE SCHEMA IF NOT EXISTS ha_prospection;
REVOKE ALL ON SCHEMA ha_prospection FROM PUBLIC;

CREATE TABLE IF NOT EXISTS ha_prospection.auth_sessions (
  token_hash text PRIMARY KEY,
  owner uuid NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS ha_auth_expiration ON ha_prospection.auth_sessions (expires_at);

CREATE TABLE IF NOT EXISTS ha_prospection.sessions (
  owner uuid NOT NULL,
  id uuid NOT NULL,
  state jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (owner, id)
);
CREATE INDEX IF NOT EXISTS ha_sessions_created ON ha_prospection.sessions (owner, created_at DESC);

CREATE TABLE IF NOT EXISTS ha_prospection.sources (
  owner uuid NOT NULL,
  id uuid NOT NULL,
  details jsonb NOT NULL,
  PRIMARY KEY (owner, id)
);
