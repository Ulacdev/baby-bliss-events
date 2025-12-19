<?php
require_once 'api/config.php';

$conn = getDBConnection();

// Check current messages table structure
$result = $conn->query("DESCRIBE messages");
$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row['Field'];
}

echo "Current messages table columns:\n";
print_r($columns);

// Check if we need to add columns for internal messaging
$columnsToAdd = [];
if (!in_array('sender_id', $columns)) {
    $columnsToAdd[] = "ADD COLUMN sender_id INT DEFAULT NULL";
}
if (!in_array('recipient_id', $columns)) {
    $columnsToAdd[] = "ADD COLUMN recipient_id INT DEFAULT NULL";
}
if (!in_array('is_read', $columns)) {
    $columnsToAdd[] = "ADD COLUMN is_read TINYINT(1) DEFAULT 0";
}

if (!empty($columnsToAdd)) {
    echo "\nAdding missing columns...\n";
    $alterQuery = "ALTER TABLE messages " . implode(', ', $columnsToAdd);
    echo "Executing: $alterQuery\n";

    if ($conn->query($alterQuery)) {
        echo "Columns added successfully!\n";
    } else {
        echo "Failed to add columns: " . $conn->error . "\n";
    }
} else {
    echo "\nAll required columns already exist.\n";
}

// Create some test data for staff notifications
echo "\nCreating test notifications...\n";

// Get staff user ID
$stmt = $conn->prepare("SELECT id FROM users WHERE email = 'staff@babybliss.com'");
$stmt->execute();
$result = $stmt->get_result();
$staff = $result->fetch_assoc();

if ($staff) {
    echo "Found staff user ID: " . $staff['id'] . "\n";

    // Create an unread internal message for staff
    $messageStmt = $conn->prepare("INSERT INTO messages (sender_id, recipient_id, message, is_read, created_at) VALUES (1, ?, 'Test internal message for staff', 0, NOW())");
    $messageStmt->bind_param("i", $staff['id']);
    if ($messageStmt->execute()) {
        echo "Internal message created for staff!\n";
    } else {
        echo "Failed to create message: " . $messageStmt->error . "\n";
    }

    // Create a pending booking (if not exists)
    $bookingCheck = $conn->prepare("SELECT id FROM bookings WHERE assigned_staff_id = ? AND status = 'pending' LIMIT 1");
    $bookingCheck->bind_param("i", $staff['id']);
    $bookingCheck->execute();

    if ($bookingCheck->get_result()->num_rows === 0) {
        // Create a pending booking
        $bookingStmt = $conn->prepare("INSERT INTO bookings (client_id, assigned_staff_id, first_name, last_name, email, event_date, status, created_at) VALUES (1, ?, 'Test', 'Client', 'test@example.com', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'pending', NOW())");
        $bookingStmt->bind_param("i", $staff['id']);
        if ($bookingStmt->execute()) {
            echo "Pending booking created for staff!\n";
        } else {
            echo "Failed to create booking: " . $bookingStmt->error . "\n";
        }
    } else {
        echo "Pending booking already exists for staff.\n";
    }

} else {
    echo "Staff user not found!\n";
}

$conn->close();
?>