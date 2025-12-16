<?php
// Database connection test with correct credentials
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Use the correct database credentials from config.php
    $host = 'localhost';
    $dbname = 'baby_bliss';
    $username = 'root';
    $password = '';

    echo json_encode([
        'status' => 'info',
        'message' => 'Testing database connection...',
        'credentials' => [
            'host' => $host,
            'database' => $dbname,
            'username' => $username,
            'password_empty' => empty($password)
        ]
    ]);

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo json_encode([
        'status' => 'success',
        'message' => 'Database connection successful!',
        'php_version' => phpversion(),
        'pdo_version' => $pdo->getAttribute(PDO::ATTR_CLIENT_VERSION)
    ]);

    // Test if baby_bliss database exists and has users table
    $stmt = $pdo->query("SELECT DATABASE() as current_db");
    $current_db = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'message' => 'Connected to database: ' . $current_db['current_db']
    ]);

    // Check if users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $users_table_exists = $stmt->rowCount() > 0;

    echo json_encode([
        'status' => 'success',
        'users_table_exists' => $users_table_exists,
        'message' => $users_table_exists ? 'Users table found' : 'Users table not found'
    ]);

    if ($users_table_exists) {
        // Try to get user count
        $stmt = $pdo->query("SELECT COUNT(*) as user_count FROM users");
        $user_count = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'user_count' => $user_count['user_count'],
            'message' => 'Found ' . $user_count['user_count'] . ' users'
        ]);
    }

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage(),
        'error_code' => $e->getCode()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'General error: ' . $e->getMessage()
    ]);
}
?>