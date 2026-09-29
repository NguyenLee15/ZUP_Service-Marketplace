-- Phase B: raw token columns are removed only after phase A backfill and expiry verification.
BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "refresh_tokens"
    WHERE "token_hash" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot drop refresh_tokens.token: token_hash backfill is incomplete';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "password_resets"
    WHERE "token_hash" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot drop password_resets.token: token_hash backfill is incomplete';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "refresh_tokens"
    WHERE "token" <> ''
      AND "expires_at" > NOW()
  ) THEN
    RAISE EXCEPTION 'Cannot drop refresh_tokens.token: active raw tokens remain';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "password_resets"
    WHERE "token" <> ''
      AND "used" = FALSE
      AND "expires_at" > NOW()
  ) THEN
    RAISE EXCEPTION 'Cannot drop password_resets.token: active raw tokens remain';
  END IF;
END $$;

ALTER TABLE "refresh_tokens"
  ALTER COLUMN "token_hash" SET NOT NULL;

ALTER TABLE "password_resets"
  ALTER COLUMN "token_hash" SET NOT NULL;

ALTER TABLE "refresh_tokens"
  DROP COLUMN "token";

ALTER TABLE "password_resets"
  DROP COLUMN "token";

COMMIT;
