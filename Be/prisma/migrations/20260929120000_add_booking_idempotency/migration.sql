CREATE TYPE "IdempotencyStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "idempotency_keys" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "scope" VARCHAR(80) NOT NULL,
    "key" VARCHAR(36) NOT NULL,
    "request_hash" VARCHAR(64) NOT NULL,
    "status" "IdempotencyStatus" NOT NULL,
    "status_code" INTEGER,
    "response_body" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idempotency_keys_customer_id_scope_key_key"
    ON "idempotency_keys"("customer_id", "scope", "key");
CREATE INDEX "idempotency_keys_expires_at_idx"
    ON "idempotency_keys"("expires_at");

ALTER TABLE "idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
