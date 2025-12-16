<?php
// Debug script to check database and events
require_once 'api/config.php';

echo "=== DATABASE DEBUG START ===\n\n";

try {
    // Test database connection
    echo "Testing database connection...\n";
    $conn = getDBConnection();
    echo "✅ Database connection successful\n\n";

    // Check if bookings table exists and get sample data
    echo "Checking bookings table...\n";
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM bookings");
    $stmt->execute();
    $result = $stmt->get_result();
    $count = $result->fetch_assoc()['total'];
    echo "Total bookings in database: $count\n\n";

    if ($count > 0) {
        // Get all bookings with their status
        echo "All bookings in database:\n";
        $stmt = $conn->prepare("SELECT id, first_name, last_name, status, event_date, venue FROM bookings ORDER BY id");
        $stmt->execute();
        $result = $stmt->get_result();

        while ($row = $result->fetch_assoc()) {
            echo "ID: {$row['id']}, Name: {$row['first_name']} {$row['last_name']}, Status: {$row['status']}, Date: {$row['event_date']}, Venue: {$row['venue']}\n";
        }
        echo "\n";

        // Check confirmed events specifically
        echo "Confirmed events only:\n";
        $stmt = $conn->prepare("SELECT id, first_name, last_name, event_date, venue FROM bookings WHERE status = 'confirmed' ORDER BY id");
        $stmt->execute();
        $result = $stmt->get_result();

        $confirmedCount = 0;
        while ($row = $result->fetch_assoc()) {
            echo "✅ CONFIRMED - ID: {$row['id']}, Name: {$row['first_name']} {$row['last_name']}, Date: {$row['event_date']}, Venue: {$row['venue']}\n";
            $confirmedCount++;
        }

        if ($confirmedCount === 0) {
            echo "❌ No confirmed events found - this explains why public API returns 'Event not found'\n";
        } else {
            echo "\n✅ Found $confirmedCount confirmed events that should be visible to public\n";
        }
    } else {
        echo "❌ No bookings found in database - this explains why public API returns 'Event not found'\n";
    }

    $conn->close();

} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}

echo "\n=== DATABASE DEBUG END ===\n";
?>