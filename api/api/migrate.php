<?php
require_once 'config.php';

// Migration script to add new database features
echo "Starting database migration...\n";

$conn = getDBConnection();

// Check if package column exists, if not add it
$result = $conn->query("SHOW COLUMNS FROM bookings LIKE 'package'");
if ($result->num_rows == 0) {
    echo "Adding package column to bookings table...\n";
    $conn->query("ALTER TABLE bookings ADD COLUMN package VARCHAR(50) AFTER venue");
    echo "✅ Package column added\n";
} else {
    echo "✅ Package column already exists\n";
}

// Check if profiles table exists, if not create it and migrate data
$result = $conn->query("SHOW TABLES LIKE 'profiles'");
if ($result->num_rows == 0) {
    echo "Creating profiles table and migrating data...\n";

    // Create profiles table
    $conn->query("CREATE TABLE profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        full_name VARCHAR(255),
        phone VARCHAR(20),
        bio TEXT,
        profile_image VARCHAR(255),
        business_name VARCHAR(255),
        business_address TEXT,
        business_phone VARCHAR(20),
        business_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    // Migrate existing profile data from users to profiles
    $result = $conn->query("SELECT id, first_name, last_name, full_name, phone, bio, profile_image, business_name, business_address, business_phone, business_email FROM users");
    while ($user = $result->fetch_assoc()) {
        $stmt = $conn->prepare("INSERT INTO profiles (user_id, first_name, last_name, full_name, phone, bio, profile_image, business_name, business_address, business_phone, business_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param(
            "issssssssss",
            $user['id'],
            $user['first_name'],
            $user['last_name'],
            $user['full_name'],
            $user['phone'],
            $user['bio'],
            $user['profile_image'],
            $user['business_name'],
            $user['business_address'],
            $user['business_phone'],
            $user['business_email']
        );
        $stmt->execute();
    }

    // Remove profile columns from users table
    $conn->query("ALTER TABLE users DROP COLUMN first_name");
    $conn->query("ALTER TABLE users DROP COLUMN last_name");
    $conn->query("ALTER TABLE users DROP COLUMN full_name");
    $conn->query("ALTER TABLE users DROP COLUMN phone");
    $conn->query("ALTER TABLE users DROP COLUMN bio");
    $conn->query("ALTER TABLE users DROP COLUMN profile_image");
    $conn->query("ALTER TABLE users DROP COLUMN business_name");
    $conn->query("ALTER TABLE users DROP COLUMN business_address");
    $conn->query("ALTER TABLE users DROP COLUMN business_phone");
    $conn->query("ALTER TABLE users DROP COLUMN business_email");

    echo "✅ Profiles table created and data migrated\n";
} else {
    echo "✅ Profiles table already exists\n";
}

// Check if session_token column exists in users table, if not add it
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'session_token'");
if ($result->num_rows == 0) {
    echo "Adding session_token and session_expires columns to users table...\n";
    $conn->query("ALTER TABLE users ADD COLUMN session_token VARCHAR(255) AFTER role");
    $conn->query("ALTER TABLE users ADD COLUMN session_expires DATETIME AFTER session_token");
    echo "✅ Session columns added to users table\n";
} else {
    echo "✅ Session columns already exist in users table\n";
}

// Check if reports table exists, if not create it
$result = $conn->query("SHOW TABLES LIKE 'reports'");
if ($result->num_rows == 0) {
    echo "Creating reports table...\n";
    $conn->query("CREATE TABLE reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_type VARCHAR(50) NOT NULL,
        report_period VARCHAR(50),
        total_bookings INT DEFAULT 0,
        confirmed_bookings INT DEFAULT 0,
        cancelled_bookings INT DEFAULT 0,
        pending_bookings INT DEFAULT 0,
        total_revenue DECIMAL(10,2) DEFAULT 0.00,
        average_guests DECIMAL(5,2) DEFAULT 0.00,
        popular_package VARCHAR(50),
        popular_venue VARCHAR(255),
        report_data JSON,
        generated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (generated_by) REFERENCES users(id)
    )");
    echo "✅ Reports table created\n";
} else {
    echo "✅ Reports table already exists\n";
}

// Check if archived_bookings table exists, if not create it or recreate if wrong schema
$result = $conn->query("SHOW TABLES LIKE 'archived_bookings'");
if ($result->num_rows == 0) {
    echo "Creating archived_bookings table...\n";
    $conn->query("CREATE TABLE archived_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_id INT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        event_date DATE NOT NULL,
        guests INT,
        venue VARCHAR(255),
        package VARCHAR(50),
        special_requests TEXT,
        images TEXT,
        status VARCHAR(50),
        deleted_reason VARCHAR(255),
        deleted_by INT NULL,
        original_created_at TIMESTAMP NULL,
        original_updated_at TIMESTAMP NULL,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "✅ Archived bookings table created\n";
} else {
    // Check if it has the correct columns
    $columnsResult = $conn->query("SHOW COLUMNS FROM archived_bookings LIKE 'deleted_reason'");
    if ($columnsResult->num_rows == 0) {
        echo "Recreating archived_bookings table with correct schema...\n";
        $conn->query("DROP TABLE archived_bookings");
        $conn->query("CREATE TABLE archived_bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            original_id INT NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            event_date DATE NOT NULL,
            guests INT,
            venue VARCHAR(255),
            package VARCHAR(50),
            special_requests TEXT,
            images TEXT,
            status VARCHAR(50),
            deleted_reason VARCHAR(255),
            deleted_by INT NULL,
            original_created_at TIMESTAMP NULL,
            original_updated_at TIMESTAMP NULL,
            deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        echo "✅ Archived bookings table recreated\n";
    } else {
        echo "✅ Archived bookings table already exists with correct schema\n";
    }
}

echo "Migration completed successfully! 🎉\n";
?>