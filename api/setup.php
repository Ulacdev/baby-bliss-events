<?php
require_once 'config.php';

echo "🔍 Checking database setup...\n\n";

$conn = getDBConnection();

// Check if users table exists
$result = $conn->query("SHOW TABLES LIKE 'users'");
if ($result->num_rows == 0) {
    echo "❌ Users table doesn't exist. Creating...\n";

    // Create users table
    $sql = "CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";

    if ($conn->query($sql) === TRUE) {
        echo "✅ Users table created successfully\n";
    } else {
        echo "❌ Error creating users table: " . $conn->error . "\n";
    }
} else {
    echo "✅ Users table exists\n";
}

// Check if admin user exists
$result = $conn->query("SELECT id FROM users WHERE email = 'admin@babybliss.com'");
if ($result->num_rows == 0) {
    echo "❌ Admin user doesn't exist. Creating...\n";

    // Create admin user
    $passwordHash = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
    $stmt->bind_param("ss", $adminEmail, $passwordHash);
    $adminEmail = 'admin@babybliss.com';

    if ($stmt->execute()) {
        echo "✅ Admin user created: admin@babybliss.com / admin123\n";
    } else {
        echo "❌ Error creating admin user: " . $stmt->error . "\n";
    }
} else {
    echo "✅ Admin user exists\n";
}

// Check if bookings table exists
$result = $conn->query("SHOW TABLES LIKE 'bookings'");
if ($result->num_rows == 0) {
    echo "❌ Bookings table doesn't exist. Creating...\n";

    // Create bookings table
    $sql = "CREATE TABLE bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        event_date DATE NOT NULL,
        guests INT,
        venue VARCHAR(255),
        special_requests TEXT,
        status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";

    if ($conn->query($sql) === TRUE) {
        echo "✅ Bookings table created successfully\n";

        // Insert sample data
        $sampleBookings = [
            ['Sarah', 'Johnson', 'sarah@example.com', '(555) 123-4567', '2024-03-15', 50, 'Garden Terrace', 'Pink and gold theme with balloons', 'confirmed'],
            ['Emily', 'Davis', 'emily@example.com', '(555) 234-5678', '2024-03-22', 40, 'Rose Hall', 'Blue decorations preferred', 'pending'],
            ['Michelle', 'Brown', 'michelle@example.com', '(555) 345-6789', '2024-04-05', 60, 'Sunset Pavilion', 'Garden party theme', 'confirmed'],
            ['Jessica', 'Wilson', 'jessica@example.com', '(555) 456-7890', '2024-04-12', 45, 'Garden Terrace', 'Vintage style decorations', 'pending'],
            ['Amanda', 'Garcia', 'amanda@example.com', '(555) 567-8901', '2024-04-20', 55, 'Rose Hall', 'Modern minimalist theme', 'confirmed']
        ];

        $stmt = $conn->prepare("INSERT INTO bookings (first_name, last_name, email, phone, event_date, guests, venue, special_requests, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

        foreach ($sampleBookings as $booking) {
            $stmt->bind_param("sssssisss", $booking[0], $booking[1], $booking[2], $booking[3], $booking[4], $booking[5], $booking[6], $booking[7], $booking[8]);
            $stmt->execute();
        }

        echo "✅ Sample bookings data inserted\n";
    } else {
        echo "❌ Error creating bookings table: " . $conn->error . "\n";
    }
} else {
    echo "✅ Bookings table exists\n";
}

echo "\n🎉 Database setup complete!\n";
echo "You can now login with: admin@babybliss.com / admin123\n";

$conn->close();
?>