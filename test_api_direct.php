<?php
// Test the public events API directly
echo "=== TESTING PUBLIC EVENTS API ===\n\n";

// Test different event IDs
$testIds = [1, 2, 3, 999];

foreach ($testIds as $id) {
    echo "Testing event ID: $id\n";
    echo str_repeat("-", 30) . "\n";

    // Simulate the API call
    $_GET['id'] = $id;

    try {
        // Capture output
        ob_start();

        // Include the public events logic
        $method = 'GET';
        $conn = getDBConnection();

        // Get event details - only return confirmed events
        $stmt = $conn->prepare("SELECT id, first_name, last_name, event_date, venue, guests, package, special_requests, images, status FROM bookings WHERE id = ? AND status = 'confirmed'");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo "❌ No confirmed event found for ID: $id\n";
        } else {
            $event = $result->fetch_assoc();
            echo "✅ Found confirmed event:\n";
            echo "   Name: {$event['first_name']} {$event['last_name']}\n";
            echo "   Date: {$event['event_date']}\n";
            echo "   Venue: {$event['venue']}\n";
            echo "   Guests: {$event['guests']}\n";
            echo "   Package: {$event['package']}\n";
        }

        $stmt->close();
        $conn->close();

        $output = ob_get_clean();
        echo $output;

    } catch (Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }

    echo "\n";
}

echo "=== API TEST COMPLETE ===\n";
?>