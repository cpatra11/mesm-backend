-- Clean existing data
TRUNCATE users CASCADE;
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Insert admin users
INSERT INTO users (name, email, password, is_admin, is_verified) VALUES 
('Admin User', 'admin@mesem.com', '$2b$12$LQrZ6Xq5dZgR8AB4NBQfYOQeGgF8xEv7uH7Tl.oWmWKHXtDqQe9f2', true, true),
('Event Manager', 'manager@mesem.com', '$2b$12$LQrZ6Xq5dZgR8AB4NBQfYOQeGgF8xEv7uH7Tl.oWmWKHXtDqQe9f2', true, true);

-- Insert regular users
INSERT INTO users (name, email, is_verified, created_at) VALUES 
('John Smith', '69rtaj@gmail.com', true, NOW() - INTERVAL '2 days'),
('Emma Wilson', '69rtaj@gmail.com', true, NOW() - INTERVAL '1 day'),
('Sarah Johnson', '69rtaj@gmail.com', false, NOW()),
('Mike Chang', '69rtaj@gmail.com', true, NOW() - INTERVAL '3 days'),
('Lisa Brown', '69rtaj@gmail.com', true, NOW() - INTERVAL '4 days')
ON CONFLICT (email) DO NOTHING;
