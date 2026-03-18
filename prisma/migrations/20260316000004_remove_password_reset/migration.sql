-- Remove password reset functionality from database
ALTER TABLE "users" DROP COLUMN IF EXISTS "password_reset_code";
ALTER TABLE "users" DROP COLUMN IF EXISTS "password_reset_timestamp";
DROP TABLE IF EXISTS "password_reset_otps";
