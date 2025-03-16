-- Clean existing data
TRUNCATE registrations CASCADE;
ALTER SEQUENCE registrations_id_seq RESTART WITH 1;

-- Insert test registrations
INSERT INTO registrations (
    event_name, event_code, event_day, event_time, event_location,
    team_size, team_lead_name, email, whatsapp_number, alternate_phone,
    college, payment_status, status, payment_amount, payment_date
) VALUES 
    -- Solo Events
    (
        'Solo Singing', 'TALSUTRA', 'day 1', 'first half', 'New Seminar Hall',
        1, 'John Smith', '69rtaj@gmail.com', '9876543210', '9876543211',
        'Engineering College', 'COMPLETED', 'approved', 90.00, NOW()
    ),
    (
        'Eastern Dance Solo', 'GRACE AND GRIN', 'day 1', 'first half', 'Boys Common Room',
        1, 'Maya Patel', '69rtaj@gmail.com', '9876543212', '9876543213',
        'Arts College', 'COMPLETED', 'approved', 90.00, NOW()
    ),
    -- Duo Events
    (
        'Face Painting', 'SHADE SHIFTERS', 'day 1', 'first half', 'Class Room',
        2, 'Emma Wilson', '69rtaj@gmail.com', '9876543214', '9876543215',
        'Design Institute', 'PENDING', 'pending', 80.00, NULL
    ),
    (
        'Debate', 'CLASH OF GYANIS', 'day 1', 'second half', 'Language Lab',
        2, 'Arjun Kumar', '69rtaj@gmail.com', '9876543216', '9876543217',
        'Law College', 'COMPLETED', 'approved', 90.00, NOW()
    ),
    -- Group Events
    (
        'Short Film', 'ABSOLUTE CINEMA', 'day 1', 'second half', 'APC Hall',
        5, 'Rahul Sharma', '69rtaj@gmail.com', '9876543218', '9876543219',
        'Film Institute', 'COMPLETED', 'approved', 250.00, NOW()
    ),
    (
        'Creative Group Dance', 'NATYA NINJAS', 'day 2', 'first half', 'Boys Common Room',
        6, 'Priya Singh', '69rtaj@gmail.com', '9876543220', '9876543221',
        'Dance Academy', 'PENDING', 'pending', 170.00, NULL
    ),
    (
        'Fashion Show', 'VOGUE VORTEX', 'day 2', 'second half', 'Boys Common Room',
        8, 'Sarah Johnson', '69rtaj@gmail.com', '9876543222', '9876543223',
        'Fashion Institute', 'COMPLETED', 'approved', 300.00, NOW()
    ),
    -- Additional test registrations
    (
        'Solo Singing', 'TALSUTRA', 'day 1', 'first half', 'New Seminar Hall',
        1, 'Ankit Kumar', '69rtaj@gmail.com', '9876543220', '9876543221',
        'Engineering College', 'PENDING', 'pending', 90.00, NULL
    ),
    (
        'Face Painting', 'SHADE SHIFTERS', 'day 1', 'first half', 'Class Room',
        2, 'Priya Sharma', '69rtaj@gmail.com', '9876543222', '9876543223',
        'Arts College', 'COMPLETED', 'approved', 80.00, NOW()
    ),
    (
        'Eastern Dance Solo', 'GRACE AND GRIN', 'day 1', 'first half', 'Boys Common Room',
        1, 'Riya Singh', '69rtaj@gmail.com', '9876543224', '9876543225',
        'Dance Academy', 'COMPLETED', 'approved', 90.00, NOW()
    ),
    (
        'Beatboxing Battle', 'DEXTER', 'day 1', 'second half', 'Boys Common Room',
        1, 'Rahul Das', '69rtaj@gmail.com', '9876543226', '9876543227',
        'Music Institute', 'PENDING', 'rejected', 90.00, NULL
    ),
    (
        'Debate', 'CLASH OF GYANIS', 'day 1', 'second half', 'Language Lab',
        2, 'Shreya Roy', '69rtaj@gmail.com', '9876543228', '9876543229',
        'Law School', 'COMPLETED', 'approved', 90.00, NOW()
    ),
    (
        'The Talent Show', 'SPOTLIGHT HEIST', 'day 1', 'second half', 'New Seminar Hall',
        1, 'Aditya Ghosh', '69rtaj@gmail.com', '9876543230', '9876543231',
        'Engineering College', 'PENDING', 'pending', 90.00, NULL
    ),
    (
        'Short Film', 'ABSOLUTE CINEMA', 'day 1', 'second half', 'APC Hall',
        5, 'Ishaan Chatterjee', '69rtaj@gmail.com', '9876543232', '9876543233',
        'Film Institute', 'COMPLETED', 'approved', 250.00, NOW()
    ),
    (
        'Group Dance', 'FUN FIASKO', 'day 1', 'second half', 'Boys Common Room',
        6, 'Tanvi Banerjee', '69rtaj@gmail.com', '9876543234', '9876543235',
        'Dance Academy', 'PENDING', 'pending', 170.00, NULL
    ),
    (
        'Quiz', 'WIT WIZARDRY', 'day 2', 'first half', 'Language Lab',
        1, 'Arjun Malik', '69rtaj@gmail.com', '9876543236', '9876543237',
        'Engineering College', 'COMPLETED', 'approved', 80.00, NOW()
    ),
    (
        'Street Dance Battle', 'NATYA NINJAS', 'day 2', 'second half', 'Boys Common Room',
        1, 'Rohit Sen', '69rtaj@gmail.com', '9876543238', '9876543239',
        'Dance School', 'PENDING', 'pending', 80.00, NULL
    ),
    (
        'Fashion Show', 'VOGUE VORTEX', 'day 2', 'second half', 'Boys Common Room',
        10, 'Neha Dutta', '69rtaj@gmail.com', '9876543240', '9876543241',
        'Fashion Institute', 'COMPLETED', 'approved', 300.00, NOW()
    ),
    (
        'Solo Singing', 'TALSUTRA', 'day 1', 'first half', 'New Seminar Hall',
        1, 'Sanjay Kumar', '69rtaj@gmail.com', '9876543242', '9876543243',
        'Music College', 'PENDING', 'rejected', 90.00, NULL
    ),
    (
        'Face Painting', 'SHADE SHIFTERS', 'day 1', 'first half', 'Class Room',
        2, 'Meera Patel', '69rtaj@gmail.com', '9876543244', '9876543245',
        'Design School', 'COMPLETED', 'approved', 80.00, NOW()
    ),
    (
        'Eastern Dance Solo', 'GRACE AND GRIN', 'day 1', 'first half', 'Boys Common Room',
        1, 'Aisha Khan', '69rtaj@gmail.com', '9876543246', '9876543247',
        'Dance Institute', 'PENDING', 'pending', 90.00, NULL
    ),
    (
        'Beatboxing Battle', 'DEXTER', 'day 1', 'second half', 'Boys Common Room',
        1, 'Varun Mehta', '69rtaj@gmail.com', '9876543248', '9876543249',
        'Music School', 'COMPLETED', 'approved', 90.00, NOW()
    ),
    (
        'Debate', 'CLASH OF GYANIS', 'day 1', 'second half', 'Language Lab',
        2, 'Kritika Jain', '69rtaj@gmail.com', '9876543250', '9876543251',
        'Law College', 'PENDING', 'pending', 90.00, NULL
    ),
    (
        'The Talent Show', 'SPOTLIGHT HEIST', 'day 1', 'second half', 'New Seminar Hall',
        1, 'Raj Malhotra', '69rtaj@gmail.com', '9876543252', '9876543253',
        'Arts College', 'COMPLETED', 'approved', 90.00, NOW()
    ),
    (
        'Short Film', 'ABSOLUTE CINEMA', 'day 1', 'second half', 'APC Hall',
        5, 'Abhishek Ray', '69rtaj@gmail.com', '9876543254', '9876543255',
        'Media Institute', 'PENDING', 'pending', 250.00, NULL
    ),
    (
        'Group Dance', 'FUN FIASKO', 'day 1', 'second half', 'Boys Common Room',
        6, 'Diya Sharma', '69rtaj@gmail.com', '9876543256', '9876543257',
        'Performing Arts School', 'COMPLETED', 'approved', 170.00, NOW()
    ),
    (
        'Quiz', 'WIT WIZARDRY', 'day 2', 'first half', 'Language Lab',
        1, 'Nikhil Verma', '69rtaj@gmail.com', '9876543258', '9876543259',
        'Science College', 'PENDING', 'rejected', 80.00, NULL
    );

