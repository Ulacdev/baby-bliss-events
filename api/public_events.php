<?php
require_once 'config.php';

// This is a dedicated public endpoint for event details that bypasses all authentication
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

error_log("public_events.php: method=$method, id=$id, GET params=" . json_encode($_GET));

// Only allow GET requests for public event details
if ($method !== 'GET') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

if (!$id || !is_numeric($id)) {
    sendResponse(['error' => 'Event ID is required'], 400);
}

try {
    $conn = getDBConnection();
    
    // Get event details - only return confirmed events
    $stmt = $conn->prepare("SELECT id, first_name, last_name, event_date, venue, guests, package, special_requests, images, status FROM bookings WHERE id = ? AND status = 'confirmed'");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        error_log("public_events.php: No confirmed event found for id=$id");
        sendResponse(['error' => 'Event not found'], 404);
    }
    
    $event = $result->fetch_assoc();
    error_log("public_events.php: Retrieved event: " . json_encode($event));
    
    $stmt->close();
    $conn->close();
    
    sendResponse(['booking' => $event]);
    
} catch (Exception $e) {
    error_log("public_events.php: Error: " . $e->getMessage());
    sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>