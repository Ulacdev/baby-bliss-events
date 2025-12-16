<?php
/**
 * Baby Bliss API Setup & Diagnostic Script
 * Upload this single file to test if the server is working
 * Then we can use it to set up the rest
 */

// Simple CORS headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$action = $_GET['action'] ?? 'diagnose';

switch ($action) {
    case 'diagnose':
        $response = [
            'status' => 'success',
            'message' => 'API is accessible!',
            'server_info' => [
                'php_version' => phpversion(),
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
                'script_filename' => __FILE__,
                'current_path' => dirname(__FILE__),
            ],
            'database_test' => testDatabase(),
            'timestamp' => date('Y-m-d H:i:s'),
        ];
        break;

    case 'db_test':
        $response = testDatabase();
        break;

    default:
        $response = [
            'status' => 'success',
            'message' => 'Setup script active',
            'actions' => [
                '?action=diagnose' => 'Full system diagnostic',
                '?action=db_test' => 'Test database connection only',
            ]
        ];
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

function testDatabase()
{
    // InfinityFree database credentials
    $db_host = 'sql100.infinityfree.com';
    $db_user = 'if0_40697563';
    $db_pass = 'nEedRr5f39Aby';
    $db_name = 'if0_40697563_baby_bliss';

    $result = [
        'database' => [
            'host' => $db_host,
            'user' => $db_user,
            'database' => $db_name,
        ]
    ];

    try {
        $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

        if ($conn->connect_error) {
            $result['status'] = 'error';
            $result['message'] = 'Database connection failed: ' . $conn->connect_error;
            return $result;
        }

        // Test query
        $query = "SELECT COUNT(*) as count FROM users";
        $result_query = $conn->query($query);

        if ($result_query) {
            $row = $result_query->fetch_assoc();
            $result['status'] = 'success';
            $result['message'] = 'Database connected successfully!';
            $result['users_count'] = $row['count'];
            $result['tables_check'] = 'Users table exists ✓';
        } else {
            $result['status'] = 'success';
            $result['message'] = 'Database connected (but tables may not exist yet)';
            $result['note'] = 'Tables will be created automatically when auth.php is called';
        }

        $conn->close();
    } catch (Exception $e) {
        $result['status'] = 'error';
        $result['message'] = 'Exception: ' . $e->getMessage();
    }

    return $result;
}
?>