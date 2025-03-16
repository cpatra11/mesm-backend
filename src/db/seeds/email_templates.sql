-- Start transaction and handle cascade properly
BEGIN;

-- Delete existing data safely
DELETE FROM email_logs;
DELETE FROM email_templates;

-- Reset sequence
ALTER SEQUENCE email_templates_id_seq RESTART WITH 1;

-- Insert default templates with updated font handling
INSERT INTO email_templates (name, subject, template_type, content, variables) 
VALUES (
    'registration_approval',
    'Registration Approved for {{event}}',
    'approval',
    $email_template$
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; text-align: center; }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background-color: #ffffff;
            background-image: url('https://res.cloudinary.com/desgmuqtu/image/upload/v1742047727/ckwnrsazka8nzgmq2iip.webp');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            position: relative;
            color: #333;
            padding: 60px 20px;
            border-radius: 10px 10px 0 0;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            margin-bottom: 0;
            text-align: left;
        }
        .header:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 10px 10px 0 0;
        }
        .header * {
            position: relative;
            z-index: 2;
        }
        .logo {
            width: 300px;
            height: auto;
            margin: 0 0 20px;
            display: block;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
            object-fit: contain;
            aspect-ratio: 3/1;
        }
        .heading {
            font-size: 48px;
            font-weight: 800;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 3px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        h2, h3, h4 {
            font-weight: 700;
            margin: 15px 0;
            color: #2d3748;
        }
        .content {
            padding: 40px;
            background: #fff;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .registration-approved {
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f0fff4;
            color: #22543d;
            font-size: 28px;
            font-weight: 800;
            padding: 25px;
            border-radius: 12px;
            margin: 25px auto;
            max-width: 400px;
            text-transform: uppercase;
            border: 3px solid #48bb78;
        }
        .registration-approved img {
            margin-right: 15px;
            width: 32px;
            height: 32px;
        }
        .content {
            padding: 30px;
            background: #fff;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-size: 16px;
        }
        .content h2 {
            font-size: 24px;
            color: #2d3748;
            margin-bottom: 15px;
            font-weight: 700;
        }
        .content h3 {
            font-size: 20px;
            color: #4a5568;
            margin: 20px 0 10px;
            font-weight: 600;
        }
        .content strong {
            color: #2d3748;
            font-weight: 600;
        }
        ul {
            list-style: none;
            padding: 0;
            margin: 15px 0;
        }
        ul li {
            margin: 12px 0;
            padding-left: 25px;
            position: relative;
            font-weight: 500;
        }
        ul li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #4F46E5;
            font-size: 18px;
            font-weight: bold;
        }
        .highlight {
            font-weight: 600;
            color: #4F46E5;
        }
        p {
            margin: 15px 0;
            line-height: 1.8;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
            font-weight: 500;
        }
        .footer p:last-child {
            margin-top: 10px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src='https://res.cloudinary.com/desgmuqtu/image/upload/v1741963902/ogh2ttidsu9xr41hkc6y.png' 
                 alt="Mesmerizer 2025" 
                 class="logo">
        </div>
        <div class="content">
            <div class="registration-approved">
                <img src='https://www.iconpacks.net/icons/2/free-check-mark-icon-3280-thumb.png' alt="Check Mark">
                Registration Approved
            </div>
            <p>Dear <strong>{{name}}</strong>,</p>
            <p>We're excited to inform you that your registration for <span class="highlight">{{event}}</span> has been approved!</p>
            <h3>Event Details:</h3>
            <ul>
                <li><strong>Event:</strong> {{event}}</li>
                <li><strong>Date:</strong> {{eventDate}}</li>
                <li><strong>Location:</strong> {{eventLocation}}</li>
            </ul>
            <p>We look forward to seeing you at the event!</p>
        </div>
        <div class="footer">
            <p>This is an automated message, please do not reply.</p>
            <p>MESMERIZER'25 ECO-CULTURAL CLUB, NSEC, KOLKATA.</p>
        </div>
    </div>
</body>
</html>
$email_template$,
    '{"name":"string","event":"string","eventDate":"string","eventTime":"string","eventLocation":"string"}'::jsonb
), (
    'registration_rejection',
    'Registration Status Update for {{event}}',
    'rejection',
    $email_template$
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; text-align: center; }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background-color: #ffffff;
            background-image: url('https://res.cloudinary.com/desgmuqtu/image/upload/v1742047727/ckwnrsazka8nzgmq2iip.webp');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            position: relative;
            color: #333;
            padding: 60px 20px;
            border-radius: 10px 10px 0 0;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            margin-bottom: 0;
            text-align: left;
        }
        .header:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 10px 10px 0 0;
        }
        .header * {
            position: relative;
            z-index: 2;
        }
        .logo {
            width: 300px;
            height: auto;
            margin: 0 0 20px;
            display: block;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
            object-fit: contain;
            aspect-ratio: 3/1;
        }
        .heading {
            font-size: 48px;
            font-weight: 800;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 3px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        h2, h3, h4 {
            font-weight: 700;
            margin: 15px 0;
            color: #2d3748;
        }
        .content {
            padding: 40px;
            background: #fff;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .rejection-notice {
            display: flex;
            align-items: center;
            background-color: #fff5f5;
            color: #742a2a;
            font-size: 28px;
            font-weight: 800;
            padding: 25px;
            border-radius: 12px;
            margin: 25px auto;
            max-width: 400px;
            text-transform: uppercase;
            border: 3px solid #fc8181;
        }
        .rejection-notice span {
            margin-right: 15px;
            font-size: 32px;
        }
        .content {
            padding: 30px;
            background: #fff;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-size: 16px;
        }
        .reason-box {
            background: #f8f9fa;
            border-left: 4px solid #dc3545;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .reason-box h3 {
            color: #742a2a;
            font-size: 18px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .contact-info {
            background: #ebf4ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: center;
            border: 1px solid #b3d4fc;
        }
        .contact-info h3 {
            color: #2c5282;
            font-size: 18px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        p {
            margin: 15px 0;
            line-height: 1.8;
        }
        strong {
            color: #2d3748;
            font-weight: 600;
        }
        .highlight {
            font-weight: 600;
            color: #4F46E5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src='https://res.cloudinary.com/desgmuqtu/image/upload/v1741963902/ogh2ttidsu9xr41hkc6y.png' 
                 alt="Mesmerizer 2025" 
                 class="logo">
        </div>
        <div class="content">
            <div class="rejection-notice">
                <span>❌</span>
                Registration Rejected
            </div>
            <p>Dear <strong>{{name}}</strong>,</p>
            <p>Thank you for your interest in <span class="highlight">{{event}}</span>. After careful review, we regret to inform you that we are unable to approve your registration at this time.</p>
            <div class="reason-box">
                <h3>Reason for Rejection:</h3>
                <p>{{reason}}</p>
            </div>
            <div class="contact-info">
                <h3>Need Help?</h3>
                <p>If you have any questions, please don't hesitate to contact our support team.</p>
                <p><strong>Email:</strong> support@mesmerizer.com</p>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated message, please do not reply.</p>
            <p>MESMERIZER'25 ECO-CULTURAL CLUB, NSEC, KOLKATA.</p>
        </div>
    </div>
</body>
</html>
$email_template$,
    '{"name":"string","event":"string","reason":"string"}'::jsonb
);

-- Update any existing templates
UPDATE email_templates 
SET updated_at = CURRENT_TIMESTAMP
WHERE name IN ('registration_approval', 'registration_rejection');

-- Commit transaction
COMMIT;
