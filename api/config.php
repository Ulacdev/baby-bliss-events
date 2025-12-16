<?php
error_reporting(E_ALL);
ini_set('display_errors', 0); // Disable display_errors to prevent HTML error output
ini_set('log_errors', 1);

// Only set headers and handle OPTIONS if not running from CLI
if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json; charset=utf-8');

    // CORS headers for cross-origin requests
    // Allow requests from Vercel domains and localhost
    $allowed_origins = [
        'https://vercel.app',
        'https://*.vercel.app',
        'https://baby-bliss-events.vercel.app',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://localhost:3000',
        'https://babyblissbooking.great-site.net'
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // Check if origin is allowed
    $allowed = false;
    foreach ($allowed_origins as $allowed_origin) {
        if ($allowed_origin === '*' || $origin === $allowed_origin || fnmatch($allowed_origin, $origin)) {
            $allowed = true;
            break;
        }
    }

    // Set CORS headers
    if ($allowed || in_array('*', $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
        header('Access-Control-Allow-Credentials: true');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');

    // Handle preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        exit(0);
    }
}

// Database configuration
if (getenv('MYSQLHOST')) {
    // Railway MySQL environment variables
    define('DB_HOST', getenv('MYSQLHOST'));
    define('DB_USER', getenv('MYSQLUSER'));
    define('DB_PASS', getenv('MYSQLPASSWORD'));
    define('DB_NAME', getenv('MYSQL_DATABASE'));
} elseif (getenv('DATABASE_URL')) {
    // Fallback for other providers
    $url = parse_url(getenv('DATABASE_URL'));
    define('DB_HOST', $url['host']);
    define('DB_USER', $url['user']);
    define('DB_PASS', $url['pass']);
    define('DB_NAME', ltrim($url['path'], '/'));
} else {
    // InfinityFree database configuration
    define('DB_HOST', 'sql100.infinityfree.com');
    define('DB_USER', 'if0_40697563');
    define('DB_PASS', 'nEedRr5f39Aby');
    define('DB_NAME', 'if0_40697563_baby_bliss');
}

// Create database connection
function getDBConnection()
{
    // First try to connect without database to create it if needed
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS);

    if ($conn->connect_error) {
        sendResponse(['error' => 'Database connection failed: ' . $conn->connect_error], 500);
    }

    // Create database if it doesn't exist
    $sql = "CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci";
    if (!$conn->query($sql)) {
        sendResponse(['error' => 'Failed to create database: ' . $conn->error], 500);
    }

    $conn->close();

    // Now connect to the specific database
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if ($conn->connect_error) {
        sendResponse(['error' => 'Database connection failed: ' . $conn->connect_error], 500);
    }

    $conn->set_charset("utf8mb4");

    // Create essential tables if they don't exist
    createEssentialTables($conn);

    return $conn;
}

// Function to create essential tables
function createEssentialTables($conn)
{
    // Users table
    $conn->query("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('admin', 'staff') DEFAULT 'admin',
            session_token VARCHAR(255),
            session_expires DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");

    // Profiles table
    $conn->query("
        CREATE TABLE IF NOT EXISTS profiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            full_name VARCHAR(255),
            phone VARCHAR(20),
            profile_image VARCHAR(500),
            bio TEXT,
            business_name VARCHAR(255),
            business_address TEXT,
            business_phone VARCHAR(20),
            business_email VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");

    // Audit logs table
    $conn->query("
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            user_name VARCHAR(100),
            activity VARCHAR(100) NOT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
}

// Helper function to get JSON input
function getJsonInput()
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    $input = file_get_contents('php://input');

    if (strpos($contentType, 'application/json') !== false) {
        return json_decode($input, true);
    } elseif (strpos($contentType, 'application/x-www-form-urlencoded') !== false) {
        parse_str($input, $data);
        return $data;
    } else {
        // Fallback to JSON, or empty array
        return json_decode($input, true) ?: [];
    }
}

// Email configuration for Gmail SMTP
ini_set('SMTP', 'smtp.gmail.com');
ini_set('smtp_port', '587');
ini_set('sendmail_from', 'your-gmail@gmail.com'); // Replace with your Gmail

// Helper function to send JSON response
function sendResponse($data, $statusCode = 200)
{
    http_response_code($statusCode);
    $json = json_encode($data);
    if ($json === false) {
        // If json_encode fails, send a simple error message
        echo json_encode(['error' => 'Internal server error']);
    } else {
        echo $json;
    }
    exit;
}

// Helper function to validate required fields
function validateRequired($data, $requiredFields)
{
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    return $missing;
}

// Helper function to authenticate using Bearer token
function authenticateWithToken()
{
    // Try different methods to get headers
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
    }

    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ??
        $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ??
        $headers['Authorization'] ??
        $headers['authorization'] ??
        $_SERVER['Authorization'] ??
        $_SERVER['authorization'] ?? '';

    error_log("authenticateWithToken: authHeader = '$authHeader'");

    // Debug: log all possible auth-related server vars
    $authVars = [];
    foreach ($_SERVER as $key => $value) {
        if (strpos(strtoupper($key), 'AUTH') !== false || strpos(strtoupper($key), 'HTTP') !== false) {
            $authVars[$key] = $value;
        }
    }
    error_log("authenticateWithToken: auth vars: " . json_encode($authVars));

    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        error_log("authenticateWithToken: No valid auth header found");
        return null;
    }

    $token = $matches[1];

    // Check token in users table
    $conn = getDBConnection();
    $stmt = $conn->prepare("SELECT id, email, session_expires FROM users WHERE session_token = ? AND session_expires > NOW()");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        return null;
    }

    $user = $result->fetch_assoc();

    $stmt->close();
    $conn->close();

    return [
        'user_id' => $user['id'],
        'email' => $user['email']
    ];
}

// Helper function to log audit trail
function logAudit($activity, $details, $userId = null, $userName = null)
{
    try {
        $conn = getDBConnection();
        $stmt = $conn->prepare("INSERT INTO audit_logs (user_id, user_name, activity, details, ip_address) VALUES (?, ?, ?, ?, ?)");
        $userId = $userId ?? 1;
        $userName = $userName ?? 'Admin';
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $stmt->bind_param("issss", $userId, $userName, $activity, $details, $ipAddress);
        $stmt->execute();
        $stmt->close();
        $conn->close();
    } catch (Exception $e) {
        error_log("Audit log failed: " . $e->getMessage());
    }
}
?>