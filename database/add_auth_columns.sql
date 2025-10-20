-- Add username and password columns to muser table
ALTER TABLE muser
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Update existing users with default username and password
UPDATE muser
SET username = LOWER(REGEXP_REPLACE(email, '@.*', '', 'g')),
    password = 'password123'
WHERE username IS NULL;

-- Make username NOT NULL after setting values
ALTER TABLE muser
ALTER COLUMN username SET NOT NULL;

-- Insert sample users if table is empty
INSERT INTO muser (email, username, password, full_name, role, active)
VALUES
    ('admin@pengajian.com', 'admin', 'admin123', 'Administrator', 'super_admin', 1),
    ('user@pengajian.com', 'user', 'user123', 'User Biasa', 'user', 1)
ON CONFLICT (email) DO NOTHING;

-- Create index for faster username lookup
CREATE INDEX IF NOT EXISTS idx_muser_username ON muser(username);

COMMENT ON COLUMN muser.username IS 'Username untuk login (unique)';
COMMENT ON COLUMN muser.password IS 'Password plain text (untuk development, production gunakan hash)';
