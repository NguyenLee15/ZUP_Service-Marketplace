CREATE INDEX IF NOT EXISTS "bookings_status_created_at_idx"
ON "bookings"("status", "created_at");

CREATE INDEX IF NOT EXISTS "bookings_provider_id_status_created_at_idx"
ON "bookings"("provider_id", "status", "created_at");

CREATE INDEX IF NOT EXISTS "bookings_service_id_status_created_at_idx"
ON "bookings"("service_id", "status", "created_at");

CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"
ON "audit_logs"("created_at");

CREATE INDEX IF NOT EXISTS "audit_logs_action_target_type_created_at_idx"
ON "audit_logs"("action", "target_type", "created_at");
