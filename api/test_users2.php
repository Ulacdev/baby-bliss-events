<?php
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'list') {
    // Simple test response without requiring config.php
    $response = [
        'users' => [
            [
                'id' => 1,
                'email' => 'test@example.com',
                'role' => 'admin',
                'status' => 'active',
                'first_name' => 'Test',
                'last_name' => 'User',
                'full_name' => 'Test User'
            ]
        ]
    ];
    echo json_encode($response);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>