<?php
// Create a sample confirmed event for testing public access
require_once 'api/config.php';

echo "=== CREATING SAMPLE CONFIRMED EVENT ===\n\n";

try {
    $conn = getDBConnection();

    // Check if we already have a confirmed event with ID 1
    $checkStmt = $conn->prepare("SELECT id FROM bookings WHERE id = 1");
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo "Event with ID 1 already exists. Updating it to confirmed status...\n";

        // Update the existing event to confirmed status
        $updateStmt = $conn->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = 1");
        if ($updateStmt->execute()) {
            echo "✅ Successfully updated event ID 1 to confirmed status\n";
        } else {
            echo "❌ Failed to update event: " . $updateStmt->error . "\n";
        }
        $updateStmt->close();
    } else {
        echo "Creating a new sample confirmed event...\n";

        // Create a sample confirmed event
        $stmt = $conn->prepare("INSERT INTO bookings (first_name, last_name, email, phone, event_date, guests, venue, package, special_requests, images, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");

        $firstName = "Sarah & Mike";
        $lastName = "Johnson";
        $email = "sarah.johnson@email.com";
        $phone = "+1234567890";
        $eventDate = "2024-12-20";
        $guests = 45;
        $venue = "Garden Terrace Banquet Hall";
        $package = "Premium";
        $specialRequests = "We would love a butterfly theme with pastel colors. Please include a special dessert table with custom cupcakes. We expect around 45 guests and would appreciate a photo booth setup.";
        $images = json_encode(["https://images.unsplash.com/photo-1530047625168-4b29bfbbe1fc?w=800"]);

        $stmt->bind_param("sssssisssss", $firstName, $lastName, $email, $phone, $eventDate, $guests, $venue, $package, $specialRequests, $images);

        if ($stmt->execute()) {
            $eventId = $conn->insert_id;
            echo "✅ Successfully created confirmed event with ID: $eventId\n";
            echo "   Name: $firstName $lastName\n";
            echo "   Date: $eventDate\n";
            echo "   Venue: $venue\n";
            echo "   Guests: $guests\n";
            echo "   Package: $package\n";
        } else {
            echo "❌ Failed to create event: " . $stmt->error . "\n";
        }

        $stmt->close();
    }

    $checkStmt->close();
    $conn->close();

    echo "\n=== SAMPLE EVENT CREATION COMPLETE ===\n";
    echo "Now visitors should be able to see event details at /event/1\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>