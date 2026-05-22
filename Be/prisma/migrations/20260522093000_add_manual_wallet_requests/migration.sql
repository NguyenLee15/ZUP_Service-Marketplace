DO $$ BEGIN
  CREATE TYPE "WalletRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'WITHDRAWAL';

CREATE TABLE IF NOT EXISTS "withdrawal_requests" (
  "id" SERIAL PRIMARY KEY,
  "provider_id" INTEGER NOT NULL,
  "amount" DECIMAL(15, 2) NOT NULL,
  "bank_name" VARCHAR(100) NOT NULL,
  "bank_account_number" VARCHAR(50) NOT NULL,
  "bank_account_holder" VARCHAR(100) NOT NULL,
  "status" "WalletRequestStatus" NOT NULL DEFAULT 'PENDING',
  "admin_note" TEXT,
  "processed_by" INTEGER,
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "withdrawal_requests_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "withdrawal_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "manual_deposit_requests" (
  "id" SERIAL PRIMARY KEY,
  "provider_id" INTEGER NOT NULL,
  "amount" DECIMAL(15, 2) NOT NULL,
  "transfer_code" VARCHAR(100),
  "receipt_url" VARCHAR(255),
  "status" "WalletRequestStatus" NOT NULL DEFAULT 'PENDING',
  "admin_note" TEXT,
  "processed_by" INTEGER,
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "manual_deposit_requests_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "manual_deposit_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "withdrawal_requests_provider_id_status_idx"
  ON "withdrawal_requests"("provider_id", "status");

CREATE INDEX IF NOT EXISTS "withdrawal_requests_status_created_at_idx"
  ON "withdrawal_requests"("status", "created_at");

CREATE INDEX IF NOT EXISTS "manual_deposit_requests_provider_id_status_idx"
  ON "manual_deposit_requests"("provider_id", "status");

CREATE INDEX IF NOT EXISTS "manual_deposit_requests_status_created_at_idx"
  ON "manual_deposit_requests"("status", "created_at");
