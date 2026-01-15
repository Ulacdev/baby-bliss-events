-- Baby Bliss Database Schema
-- Run this SQL script in phpMyAdmin or MySQL command line to set up the database

CREATE DATABASE
IF
  NOT EXISTS baby_bliss;
  USE baby_bliss;

  -- Users table for authentication
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY
    , email VARCHAR(255) UNIQUE NOT NULL
    , password_hash VARCHAR(255) NOT NULL
    , role ENUM('admin', 'staff') DEFAULT 'admin'
    , session_token VARCHAR(255)
    , session_expires DATETIME
    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE
      CURRENT_TIMESTAMP
  );

  -- Profiles table for user profile information
  CREATE TABLE profiles (
    id INT AUTO_INCREMENT PRIMARY KEY
    , user_id INT NOT NULL
    , first_name VARCHAR(100)
    , last_name VARCHAR(100)
    , full_name VARCHAR(255)
    , phone VARCHAR(20)
    , bio TEXT
    , profile_image VARCHAR(255)
    , business_name VARCHAR(255)
    , business_address TEXT
    , business_phone VARCHAR(20)
    , business_email VARCHAR(255)
    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE
      CURRENT_TIMESTAMP
      , FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
  );

  -- Clients table for customer management
  CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY
    , first_name VARCHAR(100) NOT NULL
    , last_name VARCHAR(100) NOT NULL
    , email VARCHAR(255) UNIQUE NOT NULL
    , phone VARCHAR(20)
    , address TEXT
    , notes TEXT
    , total_bookings INT DEFAULT 0
    , total_spent DECIMAL(10, 2) DEFAULT 0.00
    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE
      CURRENT_TIMESTAMP
  );

  -- Bookings table
  CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY
    , client_id INT
    , first_name VARCHAR(100) NOT NULL
    , last_name VARCHAR(100) NOT NULL
    , email VARCHAR(255) NOT NULL
    , phone VARCHAR(20)
    , event_date DATE NOT NULL
    , event_title VARCHAR(255)
    , guests INT
    , venue VARCHAR(255)
    , package VARCHAR(50)
    , package_price DECIMAL(10, 2)
    , special_requests TEXT
    , images TEXT
    , status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending'
    , deleted_at TIMESTAMP NULL DEFAULT NULL
    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE
      CURRENT_TIMESTAMP
      , FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE SET NULL
  );

  -- Reports table for analytics and reporting
  CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY
    , report_type VARCHAR(50) NOT NULL
    , report_period VARCHAR(50)
    , total_bookings INT DEFAULT 0
    , confirmed_bookings INT DEFAULT 0
    , cancelled_bookings INT DEFAULT 0
    , pending_bookings INT DEFAULT 0
    , total_revenue DECIMAL(10, 2) DEFAULT 0.00
    , average_guests DECIMAL(5, 2) DEFAULT 0.00
    , popular_package VARCHAR(50)
    , popular_venue VARCHAR(255)
    , report_data JSON
    , generated_by INT
    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    , FOREIGN KEY (generated_by) REFERENCES users(id)
  );

  -- Archive table for deleted bookings
  CREATE TABLE archived_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY
    , original_id INT NOT NULL
    , first_name VARCHAR(100) NOT NULL
    , last_name VARCHAR(100) NOT NULL
    , email VARCHAR(255) NOT NULL
    , phone VARCHAR(20)
    , event_date DATE NOT NULL
    , event_title VARCHAR(255)
    , guests INT
    , venue VARCHAR(255)
    , package VARCHAR(50)
    , package_price DECIMAL(10, 2)
    , special_requests TEXT
    , images TEXT
    , status VARCHAR(50)
    , deleted_reason VARCHAR(255)
    , deleted_by INT NULL
    , original_created_at TIMESTAMP NULL
    , original_updated_at TIMESTAMP NULL
    , deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Archive table for deleted clients
  CREATE TABLE archived_clients (
    id INT AUTO_INCREMENT PRIMARY KEY
    , original_id INT NOT NULL
    , first_name VARCHAR(100) NOT NULL
    , last_name VARCHAR(100) NOT NULL
    , email VARCHAR(255) NOT NULL
    , phone VARCHAR(20)
    , address TEXT
    , notes TEXT
    , total_bookings INT
    , total_spent DECIMAL(10, 2)
    , deleted_reason VARCHAR(255)
    , deleted_by INT NULL
    , original_created_at TIMESTAMP NULL
    , original_updated_at TIMESTAMP NULL
    , deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Archive table for deleted payments
  CREATE TABLE archived_payments (
    id INT AUTO_INCREMENT PRIMARY KEY
    , original_id INT NOT NULL
    , booking_id INT
    , amount DECIMAL(10, 2)
    , payment_status VARCHAR(50)
    , payment_method VARCHAR(50)
    , payment_date DATE
    , transaction_reference VARCHAR(100)
    , notes TEXT
    , deleted_reason VARCHAR(255)
    , deleted_by INT NULL
    , original_created_at TIMESTAMP NULL
    , original_updated_at TIMESTAMP NULL
    , deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Archive table for deleted expenses
  CREATE TABLE archived_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY
    , original_id INT NOT NULL
    , category VARCHAR(100)
    , description TEXT
    , amount DECIMAL(10, 2)
    , expense_date DATE
    , payment_method VARCHAR(50)
    , receipt_image VARCHAR(255)
    , notes TEXT
    , created_by INT
    , deleted_reason VARCHAR(255)
    , deleted_by INT NULL
    , original_created_at TIMESTAMP NULL
    , original_updated_at TIMESTAMP NULL
    , deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Archive table for deleted messages
  CREATE TABLE archived_messages (
    id INT AUTO_INCREMENT PRIMARY KEY
    , original_id INT NOT NULL
    , name VARCHAR(255)
    , email VARCHAR(255)
    , phone VARCHAR(20)
    , subject VARCHAR(255)
    , message TEXT
    , rating INT
    , status VARCHAR(50)
    , replied_at TIMESTAMP NULL
    , replied_by INT
    , deleted_reason VARCHAR(255)
    , deleted_by INT NULL
    , original_created_at TIMESTAMP NULL
    , original_updated_at TIMESTAMP NULL
    , deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Audit logs table for tracking all system activities
  CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY
    , user_id INT
    , user_name VARCHAR(100)
    , activity VARCHAR(100) NOT NULL
    , details TEXT
    , ip_address VARCHAR(45)
    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Archive table for deleted users
  CREATE TABLE archived_users (
    id INT AUTO_INCREMENT PRIMARY KEY
    , original_id INT NOT NULL
    , email VARCHAR(255) NOT NULL
    , full_name VARCHAR(255)
    , phone VARCHAR(20)
    , role VARCHAR(50)
    , profile_image VARCHAR(255)
    , business_name VARCHAR(255)
    , business_address TEXT
    , business_phone VARCHAR(20)
    , business_email VARCHAR(255)
    , deleted_reason VARCHAR(255)
    , deleted_by INT NULL
    , original_created_at TIMESTAMP NULL
    , original_updated_at TIMESTAMP NULL
    , deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Payments table for financial tracking
  CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY
    , booking_id INT NOT NULL
    , amount DECIMAL(10, 2) NOT NULL
    , payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending'
    , payment_method VARCHAR(50)
    , payment_date DATE
    , transaction_reference VARCHAR(100)
    , notes TEXT
    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE
      CURRENT_TIMESTAMP
      , FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE
  );

  -- Expenses table for financial management
  CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY
    , category VARCHAR(100) NOT NULL
    , description TEXT NOT NULL
    , amount DECIMAL(10, 2) NOT NULL
    , expense_date DATE NOT NULL
    , payment_method VARCHAR(50)
    , receipt_image VARCHAR(255)
    , notes TEXT
    , created_by INT
    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE
      CURRENT_TIMESTAMP
      , FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
  );

  -- Messages table for customer feedback
  CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY
    , name VARCHAR(255) NOT NULL
    , email VARCHAR(255) NOT NULL
    , phone VARCHAR(20)
    , subject VARCHAR(255)
    , message TEXT NOT NULL
    , rating INT
    , status ENUM('unread', 'read', 'replied', 'archived') DEFAULT 'unread'
    , replied_at TIMESTAMP NULL
    , replied_by INT
    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE
      CURRENT_TIMESTAMP
      , FOREIGN KEY (replied_by) REFERENCES users(id)
    ON DELETE SET NULL
  );

  -- Settings table for application configuration
  CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY
    , setting_key VARCHAR(100) UNIQUE NOT NULL
    , setting_value TEXT
    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE
      CURRENT_TIMESTAMP
  );

  -- Insert sample admin user (password: admin123)
  INSERT INTO
    users (email, password_hash)
  VALUES
    (
      'admin@babybliss.com'
      , '$2y$10$bUG7/yGJAJJcS006qPjnKOKU4r.YFLrJnSnPxFJJ1FQP8YOktb0rm'
    );

  -- Insert sample clients
  INSERT INTO
    clients (
      first_name
      , last_name
      , email
      , phone
      , total_bookings
      , total_spent
    )
  VALUES
    (
      'Sarah'
      , 'Johnson'
      , 'sarah@example.com'
      , '(555) 123-4567'
      , 1
      , 25000.00
    )
    , (
      'Emily'
      , 'Davis'
      , 'emily@example.com'
      , '(555) 234-5678'
      , 1
      , 0.00
    )
    , (
      'Michelle'
      , 'Brown'
      , 'michelle@example.com'
      , '(555) 345-6789'
      , 1
      , 40000.00
    )
    , (
      'Jessica'
      , 'Wilson'
      , 'jessica@example.com'
      , '(555) 456-7890'
      , 1
      , 0.00
    )
    , (
      'Amanda'
      , 'Garcia'
      , 'amanda@example.com'
      , '(555) 567-8901'
      , 1
      , 15000.00
    );

  -- Insert sample bookings
  INSERT INTO
    bookings (
      client_id
      , first_name
      , last_name
      , email
      , phone
      , event_date
      , event_title
      , guests
      , venue
      , package
      , package_price
      , special_requests
      , status
    )
  VALUES
    (
      1
      , 'Sarah'
      , 'Johnson'
      , 'sarah@example.com'
      , '(555) 123-4567'
      , '2024-03-15'
      , 'Baby Shower Celebration'
      , 50
      , 'Garden Terrace'
      , 'premium'
      , 25000.00
      , 'Pink and gold theme with balloons'
      , 'confirmed'
    )
    , (
      2
      , 'Emily'
      , 'Davis'
      , 'emily@example.com'
      , '(555) 234-5678'
      , '2024-03-22'
      , 'First Birthday Party'
      , 40
      , 'Rose Hall'
      , 'basic'
      , 15000.00
      , 'Blue decorations preferred'
      , 'pending'
    )
    , (
      3
      , 'Michelle'
      , 'Brown'
      , 'michelle@example.com'
      , '(555) 345-6789'
      , '2024-04-05'
      , 'Gender Reveal Party'
      , 60
      , 'Sunset Pavilion'
      , 'deluxe'
      , 40000.00
      , 'Garden party theme'
      , 'confirmed'
    )
    , (
      4
      , 'Jessica'
      , 'Wilson'
      , 'jessica@example.com'
      , '(555) 456-7890'
      , '2024-04-12'
      , 'Baby Naming Ceremony'
      , 45
      , 'Garden Terrace'
      , 'premium'
      , 25000.00
      , 'Vintage style decorations'
      , 'pending'
    )
    , (
      5
      , 'Amanda'
      , 'Garcia'
      , 'amanda@example.com'
      , '(555) 567-8901'
      , '2024-04-20'
      , 'Baby Welcome Party'
      , 55
      , 'Rose Hall'
      , 'basic'
      , 15000.00
      , 'Modern minimalist theme'
      , 'confirmed'
    );