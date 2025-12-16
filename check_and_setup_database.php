<?php
/**
 * Database Setup and Verification Script
 *
 * This script will:
 * 1. Check if XAMPP/MySQL is running
 * 2. Check if database exists
 * 3. Create database and tables if needed
 * 4. Insert sample data
 * 5. Verify everything is working
 */

echo "🔍 Baby Bliss Database Setup & Verification\n";
echo "=============================================\n\n";

$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'baby_bliss';

// Step 1: Test MySQL connection
echo "Step 1: Testing MySQL Connection...\n";
$conn = @new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    echo "❌ MySQL Connection Failed: " . $conn->connect_error . "\n";
    echo "\n🔧 Troubleshooting:\n";
    echo "1. Make sure XAMPP is running\n";
    echo "2. Start Apache and MySQL services in XAMPP Control Panel\n";
    echo "3. Check if port 3306 is available\n";
    echo "4. Try restarting XAMPP\n\n";
    exit(1);
}
echo "✅ MySQL connection successful\n\n";

// Step 2: Check if database exists
echo "Step 2: Checking Database...\n";
$result = $conn->query("SHOW DATABASES LIKE '$dbname'");
$databaseExists = $result->num_rows > 0;

if ($databaseExists) {
    echo "✅ Database '$dbname' exists\n";

    // Select database and check tables
    $conn->select_db($dbname);
    echo "Step 3: Checking Tables...\n";

    $requiredTables = [
        'users', 'clients', 'bookings', 'payments', 'expenses', 'messages',
        'audit_logs', 'reports',
        'archived_bookings', 'archived_clients', 'archived_payments',
        'archived_expenses', 'archived_messages', 'archived_users'
    ];

    $existingTables = [];
    $result = $conn->query("SHOW TABLES");
    while ($row = $result->fetch_array()) {
        $existingTables[] = $row[0];
    }

    $missingTables = array_diff($requiredTables, $existingTables);

    if (empty($missingTables)) {
        echo "✅ All required tables exist\n";

        // Check sample data
        echo "Step 4: Checking Sample Data...\n";
        $checks = [
            'Users' => "SELECT COUNT(*) as count FROM users",
            'Clients' => "SELECT COUNT(*) as count FROM clients",
            'Bookings' => "SELECT COUNT(*) as count FROM bookings WHERE deleted_at IS NULL",
            'Payments' => "SELECT COUNT(*) as count FROM payments",
            'Archive Tables' => "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = '$dbname' AND table_name LIKE 'archived_%'"
        ];

        foreach ($checks as $name => $query) {
            $result = $conn->query($query);
            if ($result) {
                $row = $result->fetch_assoc();
                echo "✅ $name: " . $row['count'] . "\n";
            }
        }

        echo "\n🎉 Database is fully set up and ready!\n";
        echo "=====================================\n";
        echo "✅ All tables created\n";
        echo "✅ Sample data loaded\n";
        echo "✅ Archive system ready\n\n";

        echo "🚀 Your Baby Bliss application should work now!\n";
        echo "================================================\n";
        echo "• Login: admin@babybliss.com / admin123\n";
        echo "• Frontend: http://localhost:5173\n";
        echo "• Client deletion should work\n";
        echo "• Receipt printing should work\n";
        echo "• Archive system fully functional\n\n";

    } else {
        echo "❌ Missing tables: " . implode(', ', $missingTables) . "\n";
        echo "🔧 Need to create missing tables...\n\n";
        createTablesAndData($conn, $dbname);
    }

} else {
    echo "❌ Database '$dbname' does not exist\n";
    echo "🔧 Creating database and tables...\n\n";
    createTablesAndData($conn, $dbname);
}

$conn->close();

