-- Simplify password_reset_otps table - remove unnecessary columns
ALTER TABLE password_reset_otps DROP COLUMN IF EXISTS expires_at;
ALTER TABLE password_reset_otps DROP COLUMN IF EXISTS attempts;
