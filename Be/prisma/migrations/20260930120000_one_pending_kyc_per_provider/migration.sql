CREATE UNIQUE INDEX "kyc_profiles_one_pending_per_provider"
ON "kyc_profiles" ("provider_id")
WHERE "status" = 'PENDING';
