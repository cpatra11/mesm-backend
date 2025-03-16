-- First ensure schema is clean
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO current_user;
GRANT ALL ON SCHEMA public TO public;

-- Create base tables in correct order
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password VARCHAR(255),
    google_id VARCHAR(255),
    profile_picture VARCHAR(1024),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    verification_code VARCHAR(6),
    verification_code_expires_at TIMESTAMP WITH TIME ZONE,
    verification_attempts INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    phonepe_transaction_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Validate base tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
        RAISE EXCEPTION 'users table was not created properly';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transactions') THEN
        RAISE EXCEPTION 'transactions table was not created properly';
    END IF;
END $$;

-- Create app tables
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_code VARCHAR(50) NOT NULL,
    event_day VARCHAR(50) NOT NULL,
    event_time VARCHAR(50) NOT NULL,
    event_location VARCHAR(255) NOT NULL,
    team_size INTEGER NOT NULL,
    team_lead_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    college VARCHAR(255) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    status VARCHAR(50) DEFAULT 'pending',
    payment_amount DECIMAL(10,2),
    payment_date TIMESTAMP WITH TIME ZONE,
    transaction_id VARCHAR(255),
    payment_method VARCHAR(50),
    payment_screenshot_url TEXT,
    cloudinary_public_id TEXT,
    last_email_sent VARCHAR(50),
    last_email_sent_at TIMESTAMP WITH TIME ZONE,
    email_status VARCHAR(50) DEFAULT 'not_sent',
    verification_notes TEXT,
    admin_remarks TEXT,
    upi_transaction_id VARCHAR(255),
    rejection_reason TEXT,
    rejection_date TIMESTAMP WITH TIME ZONE,
    rejected_by INTEGER REFERENCES users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    approved_by INTEGER REFERENCES users(id),
    verification_status VARCHAR(50) DEFAULT 'pending',
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_verification_status CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_verification ON registrations(verification_status);

CREATE TABLE IF NOT EXISTS participants (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER REFERENCES registrations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_team_lead BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    template_type VARCHAR(50) NOT NULL DEFAULT 'notification',
    content TEXT NOT NULL,
    variables JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_template_type CHECK (template_type IN ('approval', 'rejection', 'reminder', 'notification'))
);

CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES email_templates(id),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    bulk_email_id INTEGER,
    registration_id INTEGER REFERENCES registrations(id) ON DELETE SET NULL,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add constraints
DO $$ 
BEGIN
    -- Email validation
    ALTER TABLE registrations ADD CONSTRAINT valid_email 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    
    -- Phone number validation
    ALTER TABLE registrations ADD CONSTRAINT valid_whatsapp 
        CHECK (whatsapp_number ~ '^\d{10}$');
    
    ALTER TABLE registrations ADD CONSTRAINT valid_phone 
        CHECK (alternate_phone IS NULL OR alternate_phone ~ '^\d{10}$');
    
    -- Payment status validation
    ALTER TABLE registrations ADD CONSTRAINT valid_payment_status
        CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'));
END $$;

-- Final validation
DO $$ 
BEGIN
    -- Verify all required tables exist
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'registrations') THEN
        RAISE EXCEPTION 'registrations table was not created properly';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'participants') THEN
        RAISE EXCEPTION 'participants table was not created properly';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_templates') THEN
        RAISE EXCEPTION 'email_templates table was not created properly';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_logs') THEN
        RAISE EXCEPTION 'email_logs table was not created properly';
    END IF;
END $$;

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_participants_registration ON participants(registration_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Also add the column to existing table if needed
DO $$ 
BEGIN
    -- Add column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'registrations' 
                  AND column_name = 'upi_transaction_id') THEN
        ALTER TABLE registrations ADD COLUMN upi_transaction_id VARCHAR(255);
    END IF;
END $$;

