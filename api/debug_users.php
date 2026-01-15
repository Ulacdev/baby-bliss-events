<?php
require_once 'config.php';

echo "Testing users API...\n";

// Test database connection
try {
    $conn = getDBConnection();
    echo "Database connection successful\n";
} catch (Exception $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
    exit;
}

// Test authentication
$token = "21ca4e7b3384e93be1c9d1fdb7dc077baef06d061e98b545541b763a8dfd35cb";
$_SERVER['HTTP_AUTHORIZATION'] = "Bearer $token";

$user = authenticateWithToken();
if ($user) {
    echo "Authentication successful for user: " . $user['email'] . "\n";
} else {
    echo "Authentication failed\n";
    exit;
}

// Test query
try {
    $stmt = $conn->prepare("
        SELECT
            u.id,
            u.email,
            u.role,
            u.created_at,
            u.updated_at,
            p.first_name,
            p.last_name,
            p.full_name,
            p.phone,
            CASE WHEN u.session_token IS NOT NULL AND u.session_expires > NOW() THEN 'active' ELSE 'inactive' END as status
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        ORDER BY u.created_at DESC
    ");

    if (!$stmt->execute()) {
        echo "Query execution failed: " . $stmt->error . "\n";
        exit;
    }

    $result = $stmt->get_result();
    $users = [];

    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }

    echo "Query successful, found " . count($users) . " users\n";
    echo "Sample user data:\n";
    if (count($users) > 0) {
        print_r($users[0]);
    }

} catch (Exception $e) {
    echo "Query failed: " . $e->getMessage() . "\n";
}
?>