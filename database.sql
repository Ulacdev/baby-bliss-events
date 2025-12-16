-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.4.32-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.6.0.6765
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;
/*!40101 SET NAMES utf8 */
;
/*!50503 SET NAMES utf8mb4 */
;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */
;
/*!40103 SET TIME_ZONE='+00:00' */
;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */
;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */
;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */
;


-- Dumping database structure for baby_bliss
CREATE DATABASE
IF
  NOT EXISTS `baby_bliss` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */
;
  USE `baby_bliss`;

  -- Dumping structure for table baby_bliss.archived_bookings
  CREATE TABLE
  IF
    NOT EXISTS `archived_bookings` (
      `id` int(11) NOT NULL AUTO_INCREMENT
      , `original_id` int(11) NOT NULL
      , `first_name` varchar(100) NOT NULL
      , `last_name` varchar(100) NOT NULL
      , `email` varchar(255) NOT NULL
      , `phone` varchar(20) DEFAULT NULL
      , `event_date` date NOT NULL
      , `event_title` varchar(255) DEFAULT NULL
      , `guests` int(11) DEFAULT NULL
      , `venue` varchar(255) DEFAULT NULL
      , `package` varchar(50) DEFAULT NULL
      , `package_price` decimal(10, 2) DEFAULT NULL
      , `special_requests` text DEFAULT NULL
      , `images` text DEFAULT NULL
      , `status` varchar(50) DEFAULT NULL
      , `deleted_reason` varchar(255) DEFAULT NULL
      , `deleted_by` int(11) DEFAULT NULL
      , `original_created_at` timestamp NULL DEFAULT NULL
      , `original_updated_at` timestamp NULL DEFAULT NULL
      , `deleted_at` timestamp NOT NULL DEFAULT current_timestamp()
      , PRIMARY KEY (`id`)
    ) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

    -- Data exporting was unselected.

    -- Dumping structure for table baby_bliss.archived_clients
    CREATE TABLE
    IF
      NOT EXISTS `archived_clients` (
        `id` int(11) NOT NULL AUTO_INCREMENT
        , `original_id` int(11) NOT NULL
        , `first_name` varchar(100) NOT NULL
        , `last_name` varchar(100) NOT NULL
        , `email` varchar(255) NOT NULL
        , `phone` varchar(20) DEFAULT NULL
        , `address` text DEFAULT NULL
        , `notes` text DEFAULT NULL
        , `total_bookings` int(11) DEFAULT NULL
        , `total_spent` decimal(10, 2) DEFAULT NULL
        , `deleted_reason` varchar(255) DEFAULT NULL
        , `deleted_by` int(11) DEFAULT NULL
        , `original_created_at` timestamp NULL DEFAULT NULL
        , `original_updated_at` timestamp NULL DEFAULT NULL
        , `deleted_at` timestamp NOT NULL DEFAULT current_timestamp()
        , PRIMARY KEY (`id`)
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

      -- Data exporting was unselected.

      -- Dumping structure for table baby_bliss.archived_expenses
      CREATE TABLE
      IF
        NOT EXISTS `archived_expenses` (
          `id` int(11) NOT NULL AUTO_INCREMENT
          , `original_id` int(11) NOT NULL
          , `category` varchar(100) DEFAULT NULL
          , `description` text DEFAULT NULL
          , `amount` decimal(10, 2) DEFAULT NULL
          , `expense_date` date DEFAULT NULL
          , `payment_method` varchar(50) DEFAULT NULL
          , `receipt_image` varchar(255) DEFAULT NULL
          , `notes` text DEFAULT NULL
          , `created_by` int(11) DEFAULT NULL
          , `deleted_reason` varchar(255) DEFAULT NULL
          , `deleted_by` int(11) DEFAULT NULL
          , `original_created_at` timestamp NULL DEFAULT NULL
          , `original_updated_at` timestamp NULL DEFAULT NULL
          , `deleted_at` timestamp NOT NULL DEFAULT current_timestamp()
          , PRIMARY KEY (`id`)
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

        -- Data exporting was unselected.

        -- Dumping structure for table baby_bliss.archived_messages
        CREATE TABLE
        IF
          NOT EXISTS `archived_messages` (
            `id` int(11) NOT NULL AUTO_INCREMENT
            , `original_id` int(11) NOT NULL
            , `name` varchar(255) DEFAULT NULL
            , `email` varchar(255) DEFAULT NULL
            , `phone` varchar(20) DEFAULT NULL
            , `subject` varchar(255) DEFAULT NULL
            , `message` text DEFAULT NULL
            , `rating` int(11) DEFAULT NULL
            , `status` varchar(50) DEFAULT NULL
            , `replied_at` timestamp NULL DEFAULT NULL
            , `replied_by` int(11) DEFAULT NULL
            , `deleted_reason` varchar(255) DEFAULT NULL
            , `deleted_by` int(11) DEFAULT NULL
            , `original_created_at` timestamp NULL DEFAULT NULL
            , `original_updated_at` timestamp NULL DEFAULT NULL
            , `deleted_at` timestamp NOT NULL DEFAULT current_timestamp()
            , PRIMARY KEY (`id`)
          ) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

          -- Data exporting was unselected.

          -- Dumping structure for table baby_bliss.archived_payments
          CREATE TABLE
          IF
            NOT EXISTS `archived_payments` (
              `id` int(11) NOT NULL AUTO_INCREMENT
              , `original_id` int(11) NOT NULL
              , `booking_id` int(11) DEFAULT NULL
              , `amount` decimal(10, 2) DEFAULT NULL
              , `payment_status` varchar(50) DEFAULT NULL
              , `payment_method` varchar(50) DEFAULT NULL
              , `payment_date` date DEFAULT NULL
              , `transaction_reference` varchar(100) DEFAULT NULL
              , `notes` text DEFAULT NULL
              , `deleted_reason` varchar(255) DEFAULT NULL
              , `deleted_by` int(11) DEFAULT NULL
              , `original_created_at` timestamp NULL DEFAULT NULL
              , `original_updated_at` timestamp NULL DEFAULT NULL
              , `deleted_at` timestamp NOT NULL DEFAULT current_timestamp()
              , PRIMARY KEY (`id`)
            ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

            -- Data exporting was unselected.

            -- Dumping structure for table baby_bliss.archived_users
            CREATE TABLE
            IF
              NOT EXISTS `archived_users` (
                `id` int(11) NOT NULL AUTO_INCREMENT
                , `original_id` int(11) NOT NULL
                , `email` varchar(255) NOT NULL
                , `full_name` varchar(255) DEFAULT NULL
                , `phone` varchar(20) DEFAULT NULL
                , `role` varchar(50) DEFAULT NULL
                , `profile_image` varchar(255) DEFAULT NULL
                , `business_name` varchar(255) DEFAULT NULL
                , `business_address` text DEFAULT NULL
                , `business_phone` varchar(20) DEFAULT NULL
                , `business_email` varchar(255) DEFAULT NULL
                , `deleted_reason` varchar(255) DEFAULT NULL
                , `deleted_by` int(11) DEFAULT NULL
                , `original_created_at` timestamp NULL DEFAULT NULL
                , `original_updated_at` timestamp NULL DEFAULT NULL
                , `deleted_at` timestamp NOT NULL DEFAULT current_timestamp()
                , PRIMARY KEY (`id`)
              ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

              -- Data exporting was unselected.

              -- Dumping structure for table baby_bliss.audit_logs
              CREATE TABLE
              IF
                NOT EXISTS `audit_logs` (
                  `id` int(11) NOT NULL AUTO_INCREMENT
                  , `user_id` int(11) DEFAULT NULL
                  , `user_name` varchar(100) DEFAULT NULL
                  , `activity` varchar(100) NOT NULL
                  , `details` text DEFAULT NULL
                  , `ip_address` varchar(45) DEFAULT NULL
                  , `created_at` timestamp NOT NULL DEFAULT current_timestamp()
                  , PRIMARY KEY (`id`)
                ) ENGINE = InnoDB AUTO_INCREMENT = 301 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

                -- Data exporting was unselected.

                -- Dumping structure for table baby_bliss.bookings
                CREATE TABLE
                IF
                  NOT EXISTS `bookings` (
                    `id` int(11) NOT NULL AUTO_INCREMENT
                    , `client_id` int(11) DEFAULT NULL
                    , `first_name` varchar(100) NOT NULL
                    , `last_name` varchar(100) NOT NULL
                    , `email` varchar(255) NOT NULL
                    , `phone` varchar(20) DEFAULT NULL
                    , `event_date` date NOT NULL
                    , `event_title` varchar(255) DEFAULT NULL
                    , `guests` int(11) DEFAULT NULL
                    , `venue` varchar(255) DEFAULT NULL
                    , `package` varchar(50) DEFAULT NULL
                    , `package_price` decimal(10, 2) DEFAULT NULL
                    , `special_requests` text DEFAULT NULL
                    , `images` text DEFAULT NULL
                    , `status` enum('pending', 'confirmed', 'cancelled') DEFAULT 'pending'
                    , `deleted_at` timestamp NULL DEFAULT NULL
                    , `created_at` timestamp NOT NULL DEFAULT current_timestamp()
                    , `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
                    ON
                    UPDATE
                      current_timestamp()
                      , PRIMARY KEY (`id`)
                      , KEY `client_id` (`client_id`)
                      , CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
                    ON DELETE SET NULL
                  ) ENGINE = InnoDB AUTO_INCREMENT = 22 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

                  -- Data exporting was unselected.

                  -- Dumping structure for table baby_bliss.clients
                  CREATE TABLE
                  IF
                    NOT EXISTS `clients` (
                      `id` int(11) NOT NULL AUTO_INCREMENT
                      , `first_name` varchar(100) NOT NULL
                      , `last_name` varchar(100) NOT NULL
                      , `email` varchar(255) NOT NULL
                      , `phone` varchar(20) DEFAULT NULL
                      , `address` text DEFAULT NULL
                      , `notes` text DEFAULT NULL
                      , `total_bookings` int(11) DEFAULT 0
                      , `total_spent` decimal(10, 2) DEFAULT 0.00
                      , `created_at` timestamp NOT NULL DEFAULT current_timestamp()
                      , `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
                      ON
                      UPDATE
                        current_timestamp()
                        , PRIMARY KEY (`id`)
                        , UNIQUE KEY `email` (`email`)
                    ) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

                    -- Data exporting was unselected.

                    -- Dumping structure for table baby_bliss.expenses
                    CREATE TABLE
                    IF
                      NOT EXISTS `expenses` (
                        `id` int(11) NOT NULL AUTO_INCREMENT
                        , `category` varchar(100) NOT NULL
                        , `description` text NOT NULL
                        , `amount` decimal(10, 2) NOT NULL
                        , `expense_date` date NOT NULL
                        , `payment_method` varchar(50) DEFAULT NULL
                        , `receipt_image` varchar(255) DEFAULT NULL
                        , `notes` text DEFAULT NULL
                        , `created_by` int(11) DEFAULT NULL
                        , `created_at` timestamp NOT NULL DEFAULT current_timestamp()
                        , `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
                        ON
                        UPDATE
                          current_timestamp()
                          , PRIMARY KEY (`id`)
                          , KEY `created_by` (`created_by`)
                          , CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
                        ON DELETE SET NULL
                      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

                      -- Data exporting was unselected.

                      -- Dumping structure for table baby_bliss.messages
                      CREATE TABLE
                      IF
                        NOT EXISTS `messages` (
                          `id` int(11) NOT NULL AUTO_INCREMENT
                          , `name` varchar(255) NOT NULL
                          , `email` varchar(255) NOT NULL
                          , `phone` varchar(20) DEFAULT NULL
                          , `subject` varchar(255) DEFAULT NULL
                          , `message` text NOT NULL
                          , `rating` int(11) DEFAULT NULL
                          , `status` enum('unread', 'read', 'replied', 'archived') DEFAULT 'unread'
                          , `replied_at` timestamp NULL DEFAULT NULL
                          , `replied_by` int(11) DEFAULT NULL
                          , `created_at` timestamp NOT NULL DEFAULT current_timestamp()
                          , `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
                          ON
                          UPDATE
                            current_timestamp()
                            , PRIMARY KEY (`id`)
                            , KEY `replied_by` (`replied_by`)
                            , CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`replied_by`) REFERENCES `users` (`id`)
                          ON DELETE SET NULL
                        ) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

                        -- Data exporting was unselected.

                        -- Dumping structure for table baby_bliss.payments
                        CREATE TABLE
                        IF
                          NOT EXISTS `payments` (
                            `id` int(11) NOT NULL AUTO_INCREMENT
                            , `booking_id` int(11) NOT NULL
                            , `amount` decimal(10, 2) NOT NULL
                            , `payment_status` enum('pending', 'paid', 'refunded') DEFAULT 'pending'
                            , `payment_method` varchar(50) DEFAULT NULL
                            , `payment_date` date DEFAULT NULL
                            , `transaction_reference` varchar(100) DEFAULT NULL
                            , `notes` text DEFAULT NULL
                            , `created_at` timestamp NOT NULL DEFAULT current_timestamp()
                            , `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
                            ON
                            UPDATE
                              current_timestamp()
                              , PRIMARY KEY (`id`)
                              , KEY `booking_id` (`booking_id`)
                              , CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
                            ON DELETE CASCADE
                          ) ENGINE = InnoDB AUTO_INCREMENT = 17 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

                          -- Data exporting was unselected.

                          -- Dumping structure for table baby_bliss.profiles
                          CREATE TABLE
                          IF
                            NOT EXISTS `profiles` (
                              `id` int(11) NOT NULL AUTO_INCREMENT
                              , `user_id` int(11) NOT NULL
                              , `first_name` varchar(100) DEFAULT NULL
                              , `last_name` varchar(100) DEFAULT NULL
                              , `full_name` varchar(255) DEFAULT NULL
                              , `phone` varchar(20) DEFAULT NULL
                              , `bio` text DEFAULT NULL
                              , `profile_image` varchar(255) DEFAULT NULL
                              , `business_name` varchar(255) DEFAULT NULL
                              , `business_address` text DEFAULT NULL
                              , `business_phone` varchar(20) DEFAULT NULL
                              , `business_email` varchar(255) DEFAULT NULL
                              , `created_at` timestamp NOT NULL DEFAULT current_timestamp()
                              , `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
                              ON
                              UPDATE
                                current_timestamp()
                                , PRIMARY KEY (`id`)
                                , KEY `user_id` (`user_id`)
                                , CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
                              ON DELETE CASCADE
                            ) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

                            -- Data exporting was unselected.

                            -- Dumping structure for table baby_bliss.reports
                            CREATE TABLE
                            IF
                              NOT EXISTS `reports` (
                                `id` int(11) NOT NULL AUTO_INCREMENT
                                , `report_type` varchar(50) NOT NULL
                                , `report_period` varchar(50) DEFAULT NULL
                                , `total_bookings` int(11) DEFAULT 0
                                , `confirmed_bookings` int(11) DEFAULT 0
                                , `cancelled_bookings` int(11) DEFAULT 0
                                , `pending_bookings` int(11) DEFAULT 0
                                , `total_revenue` decimal(10, 2) DEFAULT 0.00
                                , `average_guests` decimal(5, 2) DEFAULT 0.00
                                , `popular_package` varchar(50) DEFAULT NULL
                                , `popular_venue` varchar(255) DEFAULT NULL
                                , `report_data` longtext CHARACTER
                                SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`report_data`))
                                , `generated_by` int(11) DEFAULT NULL
                                , `created_at` timestamp NOT NULL DEFAULT current_timestamp()
                                , PRIMARY KEY (`id`)
                                , KEY `generated_by` (`generated_by`)
                                , CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`)
                              ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

                              -- Data exporting was unselected.

                              -- Dumping structure for table baby_bliss.settings
                              CREATE TABLE
                              IF
                                NOT EXISTS `settings` (
                                  `id` int(11) NOT NULL AUTO_INCREMENT
                                  , `setting_key` varchar(100) NOT NULL
                                  , `setting_value` text DEFAULT NULL
                                  , `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
                                  ON
                                  UPDATE
                                    current_timestamp()
                                    , PRIMARY KEY (`id`)
                                    , UNIQUE KEY `setting_key` (`setting_key`)
                                ) ENGINE = InnoDB AUTO_INCREMENT = 2204 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

                                -- Data exporting was unselected.

                                -- Dumping structure for table baby_bliss.users
                                CREATE TABLE
                                IF
                                  NOT EXISTS `users` (
                                    `id` int(11) NOT NULL AUTO_INCREMENT
                                    , `email` varchar(255) NOT NULL
                                    , `password_hash` varchar(255) NOT NULL
                                    , `role` enum('admin', 'staff') DEFAULT 'admin'
                                    , `session_token` varchar(255) DEFAULT NULL
                                    , `session_expires` datetime DEFAULT NULL
                                    , `created_at` timestamp NOT NULL DEFAULT current_timestamp()
                                    , `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
                                    ON
                                    UPDATE
                                      current_timestamp()
                                      , PRIMARY KEY (`id`)
                                      , UNIQUE KEY `email` (`email`)
                                  ) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

                                  -- Data exporting was unselected.

                                  -- Dumping structure for table baby_bliss.password_reset_tokens
                                  CREATE TABLE
                                  IF
                                    NOT EXISTS `password_reset_tokens` (
                                      `id` int(11) NOT NULL AUTO_INCREMENT
                                      , `user_id` int(11) NOT NULL
                                      , `email` varchar(255) NOT NULL
                                      , `token` varchar(255) NOT NULL
                                      , `expires_at` timestamp NOT NULL
                                      , `used` tinyint(1) DEFAULT 0
                                      , `created_at` timestamp NOT NULL DEFAULT current_timestamp()
                                      , PRIMARY KEY (`id`)
                                      , UNIQUE KEY `token` (`token`)
                                      , KEY `user_id` (`user_id`)
                                      , KEY `email` (`email`)
                                      , CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
                                      ON DELETE CASCADE
                                    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

                                    -- Dumping structure for table baby_bliss.user_sessions
                                    CREATE TABLE
                                    IF
                                      NOT EXISTS `user_sessions` (
                                        `id` int(11) NOT NULL AUTO_INCREMENT
                                        , `user_id` int(11) NOT NULL
                                        , `email` varchar(255) NOT NULL
                                        , `token` varchar(255) NOT NULL
                                        , `expires_at` timestamp NOT NULL DEFAULT current_timestamp()
                                        ON
                                        UPDATE
                                          current_timestamp()
                                          , `created_at` timestamp NOT NULL DEFAULT current_timestamp()
                                          , PRIMARY KEY (`id`)
                                          , UNIQUE KEY `token` (`token`)
                                          , KEY `user_id` (`user_id`)
                                          , CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
                                        ON DELETE CASCADE
                                      ) ENGINE = InnoDB AUTO_INCREMENT = 14 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

                                      -- Data exporting was unselected.

                                      /*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */
;
                                      /*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */
;
                                      /*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */
;
                                      /*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
                                      /*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */
;