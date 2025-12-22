-- Baby Bliss Events Management Database Schema (PostgreSQL)
-- Run this script to set up the database for Node.js backend with Vercel

-- Create database (run this manually in Supabase SQL editor)
-- CREATE DATABASE baby_bliss;

-- Users table (staff/admin users)
CREATE TABLE
IF
  NOT EXISTS users (
    id SERIAL PRIMARY KEY
    , username VARCHAR(50) UNIQUE NOT NULL
    , email VARCHAR(100) UNIQUE NOT NULL
    , password VARCHAR(255) NOT NULL
    , first_name VARCHAR(50)
    , last_name VARCHAR(50)
    , phone VARCHAR(20)
    , role VARCHAR(10) DEFAULT 'staff' CHECK (role IN ('admin', 'staff'))
    , profile_image VARCHAR(255)
    , status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Clients table
  CREATE TABLE
  IF
    NOT EXISTS clients (
      id SERIAL PRIMARY KEY
      , email VARCHAR(100) UNIQUE NOT NULL
      , first_name VARCHAR(50)
      , last_name VARCHAR(50)
      , phone VARCHAR(20)
      , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Bookings table
    CREATE TABLE
    IF
      NOT EXISTS bookings (
        id SERIAL PRIMARY KEY
        , client_id INTEGER REFERENCES clients(id)
        ON DELETE SET NULL
        , first_name VARCHAR(50) NOT NULL
        , last_name VARCHAR(50) NOT NULL
        , email VARCHAR(100) NOT NULL
        , phone VARCHAR(20)
        , event_date DATE NOT NULL
        , guests INTEGER
        , venue VARCHAR(255)
        , package VARCHAR(100)
        , special_requests TEXT
        , images TEXT
        , status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled'))
        , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Messages/Contact forms table
      CREATE TABLE
      IF
        NOT EXISTS messages (
          id SERIAL PRIMARY KEY
          , name VARCHAR(100) NOT NULL
          , email VARCHAR(100) NOT NULL
          , phone VARCHAR(20)
          , subject VARCHAR(255)
          , message TEXT NOT NULL
          , rating INTEGER CHECK (
            rating >= 1
            AND rating <= 5
          )
          , status VARCHAR(10) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied'))
          , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Payments table
        CREATE TABLE
        IF
          NOT EXISTS payments (
            id SERIAL PRIMARY KEY
            , booking_id INTEGER REFERENCES bookings(id)
            ON DELETE SET NULL
            , amount DECIMAL(10, 2) NOT NULL
            , payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded'))
            , payment_method VARCHAR(50)
            , payment_date DATE
            , notes TEXT
            , deleted_reason TEXT
            , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Expenses table
          CREATE TABLE
          IF
            NOT EXISTS expenses (
              id SERIAL PRIMARY KEY
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
                id SERIAL PRIMARY KEY
                , user_id INTEGER REFERENCES users(id)
                ON DELETE SET NULL
                , activity VARCHAR(255) NOT NULL
                , details TEXT
                , ip_address VARCHAR(45)
                , user_agent TEXT
                , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              );

              -- Settings table
              CREATE TABLE
              IF
                NOT EXISTS settings (
                  id SERIAL PRIMARY KEY
                  , setting_key VARCHAR(100) UNIQUE NOT NULL
                  , setting_value TEXT
                  , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Archive tables for soft deletes
                CREATE TABLE
                IF
                  NOT EXISTS archived_bookings (
                    id SERIAL PRIMARY KEY
                    , original_id INTEGER NOT NULL
                    , data JSONB NOT NULL
                    , archived_by INTEGER REFERENCES users(id)
                    ON DELETE SET NULL
                    , archived_reason TEXT
                    , archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  );

                  -- Insert default admin user (password: admin123)
                  -- Note: This password hash is for bcrypt, generate a new one for production
                  INSERT INTO
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
                    )
                  ON CONFLICT (email)
                DO
                  NOTHING;

                  -- Insert default settings
                  INSERT INTO
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
                    )
                  ON CONFLICT (setting_key)
                DO
                  NOTHING;

                  -- Create indexes for better performance
                  CREATE INDEX
                  IF
                    NOT EXISTS idx_bookings_status
                    ON bookings(status);
                    CREATE INDEX
                    IF
                      NOT EXISTS idx_bookings_event_date
                      ON bookings(event_date);
                      CREATE INDEX
                      IF
                        NOT EXISTS idx_bookings_email
                        ON bookings(email);
                        CREATE INDEX
                        IF
                          NOT EXISTS idx_payments_booking_id
                          ON payments(booking_id);
                          CREATE INDEX
                          IF
                            NOT EXISTS idx_messages_status
                            ON messages(status);
                            CREATE INDEX
                            IF
                              NOT EXISTS idx_audit_logs_activity
                              ON audit_logs(activity);
                              CREATE INDEX
                              IF
                                NOT EXISTS idx_audit_logs_created_at
                                ON audit_logs(created_at);

                                -- Insert sample data for testing
                                INSERT INTO
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
                                  )
                                ON CONFLICT (email)
                              DO
                                NOTHING;

                                INSERT INTO
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
                                  )
                                ON CONFLICT
                              DO
                                NOTHING;

                                INSERT INTO
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
                                  )
                                ON CONFLICT
                              DO
                                NOTHING;