ALTER TABLE "conversations"
  ADD COLUMN IF NOT EXISTS "service_id" INTEGER;

DO $$
BEGIN
  ALTER TABLE "conversations"
    ADD CONSTRAINT "conversations_service_id_fkey"
    FOREIGN KEY ("service_id")
    REFERENCES "services"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "conversations_service_id_idx"
  ON "conversations"("service_id");

CREATE UNIQUE INDEX IF NOT EXISTS "conversations_customer_id_provider_id_service_id_key"
  ON "conversations"("customer_id", "provider_id", "service_id");
