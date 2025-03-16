-- Add required columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create or update admin user
INSERT INTO users (email, name, is_admin) 
VALUES ('admin@mesem.com', 'Admin User', true)
ON CONFLICT (email) 
DO UPDATE SET is_admin = true, name = 'Admin User'
WHERE users.email = 'admin@mesem.com';
