-- Add rejection_reason column if not exists
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
