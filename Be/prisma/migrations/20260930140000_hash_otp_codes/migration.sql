CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "otp_attempts"
ADD COLUMN "code_hash" VARCHAR(64);

UPDATE "otp_attempts"
SET "code_hash" = encode(digest("code", 'sha256'), 'hex')
WHERE "code" IS NOT NULL AND "code_hash" IS NULL;

ALTER TABLE "otp_attempts"
ALTER COLUMN "code" DROP NOT NULL;
