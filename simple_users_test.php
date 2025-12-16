<?php
// Simple Users API Test - Bypass Complex Logic
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Simple config without complex includes
    $host = 'localhost';
    $dbname = 'baby_bliss';
    $username = 'root';
    $password = '';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get action from request
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        $stmt = $pdo->query("SELECT u.id, u.username, u.email, u.role, u.created_at, p.first_name, p.last_name, p.phone FROM users u LEFT JOIN profiles p ON u.id = p.user_id ORDER BY u.id");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'users' => $users,
            'count' => count($users)
        ]);

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

        // Start transaction
        $pdo->beginTransaction();

        try {
            // Update user
            $stmt = $pdo->prepare("UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?");
            $result = $stmt->execute([$username, $email, $role, $id]);

            // Update or insert profile
            $full_name = $first_name && $last_name ? $first_name . ' ' . $last_name : null;
            $stmt2 = $pdo->prepare("INSERT INTO profiles (user_id, first_name, last_name, full_name, phone, updated_at) VALUES (?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), full_name = VALUES(full_name), phone = VALUES(phone), updated_at = NOW()");
            $stmt2->execute([$id, $first_name, $last_name, $full_name, $phone]);

            $pdo->commit();

            echo json_encode([
                'status' => 'success',
                'message' => 'User updated successfully',
                'user_id' => $id
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
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