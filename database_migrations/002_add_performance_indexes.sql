-- Database Performance Indexes Migration
-- Run this script to add indexes for better query performance
-- Compatible with MySQL 5.7+ and 8.x

USE baby_bliss;

-- =====================================================
-- BOOKINGS TABLE INDEXES
-- =====================================================

-- Index for email lookups (used in login and duplicate checks)
CREATE INDEX
IF
  NOT EXISTS idx_bookings_email
  ON bookings(email);

  -- Index for status filtering (used in dashboard and list views)
  CREATE INDEX
  IF
    NOT EXISTS idx_bookings_status
    ON bookings(status);

    -- Index for event date filtering (used in calendar and upcoming events)
    CREATE INDEX
    IF
      NOT EXISTS idx_bookings_event_date
      ON bookings(event_date);

      -- Index for created_at filtering (used in monthly reports)
      CREATE INDEX
      IF
        NOT EXISTS idx_bookings_created_at
        ON bookings(created_at);

        -- Composite index for upcoming confirmed bookings
        CREATE INDEX
        IF
          NOT EXISTS idx_bookings_upcoming_confirmed
          ON bookings(event_date, status)
          WHERE
            status = 'confirmed';

          -- Composite index for search queries
          CREATE INDEX
          IF
            NOT EXISTS idx_bookings_search
            ON bookings(first_name, last_name, email);

            -- =====================================================
            -- CLIENTS TABLE INDEXES
            -- =====================================================

            -- Index for email lookups (used in duplicate checks and login)
            CREATE INDEX
            IF
              NOT EXISTS idx_clients_email
              ON clients(email);

              -- Index for name searches
              CREATE INDEX
              IF
                NOT EXISTS idx_clients_name
                ON clients(first_name, last_name);

                -- =====================================================
                -- USERS TABLE INDEXES
                -- =====================================================

                -- Index for email lookups (used in login)
                CREATE INDEX
                IF
                  NOT EXISTS idx_users_email
                  ON users(email);

                  -- Index for username lookups
                  CREATE INDEX
                  IF
                    NOT EXISTS idx_users_username
                    ON users(username);

                    -- =====================================================
                    -- MESSAGES TABLE INDEXES
                    -- =====================================================

                    -- Index for status filtering (used in admin message list)
                    CREATE INDEX
                    IF
                      NOT EXISTS idx_messages_status
                      ON messages(status);

                      -- Index for created_at sorting
                      CREATE INDEX
                      IF
                        NOT EXISTS idx_messages_created_at
                        ON messages(created_at);

                        -- =====================================================
                        -- PAYMENTS TABLE INDEXES
                        -- =====================================================

                        -- Index for booking_id lookups
                        CREATE INDEX
                        IF
                          NOT EXISTS idx_payments_booking_id
                          ON payments(booking_id);

                          -- =====================================================
                          -- SETTINGS TABLE INDEXES
                          -- =====================================================

                          -- Index for key lookups (already primary key typically)
                          -- No additional index needed as setting_key should be primary or unique

                          -- =====================================================
                          -- AUDIT LOGS TABLE INDEXES
                          -- =====================================================

                          -- Index for user_id filtering
                          CREATE INDEX
                          IF
                            NOT EXISTS idx_audit_logs_user_id
                            ON audit_logs(user_id);

                            -- Index for created_at filtering (used in date range queries)
                            CREATE INDEX
                            IF
                              NOT EXISTS idx_audit_logs_created_at
                              ON audit_logs(created_at);

                              -- Composite index for common audit log queries
                              CREATE INDEX
                              IF
                                NOT EXISTS idx_audit_logs_user_date
                                ON audit_logs(user_id, created_at);

                                -- =====================================================
                                -- OPTIONAL: FULLTEXT INDEXES FOR SEARCH
                                -- =====================================================

                                -- Fulltext index for better search performance (MySQL 5.6+)
                                -- Uncomment if you need full-text search capabilities
                                -- ALTER TABLE bookings ADD FULLTEXT ft_bookings_search (first_name, last_name, email, special_requests);
                                -- ALTER TABLE clients ADD FULLTEXT ft_clients_search (first_name, last_name, email, phone, address);

                                -- =====================================================
                                -- VERIFICATION QUERY
                                -- Run this to verify indexes were created:
                                -- =====================================================
                                -- SELECT DISTINCT
                                --   TABLE_NAME,
                                --   INDEX_NAME,
                                --   COLUMN_NAME,
                                --   NON_UNIQUE
                                -- FROM INFORMATION_SCHEMA.STATISTICS
                                -- WHERE TABLE_SCHEMA = 'baby_bliss'
                                -- ORDER BY TABLE_NAME, INDEX_NAME;