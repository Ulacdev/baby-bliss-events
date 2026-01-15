<?php
// Simple Users API Test - Bypass Complex Logic
error_reporting(E_ALL);
ini_set('display_errors', 0); // Disable to prevent HTML error output
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    error_log("simple_users_test.php: Starting execution");

    // Simple config without complex includes
    $host = 'localhost';
    $dbname = 'baby_bliss';
    $username = 'root';
    $password = '';

    error_log("simple_users_test.php: Connecting to database");

    // First try to connect to MySQL without database to create it if needed
    $conn_temp = new mysqli($host, $username, $password);
    if ($conn_temp->connect_error) {
        throw new Exception('MySQL connection failed: ' . $conn_temp->connect_error);
    }
    $conn_temp->query("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
    $conn_temp->close();
    error_log("simple_users_test.php: Database created or already exists");

    $conn = new mysqli($host, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");
    error_log("simple_users_test.php: Database connected successfully");

    // Create tables if they don't exist
    $conn->query("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('admin', 'staff') DEFAULT 'admin',
            profile_image VARCHAR(500) DEFAULT NULL,
            session_token VARCHAR(255),
            session_expires DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
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

    // Add profile_image column if it doesn't exist (for existing tables)
    $conn->query("ALTER TABLE profiles ADD COLUMN profile_image VARCHAR(500) DEFAULT NULL");
    $conn->query("ALTER TABLE profiles ADD COLUMN bio TEXT DEFAULT NULL");
    $conn->query("ALTER TABLE profiles ADD COLUMN business_name VARCHAR(255) DEFAULT NULL");
    $conn->query("ALTER TABLE profiles ADD COLUMN business_address TEXT DEFAULT NULL");
    $conn->query("ALTER TABLE profiles ADD COLUMN business_phone VARCHAR(20) DEFAULT NULL");
    $conn->query("ALTER TABLE profiles ADD COLUMN business_email VARCHAR(255) DEFAULT NULL");
    error_log("simple_users_test.php: Tables created or already exist");

    // Get action from request
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        $result = $conn->query("SELECT u.id, u.profile_image as user_profile_image, CONCAT(COALESCE(p.first_name, ''), '.', COALESCE(p.last_name, '')) as username, u.email, u.role, u.created_at, p.first_name, p.last_name, p.phone, p.profile_image as profile_profile_image FROM users u LEFT JOIN profiles p ON u.id = p.user_id ORDER BY u.id");
        $users = [];
        while ($row = $result->fetch_assoc()) {
            // Use user profile image for admin users only
            $profileImage = null;
            if ($row['role'] === 'admin') {
                $profileImage = $row['user_profile_image'] ?? '/logo.jpg'; // Default for admins
            }

            $users[] = [
                'id' => $row['id'],
                'username' => $row['username'],
                'email' => $row['email'],
                'role' => $row['role'],
                'created_at' => $row['created_at'],
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
                'phone' => $row['phone'],
                'profile_image' => $profileImage
            ];
        }

        $response = json_encode([
            'status' => 'success',
            'users' => $users,
            'count' => count($users)
        ]);

        echo $response;

    } elseif ($action === 'update') {
        // Get POST data
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['id']) || !isset($input['username']) || !isset($input['email'])) {
            throw new Exception('Missing required fields: id, username, email');
        }

        $id = (int) $input['id'];
        $username = $input['username'];
        $email = $input['email'];
        $role = $input['role'] ?? 'staff';
        $first_name = $input['first_name'] ?? '';
        $last_name = $input['last_name'] ?? '';
        $phone = $input['phone'] ?? '';
        $password = $input['password'] ?? null;
        $profile_image = ($role === 'admin') ? ($input['profile_image'] ?? null) : null;

        // Start transaction
        $conn->begin_transaction();

        try {
            // Update user
            if ($password) {
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                if ($role === 'admin' && $profile_image !== null) {
                    $stmt = $conn->prepare("UPDATE users SET email = ?, password_hash = ?, role = ?, profile_image = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->bind_param("ssssi", $email, $passwordHash, $role, $profile_image, $id);
                } else {
                    $stmt = $conn->prepare("UPDATE users SET email = ?, password_hash = ?, role = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->bind_param("sssi", $email, $passwordHash, $role, $id);
                }
            } else {
                if ($role === 'admin' && $profile_image !== null) {
                    $stmt = $conn->prepare("UPDATE users SET email = ?, role = ?, profile_image = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->bind_param("sssi", $email, $role, $profile_image, $id);
                } else {
                    $stmt = $conn->prepare("UPDATE users SET email = ?, role = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->bind_param("ssi", $email, $role, $id);
                }
            }
            $stmt->execute();

            // Update profile if exists
            $full_name = $first_name && $last_name ? $first_name . ' ' . $last_name : null;
            $profile_image = $input['profile_image'] ?? null;
            $stmt2 = $conn->prepare("UPDATE profiles SET first_name = ?, last_name = ?, full_name = ?, phone = ?, profile_image = ?, updated_at = NOW() WHERE user_id = ?");
            $stmt2->bind_param("sssssi", $first_name, $last_name, $full_name, $phone, $profile_image, $id);
            $stmt2->execute();

            $conn->commit();

            echo json_encode([
                'message' => 'User updated successfully',
                'user' => [
                    'id' => $id,
                    'email' => $email,
                    'role' => $role,
                    'first_name' => $first_name,
                    'last_name' => $last_name,
                    'full_name' => $full_name,
                    'phone' => $phone
                ]
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }

    } else {
        throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>