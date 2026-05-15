CREATE TABLE IF NOT EXISTS "chatbot_sessions" (
  "id" TEXT PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" VARCHAR(120),
  "summary" TEXT,
  "state" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "chatbot_sessions_user_id_updated_at_idx"
  ON "chatbot_sessions"("user_id", "updated_at");

CREATE TABLE IF NOT EXISTS "chatbot_session_messages" (
  "id" SERIAL PRIMARY KEY,
  "session_id" TEXT NOT NULL REFERENCES "chatbot_sessions"("id") ON DELETE CASCADE,
  "role" VARCHAR(20) NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "chatbot_session_messages_session_id_created_at_idx"
  ON "chatbot_session_messages"("session_id", "created_at");
