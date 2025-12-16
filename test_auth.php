<?php
require_once 'api/config.php';

echo "Testing authentication...\n";

// Simulate the Authorization header
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer 54f9501449b51dea85bb2b2161d63387c7e523f3056f4eef41c1e856b18050b2';

echo "Available headers:\n";
if (function_exists('getallheaders')) {
    $headers = getallheaders();
    foreach ($headers as $key => $value) {
        echo "$key: $value\n";
    }
} else {
    echo "getallheaders not available\n";
}

echo "\n_SERVER variables:\n";
foreach ($_SERVER as $key => $value) {
    if (strpos($key, 'AUTH') !== false || strpos($key, 'HTTP') !== false) {
        echo "$key: $value\n";
    }
}

$user = authenticateWithToken();

if ($user) {
    echo "Authentication successful: " . json_encode($user) . "\n";
} else {
    echo "Authentication failed\n";
}
?>