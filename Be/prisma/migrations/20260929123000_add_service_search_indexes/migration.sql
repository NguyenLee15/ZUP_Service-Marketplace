CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE INDEX "services_name_trgm_idx"
  ON "services" USING GIN ("name" gin_trgm_ops);

CREATE INDEX "services_description_trgm_idx"
  ON "services" USING GIN ("description" gin_trgm_ops);

CREATE INDEX "user_addresses_default_location_idx"
  ON "user_addresses" ("is_default", "latitude", "longitude", "user_id");
