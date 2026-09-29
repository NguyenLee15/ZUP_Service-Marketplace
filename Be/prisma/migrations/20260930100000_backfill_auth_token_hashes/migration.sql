-- Phase A: backfill hashes for legacy raw tokens without dropping compatibility columns.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE "refresh_tokens"
SET "token_hash" = encode(digest("token", 'sha256'), 'hex')
WHERE "token_hash" IS NULL
  AND "token" <> '';

UPDATE "password_resets"
SET "token_hash" = encode(digest("token", 'sha256'), 'hex')
WHERE "token_hash" IS NULL
  AND "token" <> '';
