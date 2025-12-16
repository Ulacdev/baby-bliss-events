<?php
// Debug script to test public event access
error_log("=== PUBLIC EVENT DEBUG START ===");

// Simulate the request parameters
$_GET = [
    'id' => '1',
    'public' => '1'
];

$_SERVER['REQUEST_METHOD'] = 'GET';

echo "Testing public event access...\n";
echo "Request Method: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "GET Parameters: " . json_encode($_GET) . "\n";

// Include the bookings.php logic manually to debug
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$allowPublic = false;

// Debug logging
error_log("bookings.php: method=$method, id=$id, GET params=" . json_encode($_GET));

if ($method === 'GET' && isset($_GET['status'])) {
    $allowPublic = true;
    error_log("bookings.php: Allowing public access for status filter");
} elseif ($method === 'POST') {
    $allowPublic = true;
    error_log("bookings.php: Allowing public access for POST");
} elseif ($method === 'GET' && isset($_GET['upcoming'])) {
    $allowPublic = true;
    error_log("bookings.php: Allowing public access for upcoming events");
} elseif ($method === 'GET' && isset($_GET['id']) && isset($_GET['public'])) {
    $allowPublic = true;
    error_log("bookings.php: Allowing public access for individual event with id=$id and public=" . $_GET['public']);
}

error_log("bookings.php: allowPublic=$allowPublic");

echo "Allow Public Access: " . ($allowPublic ? 'YES' : 'NO') . "\n";

if (!$allowPublic) {
    echo "ERROR: Public access should be allowed but it's not!\n";
    echo "Method: $method\n";
    echo "Has ID param: " . (isset($_GET['id']) ? 'YES' : 'NO') . "\n";
    echo "Has public param: " . (isset($_GET['public']) ? 'YES' : 'NO') . "\n";
} else {
    echo "SUCCESS: Public access is allowed as expected\n";
}

error_log("=== PUBLIC EVENT DEBUG END ===");
?>