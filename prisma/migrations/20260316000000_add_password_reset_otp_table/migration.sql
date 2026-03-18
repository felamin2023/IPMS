-- Create password_reset_otps table
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  code character varying(6) NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);

-- Enable RLS
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Create policies (allow public access for reset flow)
CREATE POLICY "Allow public to insert OTP" ON password_reset_otps AS PERMISSIVE FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public to read own OTP" ON password_reset_otps AS PERMISSIVE FOR SELECT USING (true);
CREATE POLICY "Allow public to update OTP" ON password_reset_otps AS PERMISSIVE FOR UPDATE USING (true);
CREATE POLICY "Allow public to delete OTP" ON password_reset_otps AS PERMISSIVE FOR DELETE USING (true);
