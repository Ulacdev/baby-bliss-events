-- Baby Bliss Events Management Database Schema
-- Run this script to set up the database for both PHP and Node.js backends

CREATE DATABASE
IF
  NOT EXISTS baby_bliss;
  USE baby_bliss;

  -- Users table (staff/admin users)
  CREATE TABLE
  IF
    NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT
      , username VARCHAR(50) UNIQUE NOT NULL
      , email VARCHAR(100) UNIQUE NOT NULL
      , password VARCHAR(255) NOT NULL
      , first_name VARCHAR(50)
      , last_name VARCHAR(50)
      , phone VARCHAR(20)
      , role ENUM('admin', 'staff') DEFAULT 'staff'
      , profile_image VARCHAR(255)
      , status ENUM('active', 'inactive') DEFAULT 'active'
      , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ON
      UPDATE
        CURRENT_TIMESTAMP
    );

    -- Clients table
    CREATE TABLE
    IF
      NOT EXISTS clients (
        id INT PRIMARY KEY AUTO_INCREMENT
        , email VARCHAR(100) UNIQUE NOT NULL
        , first_name VARCHAR(50)
        , last_name VARCHAR(50)
        , phone VARCHAR(20)
        , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON
        UPDATE
          CURRENT_TIMESTAMP
      );

      -- Bookings table
      CREATE TABLE
      IF
        NOT EXISTS bookings (
          id INT PRIMARY KEY AUTO_INCREMENT
          , client_id INT
          , first_name VARCHAR(50) NOT NULL
          , last_name VARCHAR(50) NOT NULL
          , email VARCHAR(100) NOT NULL
          , phone VARCHAR(20)
          , event_date DATE NOT NULL
          , guests INT
          , venue VARCHAR(255)
          , package VARCHAR(100)
          , special_requests TEXT
          , images TEXT
          , status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending'
          , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON
          UPDATE
            CURRENT_TIMESTAMP
            , FOREIGN KEY (client_id) REFERENCES clients(id)
          ON DELETE SET NULL
        );

        -- Messages/Contact forms table
        CREATE TABLE
        IF
          NOT EXISTS messages (
            id INT PRIMARY KEY AUTO_INCREMENT
            , name VARCHAR(100) NOT NULL
            , email VARCHAR(100) NOT NULL
            , phone VARCHAR(20)
            , subject VARCHAR(255)
            , message TEXT NOT NULL
            , rating INT CHECK (
              rating >= 1
              AND rating <= 5
            )
            , status ENUM('unread', 'read', 'replied') DEFAULT 'unread'
            , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ON
            UPDATE
              CURRENT_TIMESTAMP
          );

          -- Payments table
          CREATE TABLE
          IF
            NOT EXISTS payments (
              id INT PRIMARY KEY AUTO_INCREMENT
              , booking_id INT
              , amount DECIMAL(10, 2) NOT NULL
              , payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending'
              , payment_method VARCHAR(50)
              , payment_date DATE
              , notes TEXT
              , deleted_reason TEXT
              , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              ON
              UPDATE
                CURRENT_TIMESTAMP
                , FOREIGN KEY (booking_id) REFERENCES bookings(id)
              ON DELETE SET NULL
            );

            -- Expenses table
            CREATE TABLE
            IF
              NOT EXISTS expenses (
                id INT PRIMARY KEY AUTO_INCREMENT
                , category VARCHAR(100) NOT NULL
                , description TEXT
                , amount DECIMAL(10, 2) NOT NULL
                , expense_date DATE NOT NULL
                , payment_method VARCHAR(50)
                , notes TEXT
                , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              );

              -- Audit log table
              CREATE TABLE
              IF
                NOT EXISTS audit_logs (
                  id INT PRIMARY KEY AUTO_INCREMENT
                  , user_id INT
                  , activity VARCHAR(255) NOT NULL
                  , details TEXT
                  , ip_address VARCHAR(45)
                  , user_agent TEXT
                  , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , FOREIGN KEY (user_id) REFERENCES users(id)
                  ON DELETE SET NULL
                );

                -- Settings table
                CREATE TABLE
                IF
                  NOT EXISTS settings (
                    id INT PRIMARY KEY AUTO_INCREMENT
                    , setting_key VARCHAR(100) UNIQUE NOT NULL
                    , setting_value TEXT
                    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON
                    UPDATE
                      CURRENT_TIMESTAMP
                  );

                  -- Archive tables for soft deletes
                  CREATE TABLE
                  IF
                    NOT EXISTS archived_bookings (
                      id INT PRIMARY KEY AUTO_INCREMENT
                      , original_id INT NOT NULL
                      , data JSON NOT NULL
                      , archived_by INT
                      , archived_reason TEXT
                      , archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                      , FOREIGN KEY (archived_by) REFERENCES users(id)
                      ON DELETE SET NULL
                    );

                    -- Insert default admin user (password: admin123)
                    INSERT IGNORE
                    INTO
                      users (
                        username
                        , email
                        , password
                        , first_name
                        , last_name
                        , role
                      )
                    VALUES
                      (
                        'admin'
                        , 'admin@babybliss.com'
                        , '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
                        , 'Admin'
                        , 'User'
                        , 'admin'
                      );

                    -- Insert default settings
                    INSERT IGNORE
                    INTO
                      settings (setting_key, setting_value)
                    VALUES
                      ('general_site_title', 'Baby Bliss')
                      , (
                        'general_logo_url'
                        , '/Baby_Cloud_To_Bliss_Text_Change.png'
                      )
                      , ('general_favicon_url', '')
                      , ('general_logo_size', '32')
                      , ('general_company_name', 'Baby Bliss Events')
                      , ('general_company_email', 'info@babybliss.com')
                      , ('general_company_phone', '(555) 123-4567')
                      , ('navbar_nav_home_text', 'Home')
                      , ('navbar_nav_about_text', 'About')
                      , ('navbar_nav_gallery_text', 'Events')
                      , ('navbar_nav_book_text', 'Book Now')
                      , ('navbar_nav_contact_text', 'Contact')
                      , ('navbar_nav_login_text', 'Login')
                      , (
                        'footer_footer_text'
                        , '© 2024 Baby Bliss Events. All rights reserved.'
                      )
                      , (
                        'footer_footer_address'
                        , '123 Main Street, City, State 12345'
                      );

                    -- Create indexes for better performance
                    CREATE INDEX idx_bookings_status
                    ON bookings(status);
                    CREATE INDEX idx_bookings_event_date
                    ON bookings(event_date);
                    CREATE INDEX idx_bookings_email
                    ON bookings(email);
                    CREATE INDEX idx_payments_booking_id
                    ON payments(booking_id);
                    CREATE INDEX idx_messages_status
                    ON messages(status);
                    CREATE INDEX idx_audit_logs_activity
                    ON audit_logs(activity);
                    CREATE INDEX idx_audit_logs_created_at
                    ON audit_logs(created_at);

                    -- Insert sample data for testing
                    INSERT IGNORE
                    INTO
                      clients (email, first_name, last_name, phone)
                    VALUES
                      (
                        'john.doe@example.com'
                        , 'John'
                        , 'Doe'
                        , '(555) 123-4567'
                      )
                      , (
                        'jane.smith@example.com'
                        , 'Jane'
                        , 'Smith'
                        , '(555) 987-6543'
                      );

                    INSERT IGNORE
                    INTO
                      bookings (
                        client_id
                        , first_name
                        , last_name
                        , email
                        , phone
                        , event_date
                        , guests
                        , venue
                        , package
                        , status
                      )
                    VALUES
                      (
                        1
                        , 'John'
                        , 'Doe'
                        , 'john.doe@example.com'
                        , '(555) 123-4567'
                        , '2024-12-25'
                        , 50
                        , 'Grand Ballroom'
                        , 'Premium Package'
                        , 'confirmed'
                      )
                      , (
                        2
                        , 'Jane'
                        , 'Smith'
                        , 'jane.smith@example.com'
                        , '(555) 987-6543'
                        , '2024-12-31'
                        , 30
                        , 'Garden Terrace'
                        , 'Standard Package'
                        , 'pending'
                      );

                    INSERT IGNORE
                    INTO
                      messages (name, email, phone, subject, message, rating)
                    VALUES
                      (
                        'Alice Johnson'
                        , 'alice@example.com'
                        , '(555) 111-2222'
                        , 'Wedding Inquiry'
                        , 'I would like to inquire about your wedding packages.'
                        , 5
                      )
                      , (
                        'Bob Wilson'
                        , 'bob@example.com'
                        , '(555) 333-4444'
                        , 'Birthday Party'
                        , 'Planning a birthday party for my daughter.'
                        , 4
                      );