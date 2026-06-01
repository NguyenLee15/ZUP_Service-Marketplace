-- Harden wallet transactions for idempotent payment callbacks and auditing.
ALTER TABLE "wallet_transactions"
  ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(140),
  ADD COLUMN IF NOT EXISTS "processed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "failure_reason" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "wallet_transactions_idempotency_key_key"
  ON "wallet_transactions"("idempotency_key");

CREATE UNIQUE INDEX IF NOT EXISTS "wallet_transactions_vnpay_txn_ref_key"
  ON "wallet_transactions"("vnpay_txn_ref");