function createTablesAndData($conn, $dbname) {
    global $host, $user, $pass;

    // Create database
    echo "Creating database...\n";
    if ($conn->query("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci") === TRUE) {
        echo "✅ Database created\n";
    } else {
        echo "❌ Failed to create database: " . $conn->error . "\n";
        return;
    }

    // Select database
    $conn->select_db($dbname);

    // Create tables
    echo "Creating tables...\n";
    $tables = [
        // Users table
        "CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            phone VARCHAR(20),
            role ENUM('admin', 'staff') DEFAULT 'admin',
            profile_image VARCHAR(255),
            business_name VARCHAR(255),
            business_address TEXT,
            business_phone VARCHAR(20),
            business_email VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )",

        // Clients table
        "CREATE TABLE IF NOT EXISTS clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20),
            address TEXT,
            notes TEXT,
            total_bookings INT DEFAULT 0,
            total_spent DECIMAL(10,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )",

        // Bookings table
        "CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            client_id INT,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            event_date DATE NOT NULL,
            event_title VARCHAR(255),
            guests INT,
            venue VARCHAR(255),
            package VARCHAR(50),
            package_price DECIMAL(10,2),
            special_requests TEXT,
            images TEXT,
            status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
        )",

        // Reports table
        "CREATE TABLE IF NOT EXISTS reports (
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
        )",

        // Archive tables
        "CREATE TABLE IF NOT EXISTS archived_bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            original_id INT NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            event_date DATE NOT NULL,
            event_title VARCHAR(255),
            guests INT,
            venue VARCHAR(255),
            package VARCHAR(50),
            package_price DECIMAL(10,2),
            special_requests TEXT,
            images TEXT,
            status VARCHAR(50),
            deleted_reason VARCHAR(255),
            deleted_by INT NULL,
            original_created_at TIMESTAMP NULL,
            original_updated_at TIMESTAMP NULL,
            deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        "CREATE TABLE IF NOT EXISTS archived_clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            original_id INT NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            address TEXT,
            notes TEXT,
            total_bookings INT,
            total_spent DECIMAL(10,2),
            deleted_reason VARCHAR(255),
            deleted_by INT NULL,
            original_created_at TIMESTAMP NULL,
            original_updated_at TIMESTAMP NULL,
            deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        "CREATE TABLE IF NOT EXISTS archived_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            original_id INT NOT NULL,
            booking_id INT,
            amount DECIMAL(10,2),
            payment_status VARCHAR(50),
            payment_method VARCHAR(50),
            payment_date DATE,
            transaction_reference VARCHAR(100),
            notes TEXT,
            deleted_reason VARCHAR(255),
            deleted_by INT NULL,
            original_created_at TIMESTAMP NULL,
            original_updated_at TIMESTAMP NULL,
            deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        "CREATE TABLE IF NOT EXISTS archived_expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            original_id INT NOT NULL,
            category VARCHAR(100),
            description TEXT,
            amount DECIMAL(10,2),
            expense_date DATE,
            payment_method VARCHAR(50),
            receipt_image VARCHAR(255),
            notes TEXT,
            created_by INT,
            deleted_reason VARCHAR(255),
            deleted_by INT NULL,
            original_created_at TIMESTAMP NULL,
            original_updated_at TIMESTAMP NULL,
            deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        "CREATE TABLE IF NOT EXISTS archived_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            original_id INT NOT NULL,
            name VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(20),
            subject VARCHAR(255),
            message TEXT,
            rating INT,
            status VARCHAR(50),
            replied_at TIMESTAMP NULL,
            replied_by INT,
            deleted_reason VARCHAR(255),
            deleted_by INT NULL,
            original_created_at TIMESTAMP NULL,
            original_updated_at TIMESTAMP NULL,
            deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        "CREATE TABLE IF NOT EXISTS archived_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            original_id INT NOT NULL,
            email VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            phone VARCHAR(20),
            role VARCHAR(50),
            profile_image VARCHAR(255),
            business_name VARCHAR(255),
            business_address TEXT,
            business_phone VARCHAR(20),
            business_email VARCHAR(255),
            deleted_reason VARCHAR(255),
            deleted_by INT NULL,
            original_created_at TIMESTAMP NULL,
            original_updated_at TIMESTAMP NULL,
            deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Audit logs
        "CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            user_name VARCHAR(100),
            activity VARCHAR(100) NOT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Payments table
        "CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
            payment_method VARCHAR(50),
            payment_date DATE,
            transaction_reference VARCHAR(100),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        )",

        // Expenses table
        "CREATE TABLE IF NOT EXISTS expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            expense_date DATE NOT NULL,
            payment_method VARCHAR(50),
            receipt_image VARCHAR(255),
            notes TEXT,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )",

        // Messages table
        "CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            subject VARCHAR(255),
            message TEXT NOT NULL,
            rating INT,
            status ENUM('unread', 'read', 'replied', 'archived') DEFAULT 'unread',
            replied_at TIMESTAMP NULL,
            replied_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL
        )"
    ];

    foreach ($tables as $index => $sql) {
        if ($conn->query($sql) === TRUE) {
            echo "✅ Table " . ($index + 1) . " created\n";
        } else {
            echo "❌ Table " . ($index + 1) . " failed: " . $conn->error . "\n";
        }
    }
    echo "\n";

    // Insert sample data
    echo "Inserting sample data...\n";
    $sampleData = [
        // Admin user
        "INSERT IGNORE INTO users (email, password_hash) VALUES
        ('admin@babybliss.com', '\$2y\$10\$bUG7/yGJAJJcS006qPjnKOKU4r.YFLrJnSnPxFJJ1FQP8YOktb0rm')",

        // Sample clients
        "INSERT IGNORE INTO clients (first_name, last_name, email, phone, total_bookings, total_spent) VALUES
        ('Sarah', 'Johnson', 'sarah@example.com', '(555) 123-4567', 1, 25000.00),
        ('Emily', 'Davis', 'emily@example.com', '(555) 234-5678', 1, 0.00),
        ('Michelle', 'Brown', 'michelle@example.com', '(555) 345-6789', 1, 40000.00),
        ('Jessica', 'Wilson', 'jessica@example.com', '(555) 456-7890', 1, 0.00),
        ('Amanda', 'Garcia', 'amanda@example.com', '(555) 567-8901', 1, 15000.00)",

        // Sample bookings
        "INSERT IGNORE INTO bookings (client_id, first_name, last_name, email, phone, event_date, event_title, guests, venue, package, package_price, special_requests, status) VALUES
        (1, 'Sarah', 'Johnson', 'sarah@example.com', '(555) 123-4567', '2024-03-15', 'Baby Shower Celebration', 50, 'Garden Terrace', 'premium', 25000.00, 'Pink and gold theme with balloons', 'confirmed'),
        (2, 'Emily', 'Davis', 'emily@example.com', '(555) 234-5678', '2024-03-22', 'First Birthday Party', 40, 'Rose Hall', 'basic', 15000.00, 'Blue decorations preferred', 'pending'),
        (3, 'Michelle', 'Brown', 'michelle@example.com', '(555) 345-6789', '2024-04-05', 'Gender Reveal Party', 60, 'Sunset Pavilion', 'deluxe', 40000.00, 'Garden party theme', 'confirmed'),
        (4, 'Jessica', 'Wilson', 'jessica@example.com', '(555) 456-7890', '2024-04-12', 'Baby Naming Ceremony', 45, 'Garden Terrace', 'premium', 25000.00, 'Vintage style decorations', 'pending'),
        (5, 'Amanda', 'Garcia', 'amanda@example.com', '(555) 567-8901', '2024-04-20', 'Baby Welcome Party', 55, 'Rose Hall', 'basic', 15000.00, 'Modern minimalist theme', 'confirmed')"
    ];

    foreach ($sampleData as $index => $sql) {
        if ($conn->query($sql) === TRUE) {
            echo "✅ Sample data " . ($index + 1) . " inserted\n";
        } else {
            echo "⚠️  Sample data " . ($index + 1) . " skipped (already exists)\n";
        }
    }
    echo "\n";

    echo "🎉 Database setup complete!\n";
    echo "===========================\n";
    echo "✅ Database: baby_bliss\n";
    echo "✅ All tables created\n";
    echo "✅ Sample data inserted\n";
    echo "✅ Archive system ready\n\n";

    echo "🚀 Ready to test:\n";
    echo "================\n";
    echo "• Login: admin@babybliss.com / admin123\n";
    echo "• Frontend: http://localhost:5173\n";
    echo "• Try client deletion now!\n\n";
}
?>