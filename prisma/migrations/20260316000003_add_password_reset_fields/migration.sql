-- Add password reset OTP fields to users table
ALTER TABLE "users" ADD COLUMN "password_reset_code" TEXT;
ALTER TABLE "users" ADD COLUMN "password_reset_timestamp" TIMESTAMPTZ;
