<?php
require_once 'config.php';

$conn = getDBConnection();

echo "Starting staff module database migration...\n\n";

// Check if role column exists in users table
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'role'");
if ($result->num_rows === 0) {
    echo "Adding role column to users table...\n";
    $conn->query("ALTER TABLE users ADD COLUMN role ENUM('admin', 'staff', 'client') DEFAULT 'client'");
    echo "✓ Role column added\n\n";
} else {
    echo "✓ Role column already exists\n\n";
}

// Check if assigned_staff_id column exists in bookings table
$result = $conn->query("SHOW COLUMNS FROM bookings LIKE 'assigned_staff_id'");
if ($result->num_rows === 0) {
    echo "Adding assigned_staff_id column to bookings table...\n";
    $conn->query("ALTER TABLE bookings ADD COLUMN assigned_staff_id INT NULL");
    $conn->query("ALTER TABLE bookings ADD CONSTRAINT fk_bookings_staff FOREIGN KEY (assigned_staff_id) REFERENCES users(id)");
    echo "✓ Assigned staff column added\n\n";
} else {
    echo "✓ Assigned staff column already exists\n\n";
}

// Create staff_availability table
$result = $conn->query("SHOW TABLES LIKE 'staff_availability'");
if ($result->num_rows === 0) {
    echo "Creating staff_availability table...\n";
    $conn->query("
        CREATE TABLE staff_availability (
            id INT PRIMARY KEY AUTO_INCREMENT,
            staff_id INT NOT NULL,
            day_of_week TINYINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            is_available BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_staff_day (staff_id, day_of_week)
        )
    ");
    echo "✓ Staff availability table created\n\n";
} else {
    echo "✓ Staff availability table already exists\n\n";
}

// Create staff_notifications table
$result = $conn->query("SHOW TABLES LIKE 'staff_notifications'");
if ($result->num_rows === 0) {
    echo "Creating staff_notifications table...\n";
    $conn->query("
        CREATE TABLE staff_notifications (
            id INT PRIMARY KEY AUTO_INCREMENT,
            staff_id INT NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    echo "✓ Staff notifications table created\n\n";
} else {
    echo "✓ Staff notifications table already exists\n\n";
}

// Create staff_timesheets table (for future use)
$result = $conn->query("SHOW TABLES LIKE 'staff_timesheets'");
if ($result->num_rows === 0) {
    echo "Creating staff_timesheets table...\n";
    $conn->query("
        CREATE TABLE staff_timesheets (
            id INT PRIMARY KEY AUTO_INCREMENT,
            staff_id INT NOT NULL,
            date DATE NOT NULL,
            clock_in TIMESTAMP NULL,
            clock_out TIMESTAMP NULL,
            total_hours DECIMAL(5,2) NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_staff_date (staff_id, date)
        )
    ");
    echo "✓ Staff timesheets table created\n\n";
} else {
    echo "✓ Staff timesheets table already exists\n\n";
}

// Set default admin role for existing admin user
$result = $conn->query("SELECT id FROM users WHERE email = 'admin@babybliss.com' AND (role IS NULL OR role = '')");
if ($result->num_rows > 0) {
    echo "Setting admin role for admin@babybliss.com...\n";
    $conn->query("UPDATE users SET role = 'admin' WHERE email = 'admin@babybliss.com'");
    echo "✓ Admin role set\n\n";
}

// Set default staff role for existing staff user
$result = $conn->query("SELECT id FROM users WHERE email = 'staff@babybliss.com' AND (role IS NULL OR role = '')");
if ($result->num_rows > 0) {
    echo "Setting staff role for staff@babybliss.com...\n";
    $conn->query("UPDATE users SET role = 'staff' WHERE email = 'staff@babybliss.com'");
    echo "✓ Staff role set\n\n";
}

echo "Staff module migration completed successfully!\n\n";
echo "Summary:\n";
echo "- Users table has role column\n";
echo "- Bookings table has assigned_staff_id column\n";
echo "- staff_availability table created\n";
echo "- staff_notifications table created\n";
echo "- staff_timesheets table created\n\n";

echo "Test staff user credentials:\n";
echo "Email: staff@babybliss.com\n";
echo "Password: staff123\n";
echo "Role: staff\n\n";

echo "You can now access the staff panel at /staff/profile\n";
?>