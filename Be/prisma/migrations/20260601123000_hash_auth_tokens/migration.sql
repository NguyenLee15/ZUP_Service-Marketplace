-- Add nullable hash columns so legacy raw tokens remain valid until expiry.
ALTER TABLE "refresh_tokens" ADD COLUMN "token_hash" VARCHAR(64);
ALTER TABLE "password_resets" ADD COLUMN "token_hash" VARCHAR(64);

CREATE UNIQUE INDEX "refresh_tokens_token_hash_key"
  ON "refresh_tokens"("token_hash");

CREATE UNIQUE INDEX "password_resets_token_hash_key"
  ON "password_resets"("token_hash");
