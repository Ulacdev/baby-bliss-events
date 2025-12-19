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

    // Create a sample booking assigned to staff
    $stmt2 = $conn->prepare("INSERT INTO bookings (client_id, assigned_staff_id, first_name, last_name, email, phone, event_date, venue, package, special_requests, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $client_id = NULL; // No client, just a direct booking
    $first_name = 'John';
    $last_name = 'Doe';
    $email = 'john@example.com';
    $phone = '555-0123';
    $event_date = date('Y-m-d', strtotime('+2 days'));
    $venue = 'Sample Venue';
    $package = 'premium';
    $special_requests = 'Assigned to staff for testing';
    $status = 'confirmed';

    $stmt2->bind_param("sisssssssss", $client_id, $staff['id'], $first_name, $last_name, $email, $phone, $event_date, $venue, $package, $special_requests, $status);

    if ($stmt2->execute()) {
        echo "Sample booking created for staff user!\n";
        echo "Booking Date: " . $event_date . "\n";
        echo "Status: " . $status . "\n";
    } else {
        echo "Failed to create booking: " . $stmt2->error . "\n";
    }
} else {
    echo "Staff user not found! Make sure to run create_staff.php first.\n";
}

$stmt->close();
$conn->close();
?>