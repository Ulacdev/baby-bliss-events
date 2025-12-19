<?php
require_once 'api/config.php';

echo "=== CREATING SAMPLE DATA FOR TESTING ===\n\n";

try {
    $conn = getDBConnection();

    // Get staff user ID
    $staffStmt = $conn->prepare("SELECT id FROM users WHERE role = 'staff' LIMIT 1");
    $staffStmt->execute();
    $staffResult = $staffStmt->get_result();

    if ($staffResult->num_rows === 0) {
        echo "❌ No staff user found. Please run create_staff.php first.\n";
        exit(1);
    }

    $staffId = $staffResult->fetch_assoc()['id'];
    echo "Found staff user ID: $staffId\n";

    // Create sample bookings for current month
    $currentMonth = date('Y-m');
    $bookings = [
        [
            'first_name' => 'John',
            'last_name' => 'Smith',
            'email' => 'john.smith@email.com',
            'phone' => '+1234567890',
            'event_date' => date('Y-m-d', strtotime('+5 days')),
            'guests' => 30,
            'venue' => 'Grand Ballroom',
            'package' => 'Premium',
            'package_price' => 15000,
            'status' => 'confirmed',
            'assigned_staff_id' => $staffId
        ],
        [
            'first_name' => 'Maria',
            'last_name' => 'Garcia',
            'email' => 'maria.garcia@email.com',
            'phone' => '+1234567891',
            'event_date' => date('Y-m-d', strtotime('+10 days')),
            'guests' => 25,
            'venue' => 'Garden Pavilion',
            'package' => 'Standard',
            'package_price' => 10000,
            'status' => 'confirmed',
            'assigned_staff_id' => $staffId
        ],
        [
            'first_name' => 'David',
            'last_name' => 'Wilson',
            'email' => 'david.wilson@email.com',
            'phone' => '+1234567892',
            'event_date' => date('Y-m-d', strtotime('+15 days')),
            'guests' => 40,
            'venue' => 'Crystal Hall',
            'package' => 'Deluxe',
            'package_price' => 20000,
            'status' => 'paid',
            'assigned_staff_id' => $staffId
        ]
    ];

    foreach ($bookings as $booking) {
        $stmt = $conn->prepare("INSERT INTO bookings (first_name, last_name, email, phone, event_date, guests, venue, package, package_price, status, assigned_staff_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");

        $stmt->bind_param(
            "sssssissssi",
            $booking['first_name'],
            $booking['last_name'],
            $booking['email'],
            $booking['phone'],
            $booking['event_date'],
            $booking['guests'],
            $booking['venue'],
            $booking['package'],
            $booking['package_price'],
            $booking['status'],
            $booking['assigned_staff_id']
        );

        if ($stmt->execute()) {
            $bookingId = $conn->insert_id;
            echo "✅ Created booking ID $bookingId: {$booking['first_name']} {$booking['last_name']} - ₱{$booking['package_price']}\n";

            // Create payment for this booking
            $paymentStmt = $conn->prepare("INSERT INTO payments (booking_id, amount, payment_status, payment_method, payment_date, created_at) VALUES (?, ?, 'paid', 'cash', NOW(), NOW())");
            $paymentStmt->bind_param("id", $bookingId, $booking['package_price']);

            if ($paymentStmt->execute()) {
                echo "   💰 Created payment of ₱{$booking['package_price']}\n";
            } else {
                echo "   ❌ Failed to create payment: " . $paymentStmt->error . "\n";
            }
            $paymentStmt->close();
        } else {
            echo "❌ Failed to create booking: " . $stmt->error . "\n";
        }
        $stmt->close();
    }

    // Create a sample message for staff
    $messageStmt = $conn->prepare("INSERT INTO messages (sender_id, recipient_id, message, created_at) VALUES (1, ?, 'Hello staff! This is a test message.', NOW())");
    $messageStmt->bind_param("i", $staffId);

    if ($messageStmt->execute()) {
        echo "✅ Created test message for staff\n";
    } else {
        echo "❌ Failed to create message: " . $messageStmt->error . "\n";
    }
    $messageStmt->close();

    $staffStmt->close();
    $conn->close();

    echo "\n=== SAMPLE DATA CREATION COMPLETE ===\n";
    echo "Staff can now see:\n";
    echo "- Bookings assigned to them\n";
    echo "- Monthly revenue from their bookings\n";
    echo "- Unread messages in notifications\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>