-- Migration: Add Admin User to admin_users table
-- Run this SQL to create an admin user in your admin_users table

-- Create new admin user
INSERT INTO
  admin_users (username, email, password_hash, role)
VALUES
  (
    'admin'
    , 'admin@babybliss.com'
    , '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    , -- bcrypt hash of 'admin123'
      'admin'
  );

-- Verify admin users
SELECT
  id
  , username
  , email
  , role
  , created_at
FROM
  admin_users
WHERE
  role = 'admin';