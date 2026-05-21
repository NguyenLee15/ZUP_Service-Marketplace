-- Track whether the provider explicitly accepted a newly-created booking.
ALTER TABLE "bookings"
  ADD COLUMN "provider_accepted_at" TIMESTAMP(3),
  ADD COLUMN "provider_response_deadline" TIMESTAMP(3);

-- Existing active bookings predate the provider-acceptance flow, so mark them accepted.
UPDATE "bookings"
SET "provider_accepted_at" = "created_at"
WHERE "status" <> 'CANCELLED'
  AND "provider_accepted_at" IS NULL;

UPDATE "bookings"
SET "provider_response_deadline" = "created_at" + INTERVAL '1 minute'
WHERE "provider_response_deadline" IS NULL;

CREATE INDEX "bookings_status_provider_accepted_at_provider_response_deadline_idx"
  ON "bookings"("status", "provider_accepted_at", "provider_response_deadline");
