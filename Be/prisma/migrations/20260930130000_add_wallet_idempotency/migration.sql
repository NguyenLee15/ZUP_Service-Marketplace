CREATE TABLE "wallet_idempotency_keys" (
    "id" SERIAL NOT NULL,
    "provider_id" INTEGER NOT NULL,
    "scope" VARCHAR(80) NOT NULL,
    "key" VARCHAR(36) NOT NULL,
    "request_hash" VARCHAR(64) NOT NULL,
    "status" "IdempotencyStatus" NOT NULL,
    "status_code" INTEGER,
    "response_body" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wallet_idempotency_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "wallet_idempotency_keys_provider_id_scope_key_key"
ON "wallet_idempotency_keys"("provider_id", "scope", "key");
CREATE INDEX "wallet_idempotency_keys_expires_at_idx"
ON "wallet_idempotency_keys"("expires_at");
ALTER TABLE "wallet_idempotency_keys"
ADD CONSTRAINT "wallet_idempotency_keys_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
