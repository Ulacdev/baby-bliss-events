<?php
require_once 'api/config.php';

$conn = getDBConnection();

// Get staff user ID
$stmt = $conn->prepare("SELECT id FROM users WHERE email = 'staff@babybliss.com'");
$stmt->execute();
$result = $stmt->get_result();
$staff = $result->fetch_assoc();

if ($staff) {
    echo "Found staff user ID: " . $staff['id'] . "\n";

    // Create an unread message for staff
    $messageStmt = $conn->prepare("INSERT INTO messages (sender_id, recipient_id, message, is_read) VALUES (1, ?, 'Test notification message for staff', 0)");
    $messageStmt->bind_param("i", $staff['id']);
    if ($messageStmt->execute()) {
        echo "Unread message created for staff!\n";
    } else {
        echo "Failed to create message: " . $messageStmt->error . "\n";
    }

    // Create a pending booking (if not exists)
    $bookingCheck = $conn->prepare("SELECT id FROM bookings WHERE assigned_staff_id = ? AND status = 'pending' LIMIT 1");
    $bookingCheck->bind_param("i", $staff['id']);
    $bookingCheck->execute();

    if ($bookingCheck->get_result()->num_rows === 0) {
        // Create a pending booking
        $bookingStmt = $conn->prepare("INSERT INTO bookings (client_id, assigned_staff_id, first_name, last_name, email, event_date, status) VALUES (1, ?, 'Test', 'Client', 'test@example.com', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'pending')");
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

$stmt->close();
$conn->close();
?>