-- Insert participants for each registration
INSERT INTO participants (registration_id, name, is_team_lead) VALUES
    -- Solo Singing Participant
    (1, 'John Smith', true),
    
    -- Eastern Dance Solo Participant
    (2, 'Maya Patel', true),
    
    -- Face Painting Team
    (3, 'Emma Wilson', true),
    (3, 'David Miller', false),
    
    -- Debate Team
    (4, 'Arjun Kumar', true),
    (4, 'Sneha Roy', false),
    
    -- Short Film Team
    (5, 'Rahul Sharma', true),
    (5, 'Amit Das', false),
    (5, 'Riya Kapoor', false),
    (5, 'Neha Gupta', false),
    (5, 'Vikram Singh', false),
    
    -- Creative Group Dance Team
    (6, 'Priya Singh', true),
    (6, 'Aisha Khan', false),
    (6, 'Rohan Mehta', false),
    (6, 'Zara Ahmed', false),
    (6, 'Kunal Verma', false),
    (6, 'Ananya Reddy', false),
    
    -- Fashion Show Team
    (7, 'Sarah Johnson', true),
    (7, 'Michael Brown', false),
    (7, 'Jessica Lee', false),
    (7, 'Robert Chen', false),
    (7, 'Amanda White', false),
    (7, 'Daniel Park', false),
    (7, 'Sophia Garcia', false),
    (7, 'James Wilson', false),
    -- Additional participants
    (6, 'Ankit Kumar', true),
    (9, 'Riya Singh', true),
    (10, 'Rahul Das', true),
    -- Face Painting team
    (7, 'Priya Sharma', true),
    (7, 'Rohan Gupta', false),
    -- Debate team
    (11, 'Shreya Roy', true),
    (11, 'Arnab Sen', false),
    -- Short Film team
    (13, 'Ishaan Chatterjee', true),
    (13, 'Priyanka Das', false),
    (13, 'Sourav Paul', false),
    (13, 'Ankita Basu', false),
    (13, 'Deep Singh', false),
    -- Group Dance team
    (14, 'Tanvi Banerjee', true),
    (14, 'Ritika Shah', false),
    (14, 'Arunima Roy', false),
    (14, 'Suraj Kumar', false),
    (14, 'Prerna Singh', false),
    (14, 'Ayush Jha', false);
