<?php
// Simple test to verify everything is working
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

echo json_encode([
    'status' => 'success',
    'message' => 'PHP is working!',
    'php_version' => phpversion(),
    'timestamp' => date('Y-m-d H:i:s'),
    'endpoints' => [
        'list_users' => '/simple_users_test.php?action=list',
        'update_user' => '/simple_users_test.php?action=update (POST)'
    ]
]);
?>