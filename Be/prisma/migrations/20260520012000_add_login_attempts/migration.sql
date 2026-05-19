CREATE TABLE IF NOT EXISTS "login_attempts" (
  "id" SERIAL PRIMARY KEY,
  "identifier" VARCHAR(180) NOT NULL UNIQUE,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "window_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "locked_until" TIMESTAMP(3),
  "last_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "login_attempts_locked_until_idx"
  ON "login_attempts"("locked_until");
