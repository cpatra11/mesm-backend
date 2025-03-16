BEGIN;

-- Drop and recreate email_templates table
DROP TABLE IF EXISTS email_templates CASCADE;

CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    description TEXT,
    variables JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_template_type CHECK (template_type IN ('approval', 'rejection', 'reminder', 'notification'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);

-- Create email_logs table if not exists
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES email_templates(id),
    registration_id INTEGER REFERENCES registrations(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_email_status CHECK (status IN ('pending', 'sent', 'failed'))
);

COMMIT;
